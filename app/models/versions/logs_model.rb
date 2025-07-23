class Versions::LogsModel < PaperTrail::Version
  self.abstract_class = true
  connects_to database: { writing: :logs }
end

