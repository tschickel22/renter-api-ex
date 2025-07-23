class AddDescriptionToAccountEntries < ActiveRecord::Migration[6.1]
  def change
    add_column :account_entries, :description, :string, after: :entry_on
  end
end
