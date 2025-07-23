class AddVendorItems < ActiveRecord::Migration[6.1]
  def change
    VendorInsuranceType.create({order_number: 1, name: 'Liability Insurance'})
    VendorInsuranceType.create({order_number: 2, name: 'Workers Compensation Insurance'})
    VendorInsuranceType.create({order_number: 3, name: 'Disability Insurance'})
    VendorInsuranceType.create({order_number: 4, name: 'Business Owners Insurance'})

    VendorLicenseType.create({order_number: 1, name: 'Sales/Use Tax License'})
    VendorLicenseType.create({order_number: 2, name: 'Use Tax License'})
    VendorLicenseType.create({order_number: 3, name: 'Plumbers License'})
    VendorLicenseType.create({order_number: 4, name: 'Electrician License'})
  end
end
