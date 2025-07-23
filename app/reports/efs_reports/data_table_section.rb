include ActionView::Helpers::NumberHelper

class EfsReports::DataTableSection < EfsReports::EfsReportSection

  def initialize(args)
    super
    self.columns = configure_columns()
    self.column_groups = configure_column_groups()    
    self.row_groups = configure_row_groups()
    self.heading = heading()
  end

  def arrange_data

    if row_groups.empty?
      self.data = self.raw_data # By default, don't re-arrange anything
    else
      self.data = Hash.new

      # Build out the data hierarchy
      self.raw_data.each do | row |
        curr_hash = self.data

        # Only the first level gets the raw data
        lowest_level = row_groups.keys.last
        
        row_groups.each do | row_group_key, row_group_name |
          #key = [row_group_key, row[row_group_key.to_s], row[row_group_name.to_s]]
          # Trying a simpler key
          key = row[row_group_name.to_s]
          curr_hash[key] = {:summary_data => {}} if curr_hash[key].nil?          

          # Either build out the raw data or the subgroup data
          if lowest_level == row_group_key
            curr_hash[key][:raw_data] = [] if curr_hash[key][:raw_data].nil?
            curr_hash[key][:raw_data] << row
          else
            curr_hash[key][:subgroups] = {} if curr_hash[key][:subgroups].nil?
          end    

          # Add to the summarization
          columns.each do | column_key, column_config |
            next if skip_total_values.include?(column_key)
            if [:integer, :currency, :float].include?(column_config[:data_type]) || !column_config[:summary_by].nil?

              # Allow to summarize with a different column
              column_for_summary_key = column_config[:summary_by]
              column_for_summary_key = column_key if column_for_summary_key.blank?
              curr_hash[key][:summary_data][column_key.to_s] = 0 if curr_hash[key][:summary_data][column_key.to_s].nil?
              curr_hash[key][:summary_data][column_key.to_s] = curr_hash[key][:summary_data][column_key.to_s] + (row[column_for_summary_key.to_s] || 0)
            end
          end      

          curr_hash = curr_hash[key][:subgroups] unless lowest_level == row_group_key

        end
      end
    end    
  end

  def generate_html(for_pdf = false)

  end

  def show_total_row(key)
    return true
  end

  # Recurse down into the tree
  def add_hierarchical_html_rows(key, structured_data, for_pdf = false)

  end
  
  def add_blank_html_row()

  end
  
  def add_html_rows(row_data, row_prefix = nil, row_prefix_cols = 2, row_css_class = nil, for_pdf = false)

  end
  
  def generate_csv
    new_csv = Array.new
        
    unless self.heading.blank?
      new_csv << CSV.generate_line([heading], {force_quotes: true})
    end
  
    # Add the data rows    
    if data.nil? || data.empty?
      new_csv << CSV.generate_line(['No Records Found'], {force_quotes: true})
    else
      cells = Array.new
      # Create the header
      columns.each do | column_key, column_config |
        next if column_is_hidden?(column_key, column_config)
        cells << column_header_as_string(column_key, column_config)
      end
      new_csv << CSV.generate_line(cells, {force_quotes: true})

      self.output = new_csv.join('')

      add_hierarchical_csv_rows(:start, self.data)
    end
  end
  
  # Column data
  
  # Recurse down into the tree
  def add_hierarchical_csv_rows(key, structured_data)
    if structured_data.kind_of?(Array)
      add_csv_rows(structured_data)
    else

      # We're at the lowest level
      if structured_data.keys.include?(:raw_data)
        add_csv_rows(structured_data[:raw_data])

        if show_total_row(key)
          add_csv_rows([structured_data[:summary_data]], row_prefix = key.blank? ? 'Totals' : "Totals for #{key}")
        end

      # We're not yet down to the lowest level
      elsif !structured_data[:subgroups].nil?
        add_hierarchical_csv_rows(:subgroups, structured_data[:subgroups])
        add_csv_rows([structured_data[:summary_data]], row_prefix = key.blank? ? 'Totals' : "Totals for #{key}") #if key.blank?
      else
        structured_data.each do | group_key, group_data|
          add_hierarchical_csv_rows(group_key, group_data) 
        end
      end
    end
  end
  
  def add_csv_rows(raw_data, row_prefix = nil)
    new_csv = Array.new

    raw_data.each do | row |
      cells = Array.new
      col_num = 0
      columns.each do | column_key, column_config |
        next if column_is_hidden?(column_key, column_config)
        col_num += 1

        if !row_prefix.blank? && col_num <= 1
          cells << row_prefix
        else
          cells << column_value_as_string(row[column_key.to_s], column_key, column_config)
        end
      end
      new_csv << CSV.generate_line(cells, {force_quotes: true})
    end

    self.output += new_csv.join('')
  end
  
  def heading
  end
  
  
  def column_value_as_string(value, column_key, column_config, for_pdf = false)
    if column_config[:data_type] == :integer
      return (value || 0).to_i.to_s
    elsif value.nil?
      return ''
    elsif column_config[:data_type] == :currency
      return is_a_number?(value) ? number_to_currency(value, precision: (column_config[:precision] || 2).to_i) : value
    elsif column_config[:data_type] == :percent
      return is_a_number?(value) ? number_to_percentage(value, precision: (column_config[:precision] || 2).to_i) : value
    elsif column_config[:data_type] == :date
      if column_config[:date_format].nil?
        return value.is_a?(String) ? value : value.strftime('%m/%d/%Y') # m/d/Y
      else
        return value.strftime(column_config[:date_format]) 
      end
    elsif column_config[:data_type] == :lookup
      return replacement_lookup(column_config[:replacements], value)
    elsif column_config[:data_type] == :datetime
      return DateTime.parse(value).strftime('%m/%d/%Y %l:%M %p') if value.present?
      return "-"
    else
      # If this is for a PDF, split the string into 25 character chunks and insert a line break
      # after each so we can have some faux-word wrapping on the PDF
      return value.to_s.scan(/.{1,25}/).join('<br>') if for_pdf
      return value.to_s
    end
  end
  
  protected
  def column_header_as_string(column_key, column_config)
    if column_config[:dynamic].nil?
      return (column_config[:label] || column_key.to_s.titleize)
    else
      header_column_key = column_config[:per_column]
      header_column_config = columns[header_column_key]
      
      return column_value_as_string(column_key, header_column_key, header_column_config) 
    end
  end

  def column_sort_by_as_string(column_key, column_config)
    if column_config[:sort_by].nil?
      return column_key.to_s
    else
      return column_config[:sort_by].to_s
    end
  end
  
  def get_css_class(column_config)
    css_class = ""    
    css_class = column_config[:data_cell_class].to_s if column_config[:data_cell_class]
    css_class += column_config[:data_type].to_s if column_config[:data_type]
    
    return css_class
  end
  
  def lookup_group_number(column_key)
    unless self.column_groups.empty?
      i=0  
      column_groups.each do | column_group, columns |
        i+=1
        return i if columns.include?(column_key)
      end
    end
    
    return 0
  end

  def replacement_lookup(options, value)
    return nil if value.nil? || options.empty?

    selected_option = options.find{|o| o[1].to_s == value.to_s }
    return selected_option[0] unless selected_option.nil?
    return value.titleize

  end
  def is_a_number?(s)
    s.to_s.match(/\A[+-]?\d+?(\.\d+)?\Z/) == nil ? false : true
  end

end