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

ActiveRecord::Schema[8.1].define(version: 2026_06_26_001334) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vector"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "agent_actions", force: :cascade do |t|
    t.integer "action_type", default: 0, null: false
    t.bigint "approved_by_id"
    t.decimal "confidence", precision: 5, scale: 4, null: false
    t.datetime "created_at", null: false
    t.datetime "executed_at"
    t.jsonb "result", default: {}, null: false
    t.integer "status", default: 0, null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["action_type"], name: "index_agent_actions_on_action_type"
    t.index ["approved_by_id"], name: "index_agent_actions_on_approved_by_id"
    t.index ["result"], name: "index_agent_actions_on_result", using: :gin
    t.index ["status"], name: "index_agent_actions_on_status"
    t.index ["ticket_id"], name: "index_agent_actions_on_ticket_id"
    t.index ["workspace_id"], name: "index_agent_actions_on_workspace_id"
  end

  create_table "ai_audit_logs", force: :cascade do |t|
    t.integer "completion_tokens", default: 0, null: false
    t.decimal "confidence_score", precision: 4, scale: 3
    t.datetime "created_at", null: false
    t.integer "duration_ms", default: 0, null: false
    t.string "model", default: "gpt-4o", null: false
    t.integer "operation", null: false
    t.text "prompt", null: false
    t.integer "prompt_tokens", default: 0, null: false
    t.string "provider"
    t.text "response", null: false
    t.integer "status", default: 0, null: false
    t.integer "total_tokens", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.bigint "workspace_id", null: false
    t.index ["user_id"], name: "index_ai_audit_logs_on_user_id"
    t.index ["workspace_id", "created_at"], name: "idx_ai_audit_logs_workspace_date"
    t.index ["workspace_id", "operation"], name: "idx_ai_audit_logs_workspace_operation"
    t.index ["workspace_id"], name: "index_ai_audit_logs_on_workspace_id"
  end

  create_table "api_keys", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "key_digest", null: false
    t.datetime "last_used_at"
    t.string "name", null: false
    t.jsonb "scopes", default: [], null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "workspace_id", null: false
    t.index ["key_digest"], name: "index_api_keys_on_key_digest", unique: true
    t.index ["user_id"], name: "index_api_keys_on_user_id"
    t.index ["workspace_id"], name: "index_api_keys_on_workspace_id"
  end

  create_table "api_requests", force: :cascade do |t|
    t.bigint "api_key_id", null: false
    t.datetime "created_at", null: false
    t.integer "duration_ms"
    t.string "endpoint", null: false
    t.string "http_method", null: false
    t.string "ip_address"
    t.integer "status_code"
    t.bigint "workspace_id", null: false
    t.index ["api_key_id", "created_at"], name: "index_api_requests_on_api_key_id_and_created_at"
    t.index ["api_key_id"], name: "index_api_requests_on_api_key_id"
    t.index ["workspace_id", "created_at"], name: "index_api_requests_on_workspace_id_and_created_at"
    t.index ["workspace_id"], name: "index_api_requests_on_workspace_id"
  end

  create_table "asset_incidents", force: :cascade do |t|
    t.bigint "asset_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.bigint "reported_by_id"
    t.date "resolved_at"
    t.integer "severity", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["asset_id", "created_at"], name: "index_asset_incidents_on_asset_id_and_created_at"
    t.index ["reported_by_id"], name: "index_asset_incidents_on_reported_by_id"
    t.index ["workspace_id", "created_at"], name: "index_asset_incidents_on_workspace_id_and_created_at"
  end

  create_table "assets", force: :cascade do |t|
    t.jsonb "ai_metadata", default: {}, null: false
    t.string "asset_number", null: false
    t.integer "asset_type", default: 0, null: false
    t.date "assigned_at"
    t.bigint "assigned_to_id"
    t.string "condition_at_assignment"
    t.datetime "created_at", null: false
    t.bigint "department_id"
    t.integer "incident_count", default: 0, null: false
    t.date "last_maintenance_at"
    t.string "model_spec"
    t.string "name", null: false
    t.text "notes"
    t.date "purchase_date"
    t.decimal "purchase_price", precision: 10, scale: 2
    t.integer "risk_score", default: 0, null: false
    t.string "serial_number"
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.string "vendor_contract_url"
    t.jsonb "warranty_alerts_sent", default: {}, null: false
    t.date "warranty_expires_at"
    t.bigint "workspace_id", null: false
    t.index ["ai_metadata"], name: "index_assets_on_ai_metadata", using: :gin
    t.index ["asset_number"], name: "index_assets_on_asset_number"
    t.index ["assigned_to_id"], name: "index_assets_on_assigned_to_id"
    t.index ["department_id"], name: "index_assets_on_department_id"
    t.index ["warranty_expires_at"], name: "index_assets_on_warranty_expires_at"
    t.index ["workspace_id", "asset_number"], name: "index_assets_on_workspace_id_and_asset_number", unique: true
    t.index ["workspace_id", "risk_score"], name: "index_assets_on_workspace_id_and_risk_score"
    t.index ["workspace_id", "status"], name: "index_assets_on_workspace_id_and_status"
  end

  create_table "classification_corrections", force: :cascade do |t|
    t.bigint "agent_id", null: false
    t.string "corrected_category", null: false
    t.text "correction_note"
    t.datetime "created_at", null: false
    t.string "original_category", null: false
    t.bigint "ticket_id", null: false
    t.bigint "workspace_id", null: false
    t.index ["agent_id"], name: "index_classification_corrections_on_agent_id"
    t.index ["ticket_id"], name: "index_classification_corrections_on_ticket_id"
    t.index ["workspace_id", "created_at"], name: "idx_on_workspace_id_created_at_685388b11c"
    t.index ["workspace_id"], name: "index_classification_corrections_on_workspace_id"
  end

  create_table "compliance_logs", force: :cascade do |t|
    t.bigint "actor_id"
    t.datetime "created_at", null: false
    t.integer "event_type", default: 0, null: false
    t.string "ip_address"
    t.jsonb "metadata", default: {}, null: false
    t.bigint "resource_id", null: false
    t.string "resource_type", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["actor_id"], name: "index_compliance_logs_on_actor_id"
    t.index ["created_at"], name: "index_compliance_logs_on_created_at"
    t.index ["event_type"], name: "index_compliance_logs_on_event_type"
    t.index ["metadata"], name: "index_compliance_logs_on_metadata", using: :gin
    t.index ["resource_type", "resource_id"], name: "index_compliance_logs_on_resource_type_and_resource_id"
    t.index ["workspace_id"], name: "index_compliance_logs_on_workspace_id"
  end

  create_table "data_retention_policies", force: :cascade do |t|
    t.boolean "auto_purge", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "last_purge_at"
    t.string "resource_type", null: false
    t.integer "retention_days", default: 365, null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["workspace_id", "resource_type"], name: "idx_data_retention_policies_workspace_resource", unique: true
    t.index ["workspace_id"], name: "index_data_retention_policies_on_workspace_id"
  end

  create_table "departments", force: :cascade do |t|
    t.string "color", default: "#6366f1", null: false
    t.datetime "created_at", null: false
    t.string "icon", default: "briefcase", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["workspace_id", "name"], name: "index_departments_on_workspace_id_and_name", unique: true
    t.index ["workspace_id"], name: "index_departments_on_workspace_id"
  end

  create_table "leave_requests", force: :cascade do |t|
    t.bigint "approved_by_id"
    t.datetime "created_at", null: false
    t.string "doctor_certificate_url"
    t.date "end_date", null: false
    t.integer "leave_type", null: false
    t.text "medical_notes"
    t.text "reason"
    t.text "rejection_reason"
    t.date "start_date", null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "workspace_id", null: false
    t.index ["approved_by_id"], name: "index_leave_requests_on_approved_by_id"
    t.index ["user_id"], name: "index_leave_requests_on_user_id"
    t.index ["workspace_id", "status"], name: "index_leave_requests_on_workspace_id_and_status"
    t.index ["workspace_id", "user_id"], name: "index_leave_requests_on_workspace_id_and_user_id"
    t.index ["workspace_id"], name: "index_leave_requests_on_workspace_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.text "body"
    t.datetime "created_at", null: false
    t.integer "notification_type", default: 0, null: false
    t.boolean "read", default: false, null: false
    t.bigint "resource_id"
    t.string "resource_type"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "workspace_id", null: false
    t.index ["resource_type", "resource_id"], name: "index_notifications_on_resource_type_and_resource_id"
    t.index ["user_id", "read"], name: "index_notifications_on_user_id_and_read"
    t.index ["user_id"], name: "index_notifications_on_user_id"
    t.index ["workspace_id", "created_at"], name: "index_notifications_on_workspace_id_and_created_at"
    t.index ["workspace_id"], name: "index_notifications_on_workspace_id"
  end

  create_table "onboarding_plans", force: :cascade do |t|
    t.jsonb "ai_metadata", default: {}
    t.integer "completion_percentage", default: 0, null: false
    t.datetime "created_at", null: false
    t.integer "status", default: 0, null: false
    t.date "target_completion_date"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "workspace_id", null: false
    t.index ["user_id"], name: "index_onboarding_plans_on_user_id"
    t.index ["workspace_id", "user_id"], name: "index_onboarding_plans_on_workspace_id_and_user_id", unique: true
    t.index ["workspace_id"], name: "index_onboarding_plans_on_workspace_id"
  end

  create_table "onboarding_tasks", force: :cascade do |t|
    t.integer "category", default: 0, null: false
    t.boolean "completed", default: false, null: false
    t.datetime "created_at", null: false
    t.date "due_date"
    t.bigint "onboarding_plan_id", null: false
    t.integer "order_index", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["onboarding_plan_id", "order_index"], name: "index_onboarding_tasks_on_onboarding_plan_id_and_order_index"
    t.index ["onboarding_plan_id"], name: "index_onboarding_tasks_on_onboarding_plan_id"
  end

  create_table "pattern_alerts", force: :cascade do |t|
    t.integer "alert_type", default: 0, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.jsonb "metadata", default: {}, null: false
    t.datetime "resolved_at"
    t.integer "severity", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["metadata"], name: "index_pattern_alerts_on_metadata", using: :gin
    t.index ["resolved_at"], name: "index_pattern_alerts_on_resolved_at"
    t.index ["workspace_id", "alert_type"], name: "index_pattern_alerts_on_workspace_id_and_alert_type"
    t.index ["workspace_id"], name: "index_pattern_alerts_on_workspace_id"
  end

  create_table "sla_policies", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "first_response_hours", null: false
    t.string "name", null: false
    t.integer "priority", default: 0, null: false
    t.integer "resolution_hours", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["workspace_id", "priority"], name: "index_sla_policies_on_workspace_id_and_priority", unique: true
    t.index ["workspace_id"], name: "index_sla_policies_on_workspace_id"
  end

  create_table "space_reservations", force: :cascade do |t|
    t.integer "attendees_count", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "end_at", null: false
    t.bigint "space_id", null: false
    t.datetime "start_at", null: false
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.bigint "workspace_id", null: false
    t.index ["space_id", "start_at", "end_at"], name: "index_space_reservations_on_space_id_and_start_at_and_end_at"
    t.index ["space_id"], name: "index_space_reservations_on_space_id"
    t.index ["user_id", "start_at"], name: "index_space_reservations_on_user_id_and_start_at"
    t.index ["user_id"], name: "index_space_reservations_on_user_id"
    t.index ["workspace_id", "status"], name: "index_space_reservations_on_workspace_id_and_status"
    t.index ["workspace_id"], name: "index_space_reservations_on_workspace_id"
  end

  create_table "spaces", force: :cascade do |t|
    t.integer "capacity", default: 0, null: false
    t.datetime "created_at", null: false
    t.jsonb "equipment", default: {}, null: false
    t.string "floor", null: false
    t.string "name", null: false
    t.integer "space_type", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["workspace_id", "floor"], name: "index_spaces_on_workspace_id_and_floor"
    t.index ["workspace_id", "status"], name: "index_spaces_on_workspace_id_and_status"
    t.index ["workspace_id"], name: "index_spaces_on_workspace_id"
  end

  create_table "ticket_activities", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["ticket_id", "created_at"], name: "index_ticket_activities_on_ticket_id_and_created_at"
    t.index ["ticket_id"], name: "index_ticket_activities_on_ticket_id"
    t.index ["user_id"], name: "index_ticket_activities_on_user_id"
  end

  create_table "ticket_comments", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.boolean "internal", default: false, null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["ticket_id", "created_at"], name: "index_ticket_comments_on_ticket_id_and_created_at"
    t.index ["ticket_id"], name: "index_ticket_comments_on_ticket_id"
    t.index ["user_id"], name: "index_ticket_comments_on_user_id"
  end

  create_table "ticket_embeddings", force: :cascade do |t|
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.vector "embedding", limit: 1536, null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["embedding"], name: "idx_ticket_embeddings_hnsw", opclass: :vector_cosine_ops, using: :hnsw
    t.index ["ticket_id"], name: "index_ticket_embeddings_on_ticket_id", unique: true
    t.index ["workspace_id"], name: "idx_ticket_embeddings_workspace"
    t.index ["workspace_id"], name: "index_ticket_embeddings_on_workspace_id"
  end

  create_table "ticket_satisfaction_surveys", force: :cascade do |t|
    t.string "ai_themes", default: [], array: true
    t.datetime "created_at", null: false
    t.bigint "department_id", null: false
    t.text "feedback"
    t.integer "rating", null: false
    t.decimal "sentiment_score", precision: 4, scale: 3, null: false
    t.bigint "submitted_by_id", null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["created_at"], name: "index_ticket_satisfaction_surveys_on_created_at"
    t.index ["department_id"], name: "index_ticket_satisfaction_surveys_on_department_id"
    t.index ["sentiment_score"], name: "index_ticket_satisfaction_surveys_on_sentiment_score"
    t.index ["submitted_by_id"], name: "index_ticket_satisfaction_surveys_on_submitted_by_id"
    t.index ["ticket_id"], name: "index_ticket_satisfaction_surveys_on_ticket_id"
    t.index ["workspace_id", "department_id", "created_at"], name: "idx_surveys_workspace_dept_date"
    t.index ["workspace_id"], name: "index_ticket_satisfaction_surveys_on_workspace_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.jsonb "ai_metadata", default: {}, null: false
    t.bigint "assigned_to_id"
    t.integer "category", default: 0, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.bigint "department_id", null: false
    t.text "description"
    t.datetime "due_at"
    t.datetime "first_responded_at"
    t.integer "priority", default: 1, null: false
    t.datetime "resolved_at"
    t.decimal "sla_breach_probability", precision: 5, scale: 4
    t.bigint "sla_policy_id"
    t.datetime "sla_predicted_at"
    t.integer "source", default: 0, null: false
    t.bigint "space_id"
    t.integer "status", default: 0, null: false
    t.string "ticket_number", null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "urgency_score", default: 0, null: false
    t.bigint "workspace_id", null: false
    t.index ["assigned_to_id"], name: "idx_tickets_assigned_to_id"
    t.index ["assigned_to_id"], name: "index_tickets_on_assigned_to_id"
    t.index ["created_at"], name: "idx_tickets_created_at"
    t.index ["created_by_id"], name: "index_tickets_on_created_by_id"
    t.index ["department_id"], name: "idx_tickets_department_id"
    t.index ["department_id"], name: "index_tickets_on_department_id"
    t.index ["sla_breach_probability"], name: "index_tickets_on_high_breach_probability", where: "(sla_breach_probability > 0.70)"
    t.index ["sla_policy_id"], name: "index_tickets_on_sla_policy_id"
    t.index ["space_id"], name: "index_tickets_on_space_id"
    t.index ["workspace_id", "assigned_to_id", "status"], name: "index_tickets_on_workspace_assignee_status"
    t.index ["workspace_id", "due_at"], name: "index_tickets_on_workspace_due_at"
    t.index ["workspace_id", "priority"], name: "index_tickets_on_workspace_id_and_priority"
    t.index ["workspace_id", "status"], name: "index_tickets_on_workspace_id_and_status"
    t.index ["workspace_id", "ticket_number"], name: "index_tickets_on_workspace_id_and_ticket_number", unique: true
    t.index ["workspace_id"], name: "index_tickets_on_workspace_id"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "bank_account"
    t.datetime "created_at", null: false
    t.bigint "department_id"
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "first_name", default: "", null: false
    t.string "last_name", default: "", null: false
    t.string "provider"
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 8, null: false
    t.decimal "salary"
    t.string "uid"
    t.datetime "updated_at", null: false
    t.bigint "workspace_id"
    t.index ["department_id"], name: "index_users_on_department_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["provider", "uid"], name: "index_users_on_provider_and_uid", unique: true, where: "(provider IS NOT NULL)"
    t.index ["workspace_id", "role"], name: "index_users_on_workspace_id_and_role"
    t.index ["workspace_id"], name: "index_users_on_workspace_id"
  end

  create_table "webhooks", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.jsonb "events", default: [], null: false
    t.integer "failure_count", default: 0, null: false
    t.datetime "last_triggered_at"
    t.string "name", null: false
    t.string "secret_digest", null: false
    t.datetime "updated_at", null: false
    t.string "url", null: false
    t.bigint "workspace_id", null: false
    t.index ["workspace_id", "active"], name: "index_webhooks_on_workspace_id_and_active"
    t.index ["workspace_id"], name: "index_webhooks_on_workspace_id"
  end

  create_table "workflow_executions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "executed_at"
    t.integer "status", default: 0, null: false
    t.jsonb "steps_log", default: {}, null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "workflow_rule_id", null: false
    t.index ["executed_at"], name: "index_workflow_executions_on_executed_at"
    t.index ["status"], name: "index_workflow_executions_on_status"
    t.index ["steps_log"], name: "index_workflow_executions_on_steps_log", using: :gin
    t.index ["ticket_id"], name: "index_workflow_executions_on_ticket_id"
    t.index ["workflow_rule_id"], name: "index_workflow_executions_on_workflow_rule_id"
  end

  create_table "workflow_rules", force: :cascade do |t|
    t.jsonb "actions", default: {}, null: false
    t.boolean "active", default: true, null: false
    t.jsonb "conditions", default: {}, null: false
    t.datetime "created_at", null: false
    t.integer "execution_count", default: 0, null: false
    t.string "name", null: false
    t.integer "trigger_event", default: 0, null: false
    t.datetime "updated_at", null: false
    t.bigint "workspace_id", null: false
    t.index ["actions"], name: "index_workflow_rules_on_actions", using: :gin
    t.index ["active"], name: "index_workflow_rules_on_active"
    t.index ["conditions"], name: "index_workflow_rules_on_conditions", using: :gin
    t.index ["trigger_event"], name: "index_workflow_rules_on_trigger_event"
    t.index ["workspace_id"], name: "index_workflow_rules_on_workspace_id"
  end

  create_table "workspaces", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "ai_fallback_provider", default: "openai", null: false
    t.string "ai_model", default: "gpt-4o", null: false
    t.string "ai_provider", default: "openai", null: false
    t.string "ai_selection_mode", default: "automatic", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "plan", default: "starter", null: false
    t.jsonb "settings", default: {}, null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_workspaces_on_active"
    t.index ["slug"], name: "index_workspaces_on_slug", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "agent_actions", "tickets"
  add_foreign_key "agent_actions", "users", column: "approved_by_id"
  add_foreign_key "agent_actions", "workspaces"
  add_foreign_key "ai_audit_logs", "users"
  add_foreign_key "ai_audit_logs", "workspaces"
  add_foreign_key "api_keys", "users"
  add_foreign_key "api_keys", "workspaces"
  add_foreign_key "api_requests", "api_keys"
  add_foreign_key "api_requests", "workspaces"
  add_foreign_key "asset_incidents", "assets"
  add_foreign_key "asset_incidents", "users", column: "reported_by_id"
  add_foreign_key "asset_incidents", "workspaces"
  add_foreign_key "assets", "departments"
  add_foreign_key "assets", "users", column: "assigned_to_id"
  add_foreign_key "assets", "workspaces"
  add_foreign_key "classification_corrections", "tickets"
  add_foreign_key "classification_corrections", "users", column: "agent_id"
  add_foreign_key "classification_corrections", "workspaces"
  add_foreign_key "compliance_logs", "users", column: "actor_id"
  add_foreign_key "compliance_logs", "workspaces"
  add_foreign_key "data_retention_policies", "workspaces"
  add_foreign_key "departments", "workspaces"
  add_foreign_key "leave_requests", "users"
  add_foreign_key "leave_requests", "users", column: "approved_by_id"
  add_foreign_key "leave_requests", "workspaces"
  add_foreign_key "notifications", "users"
  add_foreign_key "notifications", "workspaces"
  add_foreign_key "onboarding_plans", "users"
  add_foreign_key "onboarding_plans", "workspaces"
  add_foreign_key "onboarding_tasks", "onboarding_plans"
  add_foreign_key "pattern_alerts", "workspaces"
  add_foreign_key "sla_policies", "workspaces"
  add_foreign_key "space_reservations", "spaces"
  add_foreign_key "space_reservations", "users"
  add_foreign_key "space_reservations", "workspaces"
  add_foreign_key "spaces", "workspaces"
  add_foreign_key "ticket_activities", "tickets"
  add_foreign_key "ticket_activities", "users"
  add_foreign_key "ticket_comments", "tickets"
  add_foreign_key "ticket_comments", "users"
  add_foreign_key "ticket_embeddings", "tickets"
  add_foreign_key "ticket_embeddings", "workspaces"
  add_foreign_key "ticket_satisfaction_surveys", "departments"
  add_foreign_key "ticket_satisfaction_surveys", "tickets"
  add_foreign_key "ticket_satisfaction_surveys", "users", column: "submitted_by_id"
  add_foreign_key "ticket_satisfaction_surveys", "workspaces"
  add_foreign_key "tickets", "departments"
  add_foreign_key "tickets", "sla_policies"
  add_foreign_key "tickets", "spaces"
  add_foreign_key "tickets", "users", column: "assigned_to_id"
  add_foreign_key "tickets", "users", column: "created_by_id"
  add_foreign_key "tickets", "workspaces"
  add_foreign_key "users", "departments"
  add_foreign_key "users", "workspaces"
  add_foreign_key "webhooks", "workspaces"
  add_foreign_key "workflow_executions", "tickets"
  add_foreign_key "workflow_executions", "workflow_rules"
  add_foreign_key "workflow_rules", "workspaces"
end
