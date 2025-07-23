class EfsReports::EfsReportCriteria
  attr_accessor :report
  
  def initialize(args)
    self.report = args[:report]
  end

  def current_params(session)
  end
  
  def partial_name
    "/reports/criteria_#{self.class.name.split('::').last.underscore.gsub!(/_criteria/,'').downcase}"
  end

  def validate(params)
    return true
  end

  def create_on_report_drop_down(menu_id, criteria_id, menu_options, description, value_key = 'id', label_key = 'name', drop_down_css_class = '')

    inline_form = ['<div id="'+menu_id+'" class="criteria-menu '+drop_down_css_class+'" style="display:none" onmouseover="keepMenuOpen(\''+menu_id+'\')" onmouseout="closeMenu(\''+menu_id+'\')">']
    inline_form << '<ul>'

    menu_options.each do | menu_option |

      if value_key == 'last'
        value = menu_option.last
        label = menu_option.first
      else
        value = menu_option[value_key]
        label = menu_option.send(label_key)
      end

      js = @report.params[criteria_id] == value ? "jQuery('#{menu_id}').hide()" : "switchCriteria('#{criteria_id}', '#{value}')"
      is_current = false
      is_current = @report.params[criteria_id].to_s == value.to_s unless @report.params[criteria_id].nil? || value.nil?

      inline_form << '<li><a href="javascript:void(0)" onclick="'+js+'" class="'+ (is_current ? 'current' : '')+'">' + (label || '') + '</a></li>'
    end

    inline_form << '</ul>'
    inline_form << '</div>'

    return ["#{inline_form.join("\n")}<a href=\"javascript:void(0);\" id=\"#{menu_id}-link\" class=\"btn btn-info\" onclick=\"toggleMenu('#{menu_id}');\">#{description}</a>"]
  end

  def create_on_report_multi_select(menu_id, criteria_id, menu_option_groups, description, value_key = 'id', label_key = 'name', number_of_columns = 1, auto_hide = true)

    if number_of_columns == 2
      drop_down_css_class = 'criteria-menu-wide'
    elsif number_of_columns > 2
      drop_down_css_class = 'criteria-menu-widest'
    else
      drop_down_css_class = ''
    end

    inline_form = ['<div id="'+menu_id+'" class="criteria-menu '+drop_down_css_class+'" '+ (auto_hide ? ' style="display:none" onmouseover="keepMenuOpen(\''+menu_id+'\')" onmouseout="closeMenu(\''+menu_id+'\')' : '') +'">']

    menu_option_groups.each do | menu_option_group |
      inline_form_items = Array.new
      is_current = false

      inline_form << '<div class="row" style="margin-left:8px; margin-right:8px; margin-top: 8px">'
      inline_form << '<div class="col-xs-12">'
      inline_form << '<ul>'
      inline_form << '<li><label for="heading-group-' + criteria_id + '-' + menu_option_group[:key] + '"><input type="checkbox" name="report[group-'+criteria_id+'][]" id="heading-group-' + criteria_id + '-' + menu_option_group[:key] + '" value="'+menu_option_group[:key]+'" '+ (is_current ? 'checked="checked"' : '')+' onclick="toggleGroupSelection(\'group-'+criteria_id+'-'+menu_option_group[:key]+'\')"> ' + menu_option_group[:name] + '</label></li>'
      inline_form << '</ul>'
      inline_form << '</div>'
      inline_form << '</div>'

      menu_option_group[:options].each do | menu_option |

        if value_key == 'last'
          value = menu_option.last
          label = menu_option.first
        else
          value = menu_option[value_key]
          label = menu_option.send(label_key)
        end

        is_current = false
        is_current = @report.params[criteria_id].split(",").include?(value.to_s) unless @report.params[criteria_id].nil? || value.nil?
        checkbox_id = criteria_id + '-' + value.to_s.downcase.gsub(/\W/,'')
        inline_form_items << '<li><label for="' + checkbox_id + '" style="font-weight:normal"><input type="checkbox" class="multi-select-'+criteria_id+' group-' + criteria_id + '-' + menu_option_group[:key] + '" name="report['+criteria_id+'][]" id="' + checkbox_id + '" value="'+value.to_s+'" '+ (is_current ? 'checked="checked"' : '')+' onclick="checkGroupSelection(\'group-'+criteria_id+'-'+menu_option_group[:key]+'\')"> ' + label + '</label></li>'
      end

      inline_form << '<div class="criteria-menu-option-wrapper">'
      inline_form << '<div class="row" style="margin-left:8px; margin-right:8px; margin-top: 8px;">'

      slice_size = (inline_form_items.size/number_of_columns.to_f).ceil
      slice_size = 1 if slice_size <= 0 # Guards against cases where 0 properties are found
      inline_form_items.each_slice(slice_size).to_a.each do | items |
        inline_form << '<div class="col-xs-'+(12/number_of_columns).to_s+'">'
        inline_form << '<ul>'
        inline_form += items
        inline_form << '</ul>'
        inline_form << '</div>'
      end

      inline_form << '</div>'
      inline_form << '</div>' # .criteria_menu_option_wrapper
      inline_form << '<script>checkGroupSelection(\'group-'+criteria_id+'-'+menu_option_group[:key]+'\');</script>'
    end

    if auto_hide
      js = "checkedValues = jQuery('input.multi-select-#{criteria_id}:checked').map(function() { return jQuery(this).val(); }).get(); switchCriteria('#{criteria_id}', checkedValues.join(','))"
      inline_form << '<div class="row">'
      inline_form << '<div class="' + (number_of_columns > 2 ? 'col-xs-8 col-xs-offset-4' : 'col-xs-12 text-center') + '">'
      inline_form << '<a href="javascript:void(0)" onclick="'+js+'" class="applyBtn btn btn-small btn-sm btn-success">Apply</a>'
      inline_form << '</div>'
      inline_form << '</div>'
    end

    inline_form << '</div>'

    if auto_hide
      return ["#{inline_form.join("\n")}<a href=\"javascript:void(0);\" id=\"#{menu_id}-link\" class=\"btn btn-info\" onclick=\"toggleMenu('#{menu_id}');\">#{description}</a>"]
    else
      return ["#{inline_form.join("\n")}"]
    end

  end

  def header_items(_for_pdf = false, for_subscription_description = false)
    return []
  end

  def to_builder
    Jbuilder.new do |json|
      json.id self.class.to_s.split(':').last
    end
  end
end