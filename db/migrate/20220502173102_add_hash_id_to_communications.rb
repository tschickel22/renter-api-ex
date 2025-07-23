class AddHashIdToCommunications < ActiveRecord::Migration[6.1]
  def change
    add_column :communications, :hash_id, :string, index: true, after: :id
  end
end
