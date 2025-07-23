class Api::InvoicesController < Api::ApiController

  def model_class
    Invoice
  end

  def primary_key_field
    :hash_id
  end

  def perform_search(invoices)
    invoices = invoices.joins(:lease).where(lease: {hash_id: params[:lease_id]})

    if invoices.empty?
      lease = Lease.where(hash_id: params[:lease_id]).first

      GenerateInvoices.generate_past_invoices(lease)
    end
    
    invoices.each{ |invoice| invoice.prepare_for_display}

    return invoices
  end

  def show
    invoice = Invoice.for_user(current_user).where(primary_key_field() => params[:id]).first
    invoice.prepare_for_display()

    if current_user.is_resident?
      lease_resident = invoice.lease.lease_residents.where(resident_id: current_user.resident.id).first
    else
      lease_resident = invoice.lease.primary_resident
    end

    cash_payment_method = ResidentPaymentMethod.ensure_cash_method(lease_resident)

    render_json({ invoice: invoice, lease_resident: lease_resident, cash_payment_method: cash_payment_method, recurring_payment_method: lease_resident.recurring_payment_method})
  end

  protected

  def object_params
    params.require(:invoice).permit(Invoice.public_fields)
  end

end