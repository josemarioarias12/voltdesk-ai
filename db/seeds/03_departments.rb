# frozen_string_literal: true

Rails.logger.debug '  Creating departments and SLA policies...'

DEPARTMENTS = [
  { name: 'IT & Digital Banking', color: '#14b8a6', icon: 'laptop' },
  { name: 'Branch Operations',    color: '#0ea5e9', icon: 'briefcase' },
  { name: 'Customer Service',     color: '#ec4899', icon: 'users' },
  { name: 'HR',                   color: '#8b5cf6', icon: 'users' },
  { name: 'Finance & Treasury',   color: '#22c55e', icon: 'dollar-sign' },
  { name: 'Compliance & Risk',    color: '#ef4444', icon: 'wrench' },
  { name: 'Facilities',           color: '#f97316', icon: 'building' },
  { name: 'General',              color: '#6366f1', icon: 'briefcase' }
].freeze

SLA_POLICIES = [
  { name: 'Critical SLA', priority: :critical, first_response_hours: 1,  resolution_hours: 4  },
  { name: 'High SLA',     priority: :high,     first_response_hours: 2,  resolution_hours: 8  },
  { name: 'Medium SLA',   priority: :medium,   first_response_hours: 4,  resolution_hours: 24 },
  { name: 'Low SLA',      priority: :low,      first_response_hours: 8,  resolution_hours: 72 }
].freeze

Workspace.find_each do |ws|
  DEPARTMENTS.each do |data|
    Department.create!(workspace: ws, name: data[:name], color: data[:color], icon: data[:icon])
  end

  SLA_POLICIES.each do |data|
    SlaPolicy.create!(
      workspace:            ws,
      name:                 data[:name],
      priority:             data[:priority],
      first_response_hours: data[:first_response_hours],
      resolution_hours:     data[:resolution_hours]
    )
  end

  Rails.logger.debug { "  Departments + SLAs created for #{ws.name}" }
end

Rails.logger.debug { "  Departments total: #{Department.count} | SLA Policies: #{SlaPolicy.count}" }