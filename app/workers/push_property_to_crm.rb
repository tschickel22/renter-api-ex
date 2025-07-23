include WorkerHelper

class PushPropertyToCrm
  def self.enqueue(property_id)
    Resque.enqueue_to("crm", self, property_id)
  end

  def self.perform(property_id = nil)
    if property_id.nil?
      Property.joins(:company).where("LENGTH(companies.external_crm_id) > 0 AND properties.updated_at > now() - INTERVAL 1 DAY").each do | property |
        if !Rails.env.development?
          PushPropertyToCrm.enqueue(property.id)
        end
      end
    else
      property = Property.find(property_id)
      PushPropertyToCrm.push_data_to_crm(property)
      PushCompanyToCrm.push_data_to_crm(property.company)
      PushCompanyToCrm.ensure_correct_property_add_ons(property.company)
    end
  end

  def self.push_data_to_crm(property)
    crm_data = {
      Parent_Account: property.company.external_crm_id,
      Account_Name: property.name,
      Billing_Street: property.street,
      Billing_City: property.city,
      Billing_State: property.state,
      Billing_Code: property.zip,
      Number_of_Units: property.units.count,
      Account_Status: (property.deleted_at.nil? && property.status == Property::STATUS_ACTIVE ? "Active" : "In-Active")
    }

    if property.external_crm_id.blank?
      result = RenterInsightZohoApi.new.create_account(crm_data)

      # Stash the ID
      property.external_crm_id = result[:data].first[:details][:id]
      property.save(validate: false)
    else
      RenterInsightZohoApi.new.update_account(property.external_crm_id, crm_data)
    end


  end
end