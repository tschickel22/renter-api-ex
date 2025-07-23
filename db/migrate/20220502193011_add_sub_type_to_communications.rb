class AddSubTypeToCommunications < ActiveRecord::Migration[6.1]
  def change
    add_column :communications, :sub_type, :string, after: :type
  end
end
