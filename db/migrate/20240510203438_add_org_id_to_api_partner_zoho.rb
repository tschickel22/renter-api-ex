class AddOrgIdToApiPartnerZoho < ActiveRecord::Migration[6.1]
  def change
    execute <<-SQL
      UPDATE api_partners
      SET encrypted_credentials = 'VOurKbLLvS+rkdTBcwSdPHQT2rLERJo90MO18j6uGxOn+rvHfKtYf0AFTjGs\nZCB1Vht7bMlwqXyEyISPbc0ZKGVuBhfJiEdf5aARpA7A+TK65Fe2Nm2KIIMM\nrazsg9iXPjviFXpWxPbI9g342Ulh5xqRmCdzD0hzhHcVfLe1aLhUUpMUGlq5\n5Hw4VnBHfDsIpDLo9T5ozwMYP9pCCfR7i97mBtOLhDa2/qC6W7TdoeTY1M4m\nkYktqjj86Whs6J3MyqCeG/n16ow/iW7lpXiZkfIxOlBLzgNhLXU1elTjg6C2\nzLmfcXaXqoUJH2TiApU7Uz9KnjkQPsy2oFH1R6b8ZDHB/fQx/k8QhnxDd7vk\ntkCf4i40Pkcfk28jdVkZ3zGliX+Qabypyo7KWSL5UD4D7oIs7oYTmnrLfCD8\nrlfdNFzOc4dhZAkkQnrUPJcsG5qtW/KpyHTV1RBGyOpiCMZtz3yd63bT+Xtn\nZRoz30wkcEOCtg9FeJ6pgY4NtP/OM0BAnxqU0XT1ZPalQZ/rrvjSk/DT7dgy\nxYc=\n',
          encrypted_credentials_iv = 'TefyPSytrb00HjrL',
          updated_at = '2024-05-10 20:19:55.633883'
      WHERE id = 5
    SQL
  end
end
