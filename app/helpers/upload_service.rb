include ActionView::Helpers::SanitizeHelper

class UploadService

  def self.first_name(str)
    return nil if str.nil?
    return str.split(' ').first
  end

  def self.last_name(str)
    return nil if str.nil?
    return str.split(' ').slice(1..99).join(' ')
  end

  def self.is_true(value)
    return false if value.nil?
    return ['y', 'true', 'yes'].include?(value.downcase)
  end

  def self.percentage(value)
    return 0 if value.nil?
    value = UploadService.decimal(value)
    return value * 100 if value <= 1
    return value
  end

  def self.decimal(value, if_nil = nil)
    return if_nil if value.nil?

    begin
      decimal_value = BigDecimal(value.to_s)
    rescue
      decimal_value = if_nil
    end
    return decimal_value
  end

  def self.clean_string(str)
    return nil if str.nil?

    # Remove newlines
    str =  str.to_s.gsub("\n", " ")

    # Remove HTML
    return strip_tags(str)

  end

  def self.clean_email(str)
    return nil if str.nil?

    str = clean_string(str)
    str = str.gsub(' ', '').downcase

    return remove_invalid_responses(str)
  end

  def self.clean_phone(str)
    return clean_email(str)
  end

  def self.remove_invalid_responses(str)
    return nil if str.nil?

    if ['none', 'n/a', 'no', '0'].include?(str.to_s.downcase)
      return nil
    else
      return str
    end
  end
end