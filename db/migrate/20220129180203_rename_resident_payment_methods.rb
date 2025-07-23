class RenameResidentPaymentMethods < ActiveRecord::Migration[6.1]
  def change
    rename_table :resident_payment_methods, :payment_methods

    add_column :payment_methods, :type, :string, after: :id

    execute "UPDATE payment_methods SET type = 'ResidentPaymentMethod'"
  end
end
