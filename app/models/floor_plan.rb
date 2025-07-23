class FloorPlan < ParanoidRecord
  has_paper_trail versions: {class_name: "Versions::Company"}

  belongs_to :property
end
