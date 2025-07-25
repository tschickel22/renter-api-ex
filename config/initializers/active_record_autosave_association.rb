# Monkey patch
module ActiveRecord
  module AutosaveAssociation
    def validate_collection_association(reflection)
      if association = association_instance_get(reflection.name)
        if records = associated_records_to_validate_or_save(association, new_record?, reflection.options[:autosave])
          all_records = association.target.find_all
          records.each do |record|
            index = all_records.find_index(record)
            association_valid?(reflection, record, index)
          end
        end
      end
    end
  end
end
