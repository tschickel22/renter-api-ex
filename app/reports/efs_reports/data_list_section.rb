class EfsReports::DataListSection < EfsReports::DataTableSection

  def generate_html(for_pdf = false)
    self.columns = configure_columns()
    self.heading = heading()
    self.footer = footer()
    
    html_parts = Array.new
    
    # For now, assume HTML output
    html_parts << '<table class="report-data report-data-list">' unless self.single_table
    
    unless self.heading.blank?
      html_parts << '<tr>'
      html_parts << '<td colspan="'+columns.count.to_s+'">'
      html_parts << '<h2>'+heading+'</h2>'
      html_parts << '</td>'
      html_parts << '</tr>'
    end

    # Add the data rows    
    unless data.nil?
      data.each do | row |
        columns.each do | column_key, column_config |
          next if column_is_hidden?(column_key, column_config)
          html_parts << '<tr>'
          html_parts << '<th'
          html_parts << ' class="'+column_config[:header_cell_class].to_s+'"'  unless column_config[:header_cell_class].blank?
          html_parts << '>'
          html_parts << (column_config[:label] || column_key.to_s.titleize)+'</th>'
          css_class = get_css_class(column_config)
          html_parts << '<td'
          html_parts << ' class="'+css_class+'"' unless css_class.blank?
          html_parts << '>'
          if self.class.method_defined?("cell_for_#{column_key.to_s}")
            html_parts << self.send("cell_for_#{column_key.to_s}", row)
          else
            html_parts << column_value_as_string(row[column_key.to_s], column_key, column_config)
          end
          html_parts << '</td>'
          html_parts << '</tr>'
        end

        if self.class.method_defined?("row_separator")
          html_parts << self.row_separator(row)
        end

      end
    end
    
    html_parts << '</table>' unless self.single_table

    self.output = html_parts.join("\n")
  end
  
  def generate_csv
    self.columns = configure_columns()
    self.heading = heading()

    csv_parts = Array.new
    
    unless self.heading.blank?
      csv_parts << CSV.generate_line([heading], {force_quotes: true})
    end

    # Add the data rows    
    unless data.nil?
      data.each do | row |
        columns.each do | column_key, column_config |
          next if column_is_hidden?(column_key, column_config)
          csv_parts << CSV.generate_line([column_config[:label] || column_key.to_s.titleize, column_value_as_string(row[column_key.to_s], column_key, column_config)], {force_quotes: true})
        end
      end
    end

    self.output = csv_parts.join("")
  end
  
end