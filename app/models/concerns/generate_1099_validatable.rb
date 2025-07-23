module Generate1099Validatable
  extend ActiveSupport::Concern

  included do
    validates :tax_id_type, presence: true, if: :generate_1099
    validates :tax_id, presence: true, format: { with:  /\A\d{2}-\d{7}\z/, message: "must be a valid EIN" }, if: [:generate_1099, :tax_id_is_ein]
    validates :tax_id, presence: true, format: { with:  /\A\d{3}-\d{2}-\d{4}\z/, message: "must be a valid SSN" }, if: [:generate_1099, :tax_id_is_ssn]
    validates :street, presence: true, if: :generate_1099
    validates :city, presence: true, if: :generate_1099
    validates :state, presence: true, if: :generate_1099
    validates :zip, presence: true, if: :generate_1099

    def tax_id_is_ein
      tax_id_type == "ein"
    end

    def tax_id_is_ssn
      tax_id_type == "ssn"
    end

    def tax_classification_pretty
      label_lookup(tax_classification, CompanyTaxpayerInfo::TAX_CLASSIFICATION_OPTIONS)
    end

  end
end