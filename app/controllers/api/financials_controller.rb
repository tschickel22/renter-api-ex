class Api::FinancialsController < Api::ApiController

  def summary
    leases = Lease.for_user(current_user).includes([{primary_resident: :resident}, :unit])
    lease_ids = leases.collect{|l| l.id}

    start_date = params[:start_date].blank? ? todays_date() - 30.days : Date.strptime(params[:start_date], '%m/%d/%Y')
    end_date = params[:end_date].blank? ? todays_date() : Date.strptime(params[:end_date], '%m/%d/%Y')

    ledger_items = ResidentLedgerItem.as_of(Date.today).includes(:related_object, {lease: [:property, :unit, primary_resident: :resident]}).where(lease_id: lease_ids)
    ledger_items = ledger_items.where(property_id: params[:property_id]) if !params[:property_id].blank?
    ledger_items = ledger_items.joins({lease: {lease_residents: :resident}}).where(["concat(residents.first_name, ' ', residents.last_name) like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?

    # Organize by lease
    summaries = ledger_items.inject({}) do | acc, ledger_item |
      lease_hash_id = ledger_item.lease.hash_id

      acc[lease_hash_id] = {
        lease_hash_id: lease_hash_id,
        lease_status: ledger_item.lease.status,
        primary_resident_hash_id: ledger_item.lease.primary_resident.hash_id,
        resident_first_name: ledger_item.lease.primary_resident.resident.first_name,
        resident_last_name: ledger_item.lease.primary_resident.resident.last_name,
        property_and_unit: ledger_item.lease.property_and_unit,
        unit_number: ledger_item.lease.unit.unit_number,
        future_due_on: nil,
        future_amount: 0,
        paid_on: nil, # MOST RECENT
        paid_amount: 0,
        past_due_on: nil,
        past_amount: 0
      } if acc[lease_hash_id].nil?

      if ledger_item.transaction_at.in_time_zone('US/Mountain').to_date >= start_date && ledger_item.transaction_at.in_time_zone('US/Mountain').to_date <= end_date
        if ledger_item.related_object_type == Charge.to_s
          acc[lease_hash_id][:future_due_on] = ledger_item.transaction_at.in_time_zone('US/Mountain').to_date if acc[lease_hash_id][:future_due_on].nil? || acc[lease_hash_id][:future_due_on] > ledger_item.transaction_at.in_time_zone('US/Mountain').to_date # EARLIEST# EARLIEST
          acc[lease_hash_id][:future_amount] += ledger_item.amount
        elsif ledger_item.related_object_type == Payment.to_s || ledger_item.related_object_type == PaymentReturn.to_s
          acc[lease_hash_id][:paid_on] = ledger_item.transaction_at.in_time_zone('US/Mountain').to_date if acc[lease_hash_id][:paid_on].nil? || acc[lease_hash_id][:paid_on] > ledger_item.transaction_at.in_time_zone('US/Mountain').to_date # EARLIEST# EARLIEST
          acc[lease_hash_id][:paid_amount] += ledger_item.amount
        end
      end

      if ledger_item.related_object_type == Charge.to_s
        acc[lease_hash_id][:past_due_on] = ledger_item.transaction_at.in_time_zone('US/Mountain').to_date if acc[lease_hash_id][:past_due_on].nil? || acc[lease_hash_id][:past_due_on] < ledger_item.transaction_at.in_time_zone('US/Mountain').to_date # EARLIEST# EARLIEST
        acc[lease_hash_id][:past_amount] += ledger_item.amount
      elsif ledger_item.related_object_type == Payment.to_s || ledger_item.related_object_type == PaymentReturn.to_s
        acc[lease_hash_id][:past_amount] += ledger_item.amount
      end

      acc
    end

    transactions = ledger_items.inject([]) do | acc, ledger_item |
      if [Charge.to_s].include?(ledger_item.related_object_type) || !(ledger_item.transaction_at.in_time_zone('US/Mountain').to_date >= start_date && ledger_item.transaction_at.in_time_zone('US/Mountain').to_date <= end_date)
        acc
      else

        row = {
          lease_hash_id: ledger_item.lease.hash_id,
          lease_status: ledger_item.lease.status,
          primary_resident_hash_id: ledger_item.lease.primary_resident.hash_id,
          resident_first_name: ledger_item.lease.primary_resident.resident.first_name,
          resident_last_name: ledger_item.lease.primary_resident.resident.last_name,
          property_and_unit: ledger_item.lease.property_and_unit,
          unit_number: ledger_item.lease.unit.unit_number,
          future_due_on: nil,
          amount: ledger_item.amount,
          payment_method: (ledger_item.related_object.payment_method.present? ? ledger_item.related_object.payment_method.method : (ledger_item.related_object.is_manual? ? "Manual" : "Unknown")),
          payment_method_extra: (ledger_item.related_object.payment_method.present? ? ledger_item.related_object.payment_method.nickname : (ledger_item.related_object.is_manual? ? ledger_item.related_object.extra_info : "")),
          paid_on: ledger_item.transaction_at,
          status: ledger_item.related_object.status
        }

        acc << row

        acc
      end
    end

    render_json({start_date: start_date, end_date: end_date, summaries: summaries.values, transactions: transactions})
  end

end