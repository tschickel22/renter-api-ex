# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2022_11_19_820285) do

  create_table "api_logs", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "api_partner_id"
    t.integer "company_id"
    t.string "action"
    t.string "url"
    t.string "ip_address"
    t.string "status"
    t.text "request"
    t.text "response"
    t.float "response_time"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["action"], name: "index_api_logs_on_action"
    t.index ["api_partner_id"], name: "index_api_logs_on_api_partner_id"
    t.index ["company_id"], name: "index_api_logs_on_company_id"
  end

  create_table "communication_logs", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|
    t.integer "communication_id"
    t.text "data", size: :long
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["communication_id"], name: "index_communication_logs_on_communication_id"
  end

  create_table "versions", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_on_item_id"
    t.index ["item_type", "item_id"], name: "index_versions_on_item_type_and_item_id"
  end

  create_table "versions_companies", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_companies_on_item_id"
    t.index ["item_type", "item_id"], name: "index_versions_companies_on_item_type_and_item_id"
  end

  create_table "versions_expenses", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_expenses_on_item_id"
    t.index ["item_type", "item_id"], name: "index_versions_expenses_on_item_type_and_item_id"
  end

  create_table "versions_journal_entries", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_journal_entries_on_item_id"
  end

  create_table "versions_leases", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_leases_on_item_id"
    t.index ["item_type", "item_id"], name: "index_versions_leases_on_item_type_and_item_id"
  end

  create_table "versions_maintenance_requests", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_maintenance_requests_on_item_id"
    t.index ["item_type", "item_id"], name: "index_versions_maintenance_requests_on_item_type_and_item_id"
  end

  create_table "versions_residents", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_residents_on_item_id"
    t.index ["item_type", "item_id"], name: "index_versions_residents_on_item_type_and_item_id"
  end

  create_table "versions_users", charset: "utf8mb4", collation: "utf8mb4_general_ci", force: :cascade do |t|
    t.string "item_type", limit: 191, null: false
    t.bigint "item_id", null: false
    t.string "event", null: false
    t.string "whodunnit"
    t.text "object", size: :long
    t.text "object_changes", size: :long
    t.datetime "created_at"
    t.index ["item_id"], name: "index_versions_users_on_item_id"
    t.index ["item_type", "item_id"], name: "index_versions_users_on_item_type_and_item_id"
  end

end
