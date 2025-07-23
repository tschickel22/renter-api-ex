module StatesHelper

  COUNTRY_CODE_US = 'US'
  COUNTRY_CODE_CA = 'CA'

  def supported_countries
    ISO3166::Country.all_names_with_codes
  end

  def state_field_label(countryCode)
    labels = {
      'US': 'State',
      'CA': 'Province'
    }
    return labels[countryCode.to_sym] if countryCode.present? && labels[countryCode.to_sym].present?
    return 'State'
  end

  def state_field_options(countryCode)
    if countryCode.present?
      countryCode = countryCode.upcase
      case countryCode
      when 'CA'
        ca_provinces
      when 'US'
        us_states
      else
        []
      end
    else
      []
    end
  end

  def zip_code_field_label(countryCode)
    labels = {
      'US': 'ZIP Code',
      'CA': 'Postal Code'
    }
    return labels[countryCode.upcase.to_sym] if countryCode.present? && labels[countryCode.upcase.to_sym].present?
    return 'ZIP Code'
  end

  def us_states
    ISO3166::Country('US').subdivisions.reject{|s| s=="AA"||s=="AE"||s=="AP"||s=="AS"||s=="MP"||s=="UM"}.map{|k, v| [k, v.name]}.sort_by { |v| v[0] }
  end

  def us_state_options
    ISO3166::Country('US').subdivisions.reject{|s| s=="AA"||s=="AE"||s=="AP"||s=="AS"||s=="MP"||s=="UM"}.map{|k, v| {id: k, name: v.name}}.sort_by { |v| v[:name] }
  end

  def us_states_abbr
    ISO3166::Country('US').subdivisions.keys
  end

  def ca_provinces
    ISO3166::Country('CA').subdivisions.map{|k, v| [v.name, k]}

  end

  def ca_provinces_abbr
    ISO3166::Country('CA').subdivisions.keys
  end

  def get_state_name_from country_code, state_code
    return '' unless (country_code && state_code)
    ISO3166::Country(country_code.upcase).subdivisions[state_code.upcase].name
  end

  def get_country_name_from country_code
    return '' unless country_code
    ISO3166::Country(country_code.upcase).name
  end
end
