# frozen_string_literal: true

puts "  Creating workspaces..."

workspaces_data = [
  {
    name: "TechCorp Inc", slug: "techcorp", plan: "enterprise",
    settings: {
      "timezone" => "America/New_York", "language" => "en",
      "automation_threshold" => 0.85, "human_in_the_loop" => true,
      "features" => { "voice_to_ticket" => true, "qr_demo_mode" => true,
                      "pattern_detection" => true, "executive_reports" => true,
                      "anomaly_detection" => true, "workflow_automation" => true }
    }
  },
  {
    name: "HealthCo Medical", slug: "healthco", plan: "professional",
    settings: {
      "timezone" => "America/Chicago", "language" => "en",
      "automation_threshold" => 0.90, "human_in_the_loop" => true,
      "features" => { "voice_to_ticket" => true, "qr_demo_mode" => true,
                      "pattern_detection" => true, "executive_reports" => true,
                      "anomaly_detection" => true, "workflow_automation" => true }
    }
  },
  {
    name: "RetailPlus", slug: "retailplus", plan: "professional",
    settings: {
      "timezone" => "America/Los_Angeles", "language" => "en",
      "automation_threshold" => 0.80, "human_in_the_loop" => false,
      "features" => { "voice_to_ticket" => true, "qr_demo_mode" => true,
                      "pattern_detection" => true, "executive_reports" => true,
                      "anomaly_detection" => true, "workflow_automation" => true }
    }
  },
  {
    name: "StartupAI", slug: "startupai", plan: "starter",
    settings: {
      "timezone" => "America/Los_Angeles", "language" => "en",
      "automation_threshold" => 0.75, "human_in_the_loop" => true,
      "features" => { "voice_to_ticket" => true, "qr_demo_mode" => true,
                      "pattern_detection" => true, "executive_reports" => false,
                      "anomaly_detection" => true, "workflow_automation" => false }
    }
  },
  {
    name: "ConsultingPro", slug: "consultingpro", plan: "enterprise",
    settings: {
      "timezone" => "America/New_York", "language" => "en",
      "automation_threshold" => 0.95, "human_in_the_loop" => true,
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
]

workspaces_data.each do |data|
  ws = Workspace.create!(
    name: data[:name], slug: data[:slug], plan: data[:plan],
    active: true, ai_provider: "openai", ai_model: "gpt-4o",
    ai_fallback_provider: "anthropic", ai_selection_mode: "primary",
    settings: data[:settings]
  )
  puts "  Created workspace: #{ws.name} [#{ws.plan}]"
end

puts "  Workspaces total: #{Workspace.count}"