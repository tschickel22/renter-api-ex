class LogsRecord < ApplicationRecord
  self.abstract_class = true

  connects_to database: { writing: :logs }
end
