class RemoveSubject < ActiveRecord::Migration[6.1]
  def change
    remove_column :communications, :subject
  end
end
