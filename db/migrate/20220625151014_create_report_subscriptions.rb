class CreateReportSubscriptions < ActiveRecord::Migration[6.1]
  def change
    create_table :report_subscriptions do |t|
      t.integer :user_id, index: true
      t.integer :company_id, index: true
      t.string :name
      t.string :report_class
      t.text :criteria
      t.string :run_every
      t.datetime :last_run_at
      t.string :status
      t.boolean :active
      t.string :run_every_specific
      t.text :additional_recipients
      t.string :delivery_format
      t.integer :last_updated_by_user_id, index: true
      t.timestamps
      t.datetime :deleted_at

    end
  end
end
