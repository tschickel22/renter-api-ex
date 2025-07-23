class RenameApplicationFeeAccount < ActiveRecord::Migration[6.1]
  def change
    execute "update accounts set name ='Other Fees Income' where name ='Application Fees Income' and code='426.00'"
  end
end
