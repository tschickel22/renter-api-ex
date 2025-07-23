include StatesHelper
class Setting < ParanoidRecord

  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :property
  
  REQUIRED = 'required'
  OPTIONAL = 'optional'
  HIDE = 'hide'

  PAYMENT_FEE_TYPE_APPLICATION_FEE = "application_fee"
  PAYMENT_FEE_TYPE_SCREENING_FEE = "screening_fee"
  PAYMENT_FEE_TYPE_NSF_FEE = "nsf_fee"
  PAYMENT_FEE_TYPE_ONE_TIME_CHARGES = "one_time_charges"
  PAYMENT_FEE_TYPE_RECURRING_CHARGES = "recurring_charges"

  validate :settings_required_for_screening
  validate :numeric_ranges

  attr_accessor :group_key

  def self.global
    Setting.where(company_id: nil).first
  end
  
  def name
    if company_id.nil?
      "Global"
    elsif property_id.nil?
      "Company-level"
    else
      property&.name || "Property-level"
    end
  end

  def settings_required_for_screening
    if application_require_screening && application_include_resident_histories != "required"
      errors.add(:application_include_resident_histories, "must be set to Required for Screening")
    end

    if application_require_screening && application_include_employment_histories != "required"
      errors.add(:application_include_employment_histories, "must be set to Required for Screening")
    end

    if screening_who_pays == Lease::SCREENING_PAYMENT_RESPONSIBILITY_PROPERTY && default_screening_payment_method_id.blank?
      errors.add(:default_screening_payment_method_id, "can't be blank")
    end
  end

  # 10/10/2024 - Tom doesn't want this restriction any more. He wants to be able to turn it all off
=begin
  def must_offer_ach_or_credit_card
    if !available_payment_methods_default_ach && !available_payment_methods_default_credit_card
      errors.add(:base, "You must offer ACH or Credit Card as a payment method option")
    end
  end
