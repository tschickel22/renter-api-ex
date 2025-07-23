class AddApplicationAgreementAt < ActiveRecord::Migration[6.1]
  def change
    add_column :lease_residents, :application_agreement_at, :datetime, after: :invitation_sent_at
    add_column :lease_residents, :application_agreement_ip_address, :string, after: :application_agreement_at
  end
end
