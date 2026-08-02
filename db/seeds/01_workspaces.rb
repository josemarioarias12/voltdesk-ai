# frozen_string_literal: true

puts "  Creating workspace..."

workspace_data = {
  name: "Cordillera Bank", slug: "cordillera-bank", plan: "enterprise",
  settings: {
    "timezone" => "America/New_York", "language" => "en",
    "automation_threshold" => 0.85, "human_in_the_loop" => true,
    "features" => { "voice_to_ticket" => true, "qr_demo_mode" => true,
                    "pattern_detection" => true, "executive_reports" => true,
                    "anomaly_detection" => true, "workflow_automation" => true },
    "last_executive_report" => {
      "generated_at" => 3.days.ago.iso8601,
      "sla_compliance" => 94.2,
      "tickets_resolved" => 68,
      "avg_resolution_hours" => 6.4
    }
  }
}

ws = Workspace.create!(
  name: workspace_data[:name], slug: workspace_data[:slug], plan: workspace_data[:plan],
  active: true, ai_provider: "openai", ai_model: "gpt-4o",
  ai_fallback_provider: "anthropic", ai_selection_mode: "automatic",
  settings: workspace_data[:settings]
)
puts "  Created workspace: #{ws.name} [#{ws.plan}]"

puts "  Workspaces total: #{Workspace.count}"