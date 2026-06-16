# frozen_string_literal: true

total_start = Time.current

seed_files = %w[
  00_cleanup 01_workspaces 02_users 03_departments 04_tickets
  05_assets 06_ai_data 07_hr_data 08_facilities 09_compliance
  10_workflows 11_api_data 12_demo_workspace 13_pattern_alerts
]

seed_files.each do |file|
  file_start = Time.current
  Rails.logger.debug { "\n==> Loading #{file}..." }
  load Rails.root.join("db/seeds/#{file}.rb")
  Rails.logger.debug { "--> #{file} done in #{(Time.current - file_start).round(2)}s" }
end

Rails.logger.debug { "\n==> COMPLETE in #{(Time.current - total_start).round(2)}s" }
Rails.logger.debug { "Workspaces: #{Workspace.count} | Users: #{User.count} | Tickets: #{Ticket.count}" }
Workspace.order(:created_at).each do |ws|
  Rails.logger.debug { "\n#{ws.name}:" }
  ws.users.order(:role).each { |u| Rails.logger.debug "  #{u.email} [#{u.role}]" }
end
