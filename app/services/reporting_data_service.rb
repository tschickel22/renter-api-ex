class ReportingDataService
  def self.replace_into(value_sql, table, fields)

    # Throw value_sql into a subquery to ensure the fields we are expecting are defined in value_sql
    data = ActiveRecord::Base.connection.select_all("SELECT #{fields.join(', ')} FROM (#{value_sql}) replace_into_sub")

    data.each_slice(1000) do | data_slice |
      replace_into_sql = "REPLACE INTO #{table} (#{fields.join(', ')}) VALUES "
      replace_into_sql_values = []

      data_slice.each do | row |
        values = fields.collect do | field |
          value = row[field.strip]

          if value.is_a?(Integer)
            value
          elsif value.is_a?(Time) || value.is_a?(DateTime)
            "'#{value.strftime('%Y-%m-%d %H:%M:%S')}'"
          elsif value.nil?
            "NULL"
          else
            ActiveRecord::Base.connection.quote("#{value}")
          end
        end

        replace_into_sql_values << "(#{values.join(", ")})"
      end

      replace_into_sql += replace_into_sql_values.join(", ")
      ActiveRecord::Base.connection.execute(replace_into_sql)
    end

  end

  def self.update(value_sql, table, primary_key_fields, fields)

    # Updates must happen like this
    # * Create temp table
    # * Pull data from read-only database
    # * Insert into temp table
    # * Run update joining table to temp table
    # * Drop temp table

    temp_table_name = "z_reporting_#{table}_#{Time.now.to_i}"
    read_only_select_sql = "SELECT #{primary_key_fields.join(', ')}, #{fields.join(', ')} FROM (#{value_sql}) replace_into_sub"

    # Create temp table
    ActiveRecord::Base.connection.execute("CREATE TABLE #{temp_table_name} AS #{read_only_select_sql} WHERE 1 = 0")
    ActiveRecord::Base.connection.execute("ALTER TABLE #{temp_table_name} ADD PRIMARY KEY(#{primary_key_fields.join(', ')})")

    # Pull data from read-only database / Insert into temp table
    replace_into(value_sql, temp_table_name, primary_key_fields + fields)

    # Run update joining table to temp table
    join_sql = primary_key_fields.collect{ | primary_key_field| "#{table}.#{primary_key_field} = #{temp_table_name}.#{primary_key_field}" }
    update_sql = "UPDATE #{table} JOIN #{temp_table_name} ON #{join_sql.join(' AND ')} SET "

    set_statements = fields.collect do | field |
      "#{table}.#{field} = #{temp_table_name}.#{field}"
    end

    update_sql += set_statements.join(", ")

    ActiveRecord::Base.connection.execute(update_sql)

    # Drop temp table
    ActiveRecord::Base.connection.execute("DROP TABLE #{temp_table_name}")
  end
end