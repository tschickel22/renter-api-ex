class Api::VendorsController < Api::ApiController

  def model_class
    Vendor
  end

  def perform_search(vendors)
    vendors.where(["name like :search_text or email like :search_text or phone_number like :search_text", {search_text: "%#{params[:search_text]}%"}]).order(:name)
  end

  def save_vendor_category
    vendor_category_params = params.require(:vendor_category).permit(VendorCategory.public_fields)
    vendor_cateogry = VendorCategory.new(vendor_category_params)
    vendor_cateogry.company_id = current_user.company_id
    vendor_cateogry.save

    render_json({vendor_category: vendor_cateogry}, true)

  end

  def handle_after_create

    # Move over any unattached files
    @object.vendor_insurances.each do | vendor_insurance |
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: vendor_insurance.declarations_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = VendorInsurance.to_s
          f.record_id = vendor_insurance.id
          f.name = "declarations"
          f.save
        end
      end
    end

    @object.vendor_licenses.each do | vendor_license |
      unattached_file_batch = UnattachedFileBatch.where(user_id: current_user.id, batch_number: vendor_license.licenses_batch_number).first

      if unattached_file_batch.present?
        unattached_file_batch.files.each do | f |
          f.record_type = VendorLicense.to_s
          f.record_id = vendor_license.id
          f.name = "licenses"
          f.save
        end
      end
    end
  end

  def destroy
    load_object_for_update

    # Look for any expenses tracked for this vendor. If they exist, we cannot delete
    if !Expense.where(vendor_id: @object.id).exists?
      if @object.destroy
        render_successful_update()
        return
      end
    else
      @object.errors.add(:base, "Cannot delete vendor. Expenses for this Vendor exist.")
    end

    render_failed_update
  end

  protected

  def object_params
    vp = params.require(:vendor).permit(Vendor.public_fields + [vendor_insurances: [VendorInsurance.public_fields + [:declarations_batch_number, :_destroy]], vendor_licenses: [VendorLicense.public_fields + [:licenses_batch_number, :_destroy]]])

    vp[:vendor_insurances_attributes] = vp.delete(:vendor_insurances).collect{|vi| parse_number_param(vi, [:liability_limit])} if vp[:vendor_insurances].present?
    vp[:vendor_licenses_attributes] = vp.delete(:vendor_licenses) if vp[:vendor_licenses].present?

    return vp
  end
end