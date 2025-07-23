class RemoveCommunicationVersions < ActiveRecord::Migration[6.1]
  def change
    drop_table :versions_communications
  end
end
