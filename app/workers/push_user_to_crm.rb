include WorkerHelper

class PushUserToCrm
  def self.enqueue(user_id)
    Resque.enqueue_to("crm", self, user_id)
  end

  def self.perform(user_id = nil)
    if user_id.nil?
      User.joins(:company).where(user_type: [User::TYPE_COMPANY_ADMIN]).where("LENGTH(companies.external_crm_id) > 0 AND users.updated_at > now() - INTERVAL 1 DAY").each do | user |
        if !Rails.env.development?
          PushUserToCrm.enqueue(user.id)
        end
      end
    else
      push_data_to_crm(User.find(user_id))
    end
  end

  def self.push_data_to_crm(user)
    crm_data = {
      Account_Name: {id: user.company.external_crm_id},
      First_Name: user.first_name,
      Last_Name: user.last_name,
      Email: user.email
    }

    crm_data[:Mobile] = user.cell_phone if !user.cell_phone.blank?

    if user.external_crm_id.blank?
      result = RenterInsightZohoApi.new.create_contact(crm_data)

      # Stash the ID
      user.external_crm_id = result[:data].first[:details][:id]
      user.save(validate: false)
    else
      RenterInsightZohoApi.new.update_contact(user.external_crm_id, crm_data)
    end


  end
end