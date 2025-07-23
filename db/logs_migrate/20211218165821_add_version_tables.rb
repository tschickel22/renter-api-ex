class AddVersionTables < ActiveRecord::Migration[6.1]
  TEXT_BYTES = 1_073_741_823
  def change
    create_table :versions, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci" do |t|
      t.string   :item_type, { null: false, limit: 191 }
      t.bigint   :item_id,   null: false, index: true
      t.string   :event,     null: false
      t.string   :whodunnit
      t.text     :object, limit: TEXT_BYTES
      t.text     :object_changes, limit: TEXT_BYTES
      t.datetime :created_at
    end
    add_index :versions, %i(item_type item_id)

    create_table :versions_leases, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci" do |t|
      t.string   :item_type, { null: false, limit: 191 }
      t.bigint   :item_id,   null: false, index: true
      t.string   :event,     null: false
      t.string   :whodunnit
      t.text     :object, limit: TEXT_BYTES
      t.text     :object_changes, limit: TEXT_BYTES
      t.datetime :created_at
    end
    add_index :versions_leases, %i(item_type item_id)

    create_table :versions_residents, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci" do |t|
      t.string   :item_type, { null: false, limit: 191 }
      t.bigint   :item_id,   null: false, index: true
      t.string   :event,     null: false
      t.string   :whodunnit
      t.text     :object, limit: TEXT_BYTES
      t.text     :object_changes, limit: TEXT_BYTES
      t.datetime :created_at
    end
    add_index :versions_residents, %i(item_type item_id)

    create_table :versions_companies, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci" do |t|
      t.string   :item_type, { null: false, limit: 191 }
      t.bigint   :item_id,   null: false, index: true
      t.string   :event,     null: false
      t.string   :whodunnit
      t.text     :object, limit: TEXT_BYTES
      t.text     :object_changes, limit: TEXT_BYTES
      t.datetime :created_at
    end
    add_index :versions_companies, %i(item_type item_id)

    create_table :versions_users, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci" do |t|
      t.string   :item_type, { null: false, limit: 191 }
      t.bigint   :item_id,   null: false, index: true
      t.string   :event,     null: false
      t.string   :whodunnit
      t.text     :object, limit: TEXT_BYTES
      t.text     :object_changes, limit: TEXT_BYTES
      t.datetime :created_at
    end
    add_index :versions_users, %i(item_type item_id)
  end
end
