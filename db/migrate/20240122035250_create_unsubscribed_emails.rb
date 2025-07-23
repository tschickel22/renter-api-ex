class CreateUnsubscribedEmails < ActiveRecord::Migration[6.1]
  def change
    create_table :unsubscribed_emails do |t|
      t.string :email, index: true
      t.timestamps
    end
  end
end
