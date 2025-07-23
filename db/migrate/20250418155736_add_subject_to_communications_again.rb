class AddSubjectToCommunicationsAgain < ActiveRecord::Migration[6.1]
  def change
    add_column :communications, :subject, :string, after: :read_at
  end
end
