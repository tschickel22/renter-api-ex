require 'xmlsimple'

class Api::UnitsController < Api::ApiController
  skip_before_action :verify_authenticity_token, only: [:list_for_property]

  def model_class
    Unit
  end

  def setup_new_object()
    model_class().new(status: Unit::STATUS_VACANT)
  end

  def index
    units = Unit.includes(leases: [:property, primary_resident: :resident]).for_user(current_user).where(property_id: params[:property_id])
    render_json({ units: units.collect{|u| u.to_builder("full").attributes! }  })
  end

  def show
    render_json({ singular_object_key() => Unit.for_user(current_user).where(primary_key_field() => params[:id]).first.to_builder("full").attributes! })
  end

  def destroy
    # Units cannot be destroyed if there are leases attached
    load_object_for_update()

    if @object.leases.empty?
      @object.destroy

      handle_after_create()

      render_successful_update()
    else
      render_json({errors: {base: "You cannot delete a unit with leases"}}, false)
    end
  end


    def search
    units = Unit.includes(leases: [:property, primary_resident: :resident]).for_user(current_user)
    units = units.where(["unit_number like :search_text", {search_text: "%#{params[:search_text]}%"}]) if !params[:search_text].blank?
    units = units.where(property_id: params[:property_id]) if !params[:property_id].blank?
    units = units.where(status: params[:status]) if !params[:status].blank? && params[:status] != 'all'
    render_json({ units: units.collect{|u| u.to_builder("full").attributes! }  })
  end

  def handle_after_create()
    @object.property.touch
    @object.property.company.touch
  end

  # This is leveraged by MSI to pull a list of our units
  def list_for_property
    Rails.logger.error("MSI: ")
    Rails.logger.error(request.raw_post)

    # Parse the XML
    data = XmlSimple.xml_in(request.raw_post)
    data.deep_symbolize_keys!

    username = ApiProcessor.read_xml_string(data, 'SignonRq/SignonPswd/CustId/CustLoginId')
    password = ApiProcessor.read_xml_string(data, 'SignonRq/SignonPswd/CustPswd/Pswd')
    property_id = ApiProcessor.read_xml_string(data, 'InsuranceSvcRq/RenterPolicyQuoteInqRq/MSI_CommunityAddressRq/MSI_CommunityID')

    if username == Rails.application.credentials.dig(:msi, :webhook_username)
      if Rails.application.credentials.dig(:msi, :webhook_password) == password
        # Authenticated! We can run our search
        if !property_id.blank?
          property = Property.where(external_insurance_id: property_id).first

          if property.present?
            api_response = {Status: {StatusCd: "Success", StatusMessage: {}}, Community: {Address: property.units.collect{|u| {Street_Address: u.street, Apt_Number: u.unit_number, Agency_UnitID: u.id}}}}
          else
            api_response = {Status: {StatusCd: "Error", StatusMessage: "Property #{property_id} not found"}}
          end
        else
          api_response = {Status: {StatusCd: "Error", StatusMessage: "Missing InsuranceSvcRq/RenterPolicyQuoteInqRq/MSI_CommunityAddressRq/MSI_CommunityID element"}}
        end
      else
        api_response = {Status: {StatusCd: "Error", StatusMessage: "Unauthorized"}}
      end
    else
      api_response = {Status: {StatusCd: "Error", StatusMessage: "Unauthorized access"}}
    end

    render xml: XmlSimple.xml_out(api_response, rootname: "GetPropertyDetails_Response_XML", AttrPrefix: true)
  end

  protected

  def object_params
    pp = params.require(:unit).permit(Unit.public_fields()) || {}

    return pp
  end

end