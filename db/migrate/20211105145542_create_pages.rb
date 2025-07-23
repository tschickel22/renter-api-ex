class CreatePages < ActiveRecord::Migration[6.1]
  def change
    create_table :pages do |t|
      t.string :url
      t.text :body

      t.timestamps
      t.datetime :deleted_at
    end

    Page.create(url: 'home', body: 'Hello, World.')
  end
end
