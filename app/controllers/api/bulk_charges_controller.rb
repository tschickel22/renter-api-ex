require 'xmlsimple'

class Api::BulkChargesController < Api::ApiController
  skip_before_action :verify_authenticity_token

  def primary_key_field
    "hash_id"
  end

  def model_class
    BulkCharge
  end

  def perform_search(bulk_charges)
    bulk_charges.includes(bulk_charge_leases: {lease: [{primary_resident: :resident}, :property, :unit]}).where(["description like :search_text", {search_text: "%#{params[:search_text]}%"}])
  end

  def save_leases
    load_object_for_update()

    if params[:bulk_charge].present? && !params[:bulk_charge][:bulk_charge_leases].blank?

      @object.assign_attributes(bulk_charge_lease_params())

      if @object.save

        # Now, generate the actual charges
        @object.generate_charges()

        render_successful_update()
      else
        render_failed_update()
      end

    else
      render_json({errors: {base: "No leases selected"}}, false)
    end
  end

  def destroy
    load_object_for_update()

    # Can we destroy this?
    if @object.due_on > Date.today
      @object.destroy
      render_json({}, true)
    else
      render_json({errors: {base: "Cannot delete this bulk charge"}}, false)
    end

  end

  protected

  def object_params
    pp = parse_number_param(params.require(:bulk_charge).permit(BulkCharge.public_fields()) || {}, [:amount])

    return pp
  end

  def bulk_charge_lease_params
    arp = {bulk_charge_leases_attributes: params.require(:bulk_charge).permit([bulk_charge_leases: [[:id] + BulkChargeLease.public_fields()]])[:bulk_charge_leases]}

    arp[:bulk_charge_leases_attributes].each_with_index do | bcla, index |
      bcla[:company_id] = current_user.company_id
      arp[:bulk_charge_leases_attributes][index] = parse_number_param(bcla, [:amount])
    end

    check_for_removals(arp[:bulk_charge_leases_attributes], @object.bulk_charge_leases)

    return arp
  end


  end