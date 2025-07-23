require 'uri'
include ApplicationHelper

class EfsReports::EfsReportSection

  ORDER_BY_ASC = 1
  ORDER_BY_DESC = 2
  ORDER_BY_OPTIONS = [['Ascending', ORDER_BY_ASC], ['Descending', ORDER_BY_DESC]]
  ORDER_BY_SQL = [['ASC', ORDER_BY_ASC], ['DESC', ORDER_BY_DESC]]
  
  attr_accessor :raw_data, :data, :sql, :allow_sort
  attr_accessor :heading, :footer, :columns, :column_groups, :row_groups
  attr_accessor :output, :single_table, :report, :hide_if_empty
  attr_accessor :section_id, :colors
  attr_accessor :current_user, :current_actual_user
  attr_accessor :hide_group_header, :table_wrapper_class

  def initialize(args)
    @current_user = args[:user]
    @current_actual_user = args[:real_user]
    @heading = args[:heading]
    @single_table = args[:single_table] || false
    @report = args[:report]
    @section_id = args[:section_id]
    @allow_sort = true
    @hide_if_empty = false
    @hide_group_header = args[:hide_group_header]
    @colors = ['#66cccc', '#73d46d', '#f19f9f', '#4572a7', '#aa4643', '#93aa67', '#993300', '#663366', '#999999']

  end
    
  def configure_query  
  end
  
  def get_color_number(color_num) 
    if color_num < @colors.count
      return @colors[color_num] 
    else
      return @colors[color_num % @colors.count]
    end
  end

  def pull_data    
    unless @sql.nil?
      @raw_data = run_query(@sql)
    end
  end
  
  def run_query(sql_to_run)
    if sql_to_run.kind_of?(Array)
      return ActiveRecord::Base.connection.select_all(ActiveRecord::Base.send('sanitize_sql_array',sql_to_run)).to_a
    else
      # This will be merged with the regular params at query time
      query_params = @report.internal_params || Hash.new

      return ActiveRecord::Base.connection.select_all(ActiveRecord::Base.send('sanitize_sql_array',[sql_to_run, query_params.merge(@report.params).deep_symbolize_keys])).to_a
    end    
  end

  def heading_for_customization
    return heading
  end

  def arrange_data
    @data = @raw_data # By default, don't re-arrange anything
  end
  
  def add_sort_to_query
    addl_order = sort_order()
    
    unless addl_order.blank?
      if @sql.match(/order by/i)
        @sql += ', '+addl_order
      else
        @sql += ' ORDER BY '+addl_order
      end 
    end
  end
  
  # Iterate through @data, adding columns of data based on key
  def merge_data_by_key(new_data_sql, key)
    new_data = run_query(new_data_sql)
    
    key = key.to_s
    
    unless @raw_data.nil?
      @raw_data.each do | row |
        key_value = row[key]
        
        # Find the row to merge
        unless key_value.nil?
          new_row = new_data.find{|k| k[key] == key_value }
        
          unless new_row.nil?
            row.merge!(new_row)
          end
        end
      end
    end
  end
  
  def configure_columns
    {}
  end
  def configure_column_groups
    {}
  end
  def configure_row_groups
    {}
  end
  def group_css_classes
    {}
  end

  def data_is_empty?
    return self.data.nil? || self.data.empty?
  end
  
  def generate_html(for_pdf = false)
    @output = ""
  end
  
  def generate_csv
    @output = ""
  end
  
  def section_key
    return self.class.to_s.gsub('::','-').downcase
  end

  def are_columns_visible?
    return true if @columns.nil?

    @columns.each do | column_key, column_config |
      next if column_is_hidden?(column_key, column_config)
      return true
    end

    return false
  end

  def column_is_hidden?(column_key, column_config)
    return true if column_config[:hidden].present?

    if @report.report_customization.present? && @report.report_customization.column_config_object.present?
      full_column_key = "#{self.section_key}-#{column_key}"
      return !@report.report_customization.column_config_object.include?(full_column_key)
    else
      return column_config[:hidden_but_available].present? && column_config[:hidden_but_available]
    end
  end

  def to_builder
    Jbuilder.new do |json|
      json.id section_id
      json.heading heading()
      json.footer footer()

      json.hide_if_empty @hide_if_empty
      json.section_class self.class.ancestors.collect{|a| a.to_s}.find{|a| a.include?('EfsReports')}.gsub('EfsReports::', '')
      json.table_wrapper_class self.table_wrapper_class

      prepared_columns = (columns || {}).keys.inject([]) do | acc, column_key |
        column = columns[column_key]
        column[:id] = column_key
        column[:label] ||= column_key.to_s.titleize

        acc << column
      end

      json.columns prepared_columns
      json.data data
      json.hide_group_header hide_group_header
      json.group_css_classes group_css_classes
    end
  end

  protected 
  def sort_column  
    @report.params["#{section_id}_sort"]
  end

  def sort_direction  
    @report.params["#{section_id}_direction"]
  end  
  
  def sortable(column, title = nil)

    title ||= column.titleize    
    css_class = column == sort_column ? "current #{sort_direction}" : nil
    
    direction = column == sort_column && sort_direction == "asc" ? "desc" : "asc"
    
    return '<a href="/reports/' + @report.report_id + '/run?' + params_to_query_string(@report.params.merge("#{section_id}_sort" => column, "#{section_id}_direction" => direction)) + '" class="' + (css_class || '')  + '">' + title + '</a>'
  end
  
  def sort_order(col = nil, dir = nil)
    dir = label_lookup(ORDER_BY_SQL, dir) if [ORDER_BY_ASC, ORDER_BY_DESC].include?(dir)
    if sort_column.nil? && col.nil? 
      return ''
    else
      return "#{sort_column || col} #{sort_direction || dir}"
    end
  end

  # Add this method to child report classes
  # and use format [:column_name, :column_name2, ...] to skip displaying a summary value for that
  # particular column.
  def skip_total_values
    []
  end
  
  def params_to_query_string(p)
    query_params = Array.new
    
    p.each do | key, value |
      query_params << "report%5B#{key}%5D" + '=' + URI.escape(value.to_s)
    end
    
    return query_params.join('&')
  end
end