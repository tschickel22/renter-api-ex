class UpdateTuBundleIds < ActiveRecord::Migration[6.1]
  def change
    execute "UPDATE screening_packages SET external_screening_id = external_screening_id + 6000 WHERE external_screening_id < 10"
  end
end