=end

  def self.time_zones
    [
      "Eastern Time (US & Canada)",
      "Central Time (US & Canada)",
      "Mountain Time (US & Canada)",
      "Arizona",
      "Pacific Time (US & Canada)",
      "Alaska",
      "Hawaii"
    ]
  end

  def numeric_ranges

    if self.group_key.present?
      group = Setting.config[self.group_key.to_sym]

      if group[:sub_groups].present?
        group[:sub_groups].each do | sub_group |
          if sub_group[:settings]
            sub_group[:settings].keys.each do | setting_key|

              field_is_visible = false

              # Is this field even in play?
              if (sub_group[:settings][setting_key][:show_if_key].nil? || self[sub_group[:settings][setting_key][:show_if_key]])
                if sub_group[:settings][setting_key][:show_if_value].nil?
                  field_is_visible = true
                elsif self[sub_group[:settings][setting_key][:show_if_key]] == sub_group[:settings][setting_key][:show_if_value]
                  field_is_visible = true
                elsif sub_group[:settings][setting_key][:show_if_value].is_a?(Array) && sub_group[:settings][setting_key][:show_if_value].collect{|v| v.to_s}.include?(self[sub_group[:settings][setting_key][:show_if_key]])
                  field_is_visible = true
                end
              end

              if field_is_visible
                if sub_group[:settings][setting_key][:validates_presence] && self[setting_key].blank?
                  self.errors.add(setting_key, "cannot be blank")
                elsif [:integer, :currency].include?(sub_group[:settings][setting_key][:data_type])
                  if sub_group[:settings][setting_key][:greater_than_or_equal_to].present? && self[setting_key].present? && self[setting_key] < sub_group[:settings][setting_key][:greater_than_or_equal_to]
                    self.errors.add(setting_key, "cannot be less than #{sub_group[:settings][setting_key][:greater_than_or_equal_to]}")
                  end

                  if sub_group[:settings][setting_key][:less_than_or_equal_to].present? && self[setting_key].present? && self[setting_key] > sub_group[:settings][setting_key][:less_than_or_equal_to]
                    self.errors.add(setting_key, "cannot be greater than #{sub_group[:settings][setting_key][:less_than_or_equal_to]}")
                  end
                end
              end
            end
          end
        end
      end
    end
  end

  def self.system_default
    Setting.where(company_id: nil, property_id: nil).first
  end

  def self.for_user(current_user)
    if current_user.nil?
      Setting.where(company_id: nil, property_id: nil)
    elsif current_user.is_admin?
      Setting.all
    elsif current_user.is_resident?
      Setting.where(company_id: [current_user.resident.leases.collect{|l| l.company_id} + [nil]])
    else
      Setting.where(company_id: [nil, current_user.company_id])
    end
  end

  def self.for_property(company_id, property_id)
    setting = Setting.where(company_id: company_id, property_id: property_id).first if !property_id.blank?

    return setting || Setting.where(company_id: company_id, property_id: nil).first || Setting.system_default
  end

  def self.for_lease(lease)
    return Setting.for_property(lease.company_id, lease.property_id)
  end

  def self.for_lease_resident(lease_resident)
    return Setting.for_lease(lease_resident.lease)
  end

  def self.find_issues
    data = Hash.new
    existing_fields = Setting.new.attributes.deep_symbolize_keys.keys
    data_types = Hash.new
    config_fields = []
    duplicate_fields = []

    Setting.config.keys.each do | key |
      group = Setting.config[key]

      if group[:sub_groups].present?
        group[:sub_groups].each do | sub_group |
          if sub_group[:settings]
            sub_group[:settings].keys.each do | setting_key|

              if sub_group[:settings][setting_key][:data_type] == :ach_credit_card_responsibility || sub_group[:settings][setting_key][:data_type] == :payment_fees
                # Next... already handled
              else
                duplicate_fields << setting_key if config_fields.include?(setting_key)
                config_fields << setting_key
                data_types[setting_key] = sub_group[:settings][setting_key][:data_type]
              end
            end
         end
        end
      end
    end

    timestamp_fields = [:created_at,:updated_at, :deleted_at]
    data_type_to_database = {
      yes_no: :boolean,
      select_one: :string,
      select_many: :string,
      dropdown: :string,
      optional_required_hide: :string,
      currency: :decimal,
      textarea: :text
    }

    if !(config_fields - existing_fields).empty?
      data[:missing_columns] = []
      (config_fields - existing_fields).each do | field |
        data_type = data_type_to_database[data_types[field]] || data_types[field]
        data[:missing_columns] << {column: field, data_type: data_type}
      end
    end

    data[:duplicate_fields] = duplicate_fields if !duplicate_fields.empty?
    data[:missing_public_fields] = (existing_fields - timestamp_fields - Setting.public_fields) if !(existing_fields - timestamp_fields - Setting.public_fields).empty?

    return data
  end

  def self.config
    {
      applications: {
        name: 'Applications',
        description: 'Customize your application, add or remove sections, require screening, set application fees.',
        sub_groups: [
          {
            label: 'Co-Applicants',
            settings: {
              application_include_co_applicants: {label: 'Require all occupants over the age of 18 to purchase and complete their own application, which will be submitted jointly along with the primary applicant.', data_type: :yes_no},
            }
          },
          {
            label: 'Minors',
            settings: {
              application_include_minors: {label: 'Include all minors on application that will live in residence?', data_type: :yes_no}
            }
          },
          {
            label: 'Guarantors (co-signers)',
            settings: {
              application_include_guarantors: {label: 'Allow Guarantor to be added to application by applicant.', data_type: :yes_no}
            }
          },
          {
            label: 'Pets',
            settings: {
              application_include_pets: {label: 'Add pets to application?', data_type: :yes_no}
            }
          },
          {
            label: 'Resident History',
            settings: {
              application_include_resident_histories: {label: 'Include details on previous residences?', data_type: :optional_required_hide_if_no_screening},
              resident_histories_minimum: {label: 'Minimum requirement for employment history', data_type: :select_one, show_if_key: :application_include_resident_histories, show_if_value: 'required', options: ResidentEmploymentHistory::TIME_AT_OPTIONS.collect{|k,v| {id: k, name: v}}.filter{|o| o[:id] < 36}}
            }
          },
          {
            label: 'Employment History',
            settings: {
              application_include_employment_histories: {label: 'Add employment history to application?', data_type: :optional_required_hide_if_no_screening},
              employment_histories_minimum: {label: 'Minimum requirement for employment history', data_type: :select_one, show_if_key: :application_include_employment_histories, show_if_value: 'required', options: ResidentEmploymentHistory::TIME_AT_OPTIONS.collect{|k,v| {id: k, name: v}}.filter{|o| o[:id] < 36}}
            }
          },
          {
            label: 'Income',
            settings: {
              application_include_income: {label: 'Add income to application?', data_type: :optional_required_hide}
            }
          },
          {
            label: 'Emergency Contact',
            settings: {
              application_include_emergency_contacts: {label: 'Add emergency contact to application?', data_type: :optional_required_hide}
            }
          },
          {
            label: 'References',
            settings: {
              application_include_references: {label: 'Add references to application?', data_type: :optional_required_hide}
            }
          },
          {
            label: 'Identification',
            settings: {
              application_include_identification: {label: 'Add identification to application?', data_type: :optional_required_hide},
              additional_identification_evidence: {label: 'Additional evidence required:', show_if_key: :application_include_identification, show_if_value: ['optional', 'required'],
                                                   help: 'Example:<br/><img src="/images/selfie-example.jpg" style="max-width: 250px" />',
                                                   data_type: :select_one, options: [{id: "none", name: 'None'}, {id: "copy", name: 'Copy of Identification'}, {id: "selfie", name: 'Photo Holding Identification Next to Face'}]
              }
            }
          },
          {
            label: 'Vehicles',
            settings: {
              application_include_vehicles: {label: 'Add vehicles to application?', data_type: :yes_no}
            }
          },
          {
            label: 'Screening',
            settings: {
              application_require_screening: {label: 'Require all applicants to be screened for credit, criminal and evictions.  If you don\'t require this as a part of the application, this can be performed separately.', data_type: :select_one, options: [{id: true, name: 'Required'}, {id: false, name: 'Hide'}]}
            }
          },
          {
            label: 'Application Fee',
            settings: {
              application_charge_fee: {label: 'Charge Applicants a fee to apply?', data_type: :yes_no},
              application_fee: {label: 'Amount:', data_type: :currency, show_if_key: :application_charge_fee}
            }
          },
        ]
      },
      screening: {
        name: 'Screening',
        description: 'Select default screening packages and who pays for screening.',
        sub_groups: [
          {
            label: 'Social Security Number (SSN)',
            settings: {
              require_ssn: {label: 'A Social Security Number (SSN) is required to retrieve screening reports including Credit, Criminal, and Eviction Reports.  If SSN is not entered only an application can be returned with no screening results.', data_type: :select_one, options: [{id: true, name: 'Require SSN'}, {id: false, name: 'Do Not Require SSN'}]}
            }
          },
          {
            label: 'Billing',
            settings: {
              screening_who_pays: {label: 'Choose who will pay for the screening requests each time', data_type: :select_one, options: [{id: 'resident', name: 'Applicant'}, {id: 'property', name: 'Landlord'}, {id: 'ask', name: 'Ask Landlord Each Time'}]}
            }
          },
          {
            label: 'Screening Package',
            settings: {
              default_screening_package_id: {data_type: :screening_packages}
            },
            show_if_key: :screening_who_pays,
            show_if_value: 'property'
          },
          {
            label: 'Screening Payment Method',
            settings: {
              default_screening_payment_method_id: {data_type: :screening_payment_method}
            },
            show_if_key: :screening_who_pays,
            show_if_value: 'property'
          }

        ]
      },
      lease_documents: {
        name: 'Documents',
        description: '',
        sub_groups: [
          {
            label: 'Document Sharing',
            settings: {
              share_resident_leases: {label: 'Share Resident Leases in Resident Portal?', data_type: :yes_no}
            }
          },
        ]
      },
      # esignatures: {
      #   name: 'eSignatures',
      #   description: '',
      #   sub_groups: []
      # },
      move_in_and_out: {
        name: 'Move In/Out',
        description: 'Choose required steps and charges',
        sub_groups: [
          {
            label: 'Move-in Checklist',
            settings: {
              items_required_for_move_in: {label: 'Select tiles required for move-in', data_type: :select_many_items, model: 'MoveInChecklistItem'}
            }
          },
          #          {
          #            label: 'Move-in Charges',
          #            settings: {
          #              move_in_charge_type: {label: 'Type', data_type: :dropdown, options: [{id: 'utilities', name: 'Utilities'}, {id: 'insurance', name: 'Insurance'}]},
          #              move_in_charge_frequency: {label: 'Frequency', data_type: :dropdown, options: [{id: 'one_time', name: 'One-Time'}, {id: 'monthly', name: 'Monthly'}]},
          #              move_in_charge_prorate_type: {label: 'Prorate for Move-in?', data_type: :yes_no},
        #              move_in_charge_amount: {label: 'Amount', data_type: :currency}
        #            }
          #          },
          {
            label: 'Forwarding Addresses',
            settings: {
              forwarding_addresses_required: {label: 'Are forwarding addresses required?', data_type: :yes_no}
            }
          },
          {
            label: 'Move-out Checklist',
            settings: {
              items_required_for_move_out: {label: 'Select tiles required for move-out', data_type: :select_many_items, model: 'MoveOutChecklistItem'}
            }
          }
        ]
      },
      expenses: {
        name: 'Billing & Expenses',
        description: 'Defaults for billing & expense tracking',
        sub_groups: [
          {
            label: 'Mileage',
            settings: {
              rate_per_mile: {label: 'Rate per Mile', data_type: :cents, help: '<a href="https://www.irs.gov/tax-professionals/standard-mileage-rates" target="_blank">View Federal Mileage Rates</a>'},
            }
          },
          {
            label: 'Fixed Asset Depreciation',
            settings: {
              fixed_asset_depreciation: {label: 'Default Years', data_type: :dropdown, options: [{id: '1.0', name: '1'}, {id: '5.0', name: '5'}, {id: '7.0', name: '7'}, {id: '15.0', name: '15'}, {id: '27.5', name: '27.5'}, {id: '30.0', name: '30'}], help: 'Set the number of years to select when expensing fixed assets.  This will appear in your Fixed Asset Report.'},
            }
          },
          {
            label: 'Check Printing - Formatting',
            settings: {
              check_printing_enabled: {label: 'Enable check printing', data_type: :yes_no, help: 'Once you enable Check Printing, be sure to then configure each Account you want to use in the <a href="/accounts">Chart of Accounts</a>'},
            }
          }
        ]
      },
      check_printing: {
        name: 'Check Printing',
        special_use: true,
        description: 'Defaults for check printing',
        sub_groups: [
          {
            label: 'Check Printing - Formatting',
            settings: {
              check_printing_enabled: {label: 'Enable check printing', data_type: :yes_no},
              check_format: {
                label: 'Check Paper', data_type: :select_one, options: [{id: 'blank', name: 'Blank'}, {id: 'pre-printed', name: 'Pre-printed with account & routing numbers'}], help: 'What type of paper will you be using in your printer to print checks?', show_if_key: :check_printing_enabled,
                help: '<a href="https://helpcenter.renterinsight.com/portal/en/kb/articles/supported-checks" target="_blank">View Supported Check Types</a>'
              },
            },
          },
          {
            label: 'Check Printing - Company Information',
            show_if_key: :check_format,
            show_if_value: 'blank',
            settings: {
              check_company_name: {label: 'Name'},
              check_company_street: {label: 'Street Address'},
              check_company_city: {label: 'City'},
              check_company_state: {label: 'State', data_type: :dropdown, options: us_state_options()},
              check_company_zip: {label: 'Zip'},
              check_company_phone: {label: 'Phone'},
            },
          },
          {
            label: 'Check Printing - Check Details',
            show_if_key: :check_printing_enabled,
            settings: {
              check_signature_heading: {label: 'Signature Heading', help: 'Will appear above the signature.', show_if_key: :check_format, show_if_value: 'blank'},
              check_aba_fractional_number: {label: 'ABA Fractional Number', show_if_key: :check_format, show_if_value: 'blank',
                                            help: 'Example:<br/><img src="/images/check-aba-fractional-number.jpg" style="max-width: 250px" />',
              },
              check_bank_name: {label: 'Bank Name', show_if_key: :check_format, show_if_value: 'blank'},
              check_bank_city: {label: 'Bank City', show_if_key: :check_format, show_if_value: 'blank'},
              check_bank_state: {label: 'Bank State', data_type: :dropdown, options: us_state_options(), show_if_key: :check_format, show_if_value: 'blank'},
              check_signor_name: {label: 'Signor Name', help: 'Enter the name of the signor to appear on the signature line of printed checks.'},
            },
          }
        ]
      },
      rent_payment: {
        name: 'Rent Payments',
        description: 'Defaults for who pays processing fees, late fee amounts, etc',
        sub_groups: [
          {
            label: 'Prorate',
            settings: {
              prorate_rent_at_lease_start_and_end: {label: 'Prorate Rent at Lease Start and Lease End?', data_type: :yes_no},
              prorate_type: {label: 'Prorate Type', tooltip: "30 Days will determine a daily rate by dividing the amount due by 30 and multiplying it by the daily rate.  Example: $1000 Rent and resident moves in on July 30th and owes 2 days rent.  $1000/30=$33.33 daily rate.  $33.33 X 2 = $66.66.<br/>With Actual Month, the daily rate is calculated by dividing the amount owed by the actual days in month.   Example: $1000 Rent and resident moves in on July 30th and owes 2 days rent.  $1000/31=$32.23 daily rate.  $32.23 X 2 = $64.46.", data_type: :select_one, options: [{id: "thirty_days", name: '30 Days'}, {id: "actual_month", name: 'Actual Month'}]}
            }
          },
          {
            label: 'Partial Payments',
            settings: {
              allow_partial_payments: {label: 'Allow Partial Payments?', data_type: :yes_no, tooltip: 'Decide if you want a resident to have the option to pay less than the total amount due.  Example:  If you allow partial payments, a resident could pay for their rent, but not pay for a late payment.'}
            }
          },
          {
            label: 'Payment Fees',
            admin_only: true,
            settings: {
              payment_fees: {data_type: :payment_fees},
              available_payment_methods_default: {label: 'Resident Payment Methods (all states)', data_type: :available_payment_methods, push_down_to_properties: true},
              available_payment_methods_co: {label: 'Resident Payment Methods (Colorado properties)', data_type: :available_payment_methods, tooltip: 'CO Landlords must absorb payment processing fees if they want to offer ACH or Debit card.  <a href="/pdfs/state-of-co-payment-info.pdf" target="_blank">State of CO Payment Info</a>', push_down_to_properties: true},
              resident_responsible_application_fee: {label: 'Application Fee (not Resident Screening)', data_type: :ach_credit_card_responsibility},
              resident_responsible_security_deposit: {label: 'Security Deposits ', data_type: :ach_credit_card_responsibility},
              resident_responsible_recurring_charges: {label: 'Rent & Recurring Monthly Charges', data_type: :ach_credit_card_responsibility},
              resident_responsible_one_time_charges: {label: 'One-Time Charge / Landlord Generated', data_type: :ach_credit_card_responsibility},
              resident_responsible_final_amount: {label: 'Final Amount Due at Move-out', data_type: :ach_credit_card_responsibility},
            }
          }
        ]
      },
      invoices: {
        name: 'Invoices',
        description: 'Set preferences for resident invoices',
        sub_groups: [
          {
            label: 'Invoicing',
            settings: {
              enable_invoices: {label: 'Enable Resident Invoices?', data_type: :yes_no, push_down_to_properties: true}
            }
          },
          {
            label: 'Name & Address to Appear on Resident Invoices',
            settings: {
              invoice_name_type: {label: 'Which name do you want to display?', data_type: :select_one, options: [{id: "company", name: "Company Name"}, {id: "property", name: "Property Name"}, {id: "custom", name: "Custom Name"}], push_down_to_properties: true},
              invoice_custom_name: {label: 'Custom Name', validates_presence: true, show_if_key: :invoice_name_type, show_if_value: 'custom', push_down_to_properties: true},
              invoice_custom_street: {label: 'Address', validates_presence: true, show_if_key: :invoice_name_type, show_if_value: 'custom', push_down_to_properties: true},
              invoice_custom_city: {label: 'City', validates_presence: true, show_if_key: :invoice_name_type, show_if_value: 'custom', push_down_to_properties: true},
              invoice_custom_state: {label: 'State', data_type: :dropdown, options: us_state_options(), validates_presence: true, show_if_key: :invoice_name_type, show_if_value: 'custom', push_down_to_properties: true},
              invoice_custom_zip: {label: 'Zip', validates_presence: true, show_if_key: :invoice_name_type, show_if_value: 'custom', push_down_to_properties: true},
            },
            show_if_key: :enable_invoices
          },
        ]
      },
      late_fees: {
        name: 'Late Fees & NSF',
        description: 'Set late fee amounts and rules',
        sub_groups: [
          {
            label: 'Late Fees',
            settings: {
              charge_residents_late_rent_fee: {label: 'Charge Residents Fees for Late Rent. Rent is due on the first of every month.', data_type: :yes_no},
              late_rent_fee_charge_type: {label: 'Type', data_type: :select_one, options: [{id: "fixed", name: "Fixed Amount"}, {id: "daily", name: "Daily Fee"}, {id: "fixed_plus_daily", name: "Fixed Plus Daily Fee"}, {id: "percent_of_balance", name: "Calculate Based on % of Balance Owed"}], show_if_key: :charge_residents_late_rent_fee},
              late_rent_fee_charge_fixed: {label: 'Fixed Amount', data_type: :currency, validates_presence: true, greater_than_or_equal_to: 1, show_if_key: :late_rent_fee_charge_type, show_if_value: ['fixed', 'fixed_plus_daily']},
              late_rent_fee_charge_daily: {label: 'Daily Amount', data_type: :currency, validates_presence: true, greater_than_or_equal_to: 1, show_if_key: :late_rent_fee_charge_type, show_if_value: ['daily', 'fixed_plus_daily']},
              late_rent_fee_charge_percent: {label: '% of Balance', data_type: :integer, validates_presence: true, greater_than_or_equal_to: 1, show_if_key: :late_rent_fee_charge_type, show_if_value: 'percent_of_balance'},
              grace_period: {label: 'Grace Period (days)', data_type: :integer, validates_presence: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 30, show_if_key: :charge_residents_late_rent_fee, tooltip: 'Example: if you enter 5, a late fee is charged on the 6th day of the month'},
              late_rent_fee_minimum_amount: {label: 'Minimum Amount Due for Late Fee', validates_presence: true, greater_than_or_equal_to: 0, data_type: :currency, show_if_key: :charge_residents_late_rent_fee, tooltip: 'If a resident owes $50 and your minimum is $75, they will not be charged a late fee'},
              late_rent_fee_maximum_amount: {label: 'Late Fee Maximum', validates_presence: true, greater_than_or_equal_to: 1, data_type: :currency, show_if_key: :charge_residents_late_rent_fee}
            }
          },
          {
            label: 'NSF Fees (Min $10)',
            settings: {
              nsf_fee: {label: 'Enter NSF Fee', help: 'Ensure your fees do not exceed state-allowed NSF fees', tooltip: 'Renter Insight charges Landlord $10 for each NSF. Amounts over $10 is deposited to Landlord', data_type: :currency, greater_than_or_equal_to: 10},
              charge_residents_nsf_and_late_fee: {label: 'Charge Late Fee in addition to NSF, if outside grace period?', data_type: :yes_no, show_if_key: :charge_residents_late_rent_fee}
            }
          }
        ]
      },
      communication: {
        name: 'Communication',
        description: 'Set email signature and preferences',
        sub_groups: [
          #          {
          #            label: "Email Delivery Settings",
          #            settings: {
          #              from_email: {label: "This email address is used to send system generated emails to your applicants and residents"}
          #            }
          #          }
          {
            label: 'Time Zone',
            settings: {
              time_zone: {label: 'When scheduling communications, this timezone will be used', data_type: :dropdown, options: self.time_zones.collect{|z| {id: z, name: z}}}
            },
            company_only: true
          },
          {
            label: 'Email and Text Signature',
            settings: {
              email_signature: {label: 'This signature will appear on all emails and texts sent by the system', data_type: :textarea}
            }
          },
          {
            label: 'Rent Reminders',
            settings: {
              rent_reminder_emails: {label: 'Send Rent Reminder Emails', tooltip: 'Reminder emails sent on the 25th, 1st and late notices on the 15th', data_type: :yes_no}
            }
          }
        ]
      },
      renters_insurance: {
        name: 'Renters Insurance',
        description: 'Set Insurance Requirements',
        sub_groups: [
          {
            label: 'Renters Insurance',
            description: 'Residents can purchase or upload proof of third party renters insurance in their resident portal',
            settings: {
              require_renters_insurance: {label: 'Require Renters Insurance', data_type: :yes_no}
            }
          }
        ]
      },
=begin
      listings: {
        name: 'Listings',
        description: '',
        sub_groups: []
      },
      maintenance_requests: {
        name: 'Maintenance Requests',
        description: 'Set default categories',
        sub_groups: []
      },
      reports: {
        name: 'Reports',
        description: 'Choose subscription delivery methods',
        sub_groups: []
      },
      residents: {
        name: 'Residents',
        description: 'No Settings',
        sub_groups: []
      },
      resident_portal: {
        name: 'Resident Portal',
        description: 'No Settings',
        sub_groups: []
      },
      collections: {
        name: 'Collections',
        description: 'No Settings',
        sub_groups: []
      },
      website: {
        name: 'Website',
        description: 'Select Pages for Website',
        sub_groups: []
      },
      bank_accounts: {
        name: 'Bank Accounts',
        description: 'Set which accounts are used for rent, deposits, late fees, etc',
        sub_groups: []
      },
=end
    }
  end

  def self.config_with_usage
    usage = Setting.look_for_usage

    new_config = Setting.config

    new_config.keys.each do | key |
      group = Setting.config[key]

      if group[:sub_groups].present?
        group[:sub_groups].each_with_index do | sub_group, index |
          if sub_group[:settings]
            sub_group[:settings].keys.each do | setting_key|
              if sub_group[:settings][setting_key][:data_type] == :ach_credit_card_responsibility
              elsif sub_group[:settings][setting_key][:data_type] == :payment_fees

              elsif !usage.include?(setting_key) && new_config[key][:sub_groups][index][:settings][setting_key][:label]
                new_config[key][:sub_groups][index][:settings][setting_key][:label] = 'NOT UTILIZED: ' + new_config[key][:sub_groups][index][:settings][setting_key][:label]
              end
            end
          end
        end
      end
    end

    return new_config
  end

  def self.look_for_usage
    config_fields = []

    Setting.config.keys.each do | key |
      group = Setting.config[key]

      if group[:sub_groups].present?
        group[:sub_groups].each do | sub_group |
          if sub_group[:settings]
            sub_group[:settings].keys.each do | setting_key|
              if sub_group[:settings][setting_key][:data_type] == :ach_credit_card_responsibility
              elsif sub_group[:settings][setting_key][:data_type] == :payment_fees

              else
                config_fields << setting_key
              end
            end
          end
        end
      end
    end

    base_path = "app/javascript"
    files = Dir.glob("**/*.jsx",base: base_path)
    matches = {}

    files.each do |file|
      open(base_path + "/" + file) do |f|
        lines = f.read
        config_fields.each do | config_field|
          if lines =~ Regexp.new("#{config_field}")
            matches[config_field] ||= []
            matches[config_field] << file
          end
        end
      end
    end

    ["app/models", "app/controllers", "app/workers", "app/helpers"].each do | base_path |
      files = Dir.glob("**/*.rb",base: base_path)

      files.each do |file|
        next if ["setting.rb", "settings_controller.rb"].include?(file)

        open(base_path + "/" + file) do |f|
          lines = f.read
          config_fields.each do | config_field|
            if lines =~ Regexp.new("#{config_field}")
              matches[config_field] ||= []
              matches[config_field] << file
            end
          end
        end
      end
    end

    return matches
  end

  def self.get_push_down_to_properties_setting_keys
    config_fields = []

    Setting.config.keys.each do | key |
      group = Setting.config[key]

      if group[:sub_groups].present?
        group[:sub_groups].each do | sub_group |
          if sub_group[:settings]
            sub_group[:settings].keys.each do | setting_key|
              if sub_group[:settings][setting_key][:push_down_to_properties]
                if [:available_payment_methods_default, :available_payment_methods_co].include?(setting_key)
                  [:ach, :credit_card, :debit_card].each do | pm |
                    config_fields << "#{setting_key}_#{pm}".to_sym
                  end
                else
                  config_fields << setting_key
                end
              end
            end
          end
        end
      end
    end

    return config_fields
  end

  def self.public_fields
    [
      :company_id, :property_id, :prorate_rent_at_lease_start_and_end, :prorate_type,
      :available_payment_methods_default_ach, :available_payment_methods_default_credit_card, :available_payment_methods_default_debit_card, :available_payment_methods_default_cash,
      :available_payment_methods_co_credit_card, :available_payment_methods_co_ach, :available_payment_methods_co_debit_card, :available_payment_methods_co_cash,
      :resident_responsible_application_fee_ach, :resident_responsible_application_fee_credit_card, :resident_responsible_security_deposit_ach, :resident_responsible_security_deposit_credit_card, :resident_responsible_recurring_charges_ach,
      :resident_responsible_application_fee_debit_card, :resident_responsible_security_deposit_debit_card, :resident_responsible_recurring_charges_debit_card, :resident_responsible_one_time_charges_debit_card,
      :resident_responsible_recurring_charges_credit_card, :resident_responsible_one_time_charges_ach, :resident_responsible_one_time_charges_credit_card, :resident_responsible_final_amount_ach,
      :resident_responsible_final_amount_credit_card, :charge_residents_late_rent_fee, :late_rent_fee_charge_type, :late_rent_fee_charge_fixed, :late_rent_fee_charge_daily, :resident_responsible_final_amount_debit_card,
      :late_rent_fee_charge_percentage, :grace_period, :late_rent_fee_minimum_amount, :late_rent_fee_maximum_amount, :application_include_co_applicants, :application_include_minors,
      :application_include_guarantors, :application_include_pets, :application_include_resident_histories, :resident_histories_minimum, :application_include_employment_histories, :employment_histories_minimum, :application_include_income,
      :application_include_emergency_contacts, :application_include_references, :application_include_identification, :additional_identification_evidence, :application_include_vehicles, :application_require_screening,
      :application_charge_fee, :application_fee, :require_ssn, :screening_who_pays, :default_screening_package_id, :default_screening_payment_method_id, :items_required_for_move_in,
      :forwarding_addresses_required, :items_required_for_move_out, :late_rent_fee_charge_percent, :email_signature, :require_renters_insurance,
      :rate_per_mile, :fixed_asset_depreciation, :allow_partial_payments, :nsf_fee, :charge_residents_nsf_and_late_fee, :check_printing_enabled, :share_resident_leases,
      :enable_invoices, :invoice_name_type, :invoice_custom_name, :invoice_custom_street, :invoice_custom_city, :invoice_custom_state, :invoice_custom_zip,
      :time_zone, :rent_reminder_emails
    ]
  end

  def self.private_fields
    [:id, :payment_fee_ach_property, :payment_fee_ach_resident, :payment_fee_credit_card_property, :payment_fee_credit_card_resident, :payment_fee_debit_card_property, :payment_fee_debit_card_resident, :payment_fee_cash_resident]
  end

end



