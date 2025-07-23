class EfsReports::DataTableAutoColumnsSection < EfsReports::DataTableSection
  def pull_data
    super
    
    unless self.raw_data.empty?
      # Rearrange the data so that the group by column values become columns themselves
      new_raw_data_groups = Hash.new
    
      self.raw_data.each do | row |
        
        # Create the compound key
        key = []
        columns.each do | column_key, column_config |
          if column_config[:group_by]
            key << row[column_key.to_s]
          end
        end
        new_raw_data_groups[key] = [] if new_raw_data_groups[key].nil?
        new_raw_data_groups[key] << row
      end
      
      per_columns = Hash.new
      new_columns = Hash.new
      
      # Run through each column, find the ones with per_column
      columns.each do | column_key, column_config |
        if column_config.keys.include?(:per_column)
          header_column_key = column_config[:per_column]
          per_columns[column_key] = header_column_key
          
          # If we have expected values, go ahead and build out the columns
          if columns[header_column_key][:expected_values] 
            columns[header_column_key][:expected_values].each do | value |
              new_columns[value] = columns[column_key].merge({:dynamic=>true}) if new_columns[value].nil?
            end
          end
        end
      end
      
      new_raw_data = Array.new

      # Each raw_data_groups becomes a single row
      new_raw_data_groups.each do | key, raw_data_rows |
        new_row = raw_data_rows[0].clone

        # Auto-create the columns
        raw_data_rows.each do | row |
          per_columns.each do | value_column_key, header_column_key |
            dynamic_column_config = columns[header_column_key]
            new_columns[row[header_column_key.to_s]] = columns[value_column_key].merge({dynamic: true, key: row[header_column_key.to_s], sort_key: row[dynamic_column_config[:sort_by].to_s]}) if new_columns[row[header_column_key.to_s]].nil?
            new_row[row[header_column_key.to_s].to_s] = row[value_column_key.to_s]
            new_row["total"] ||= 0
            new_row["total"] += row[value_column_key.to_s]
          end
        end
        
        new_raw_data << new_row
      end

      # Sort new columns
      sorted_new_columns = {}

      new_columns.values.sort_by{|c| c[:sort_key] || c[:key]}.each{|col| sorted_new_columns[col[:key]] = col}

      # Finally, add the newly-generated columns to the columns config
      columns.merge!(sorted_new_columns)

      if new_columns.length > 1
        columns["total"] = columns[per_columns.keys.first].clone
        columns["total"].delete(:per_column)
        columns["total"][:label] = "Total"
      end

      per_columns.each do | value_column_key, header_column_key |
        # Remove the columns used to in a cross-tab manner from the general column config          
        columns[value_column_key][:hidden] = true
        columns[header_column_key][:hidden] = true
      end

      self.raw_data = new_raw_data
    end
  end
end