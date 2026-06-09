# frozen_string_literal: true

# ============================================================
# PulseDesk AI — Production Seeds
# Creates: 1 demo workspace + admin user + base departments
# Usage: rails db:seed
# ============================================================

Rails.logger.debug '==> Seeding PulseDesk AI...'

# ── Workspace ────────────────────────────────────────────────
workspace = Workspace.find_or_create_by!(slug: 'pulsedesk-demo') do |ws|
  ws.name                  = 'PulseDesk Demo'
  ws.plan                  = 'enterprise'
  ws.active                = true
  ws.ai_provider           = 'openai'
  ws.ai_model              = 'gpt-4o'
  ws.ai_fallback_provider  = 'anthropic'
  ws.ai_selection_mode     = 'primary'
  ws.settings              = {
    'timezone'       => 'America/Costa_Rica',
    'language'       => 'es',
    'features'       => {
      'voice_to_ticket'    => true,
      'qr_demo_mode'       => true,
      'pattern_detection'  => true,
      'executive_reports'  => true
    }
  }
end
Rails.logger.debug { "  Workspace: #{workspace.name} (#{workspace.slug})" }

# ── Departments ──────────────────────────────────────────────
departments_data = [
  { name: 'IT',         color: '#0ea5e9', icon: 'laptop'      },
  { name: 'HR',         color: '#22c55e', icon: 'users'       },
  { name: 'Facilities', color: '#f97316', icon: 'building'    },
  { name: 'Finance',    color: '#eab308', icon: 'dollar-sign' },
  { name: 'Operations', color: '#6366f1', icon: 'chart-bar'   },
  { name: 'General',    color: '#8b5cf6', icon: 'briefcase'   }
]

departments = departments_data.map do |data|
  dept = Department.find_or_create_by!(workspace: workspace, name: data[:name]) do |dep|
    dep.color = data[:color]
    dep.icon  = data[:icon]
  end
  Rails.logger.debug { "  Department: #{dept.name}" }
  dept
end

dept_map = departments.index_by(&:name)

# ── SLA Policies ─────────────────────────────────────────────
sla_data = [
  { name: 'Critical SLA', priority: :critical, first_response_hours: 1,  resolution_hours: 4  },
  { name: 'High SLA',     priority: :high,     first_response_hours: 2,  resolution_hours: 8  },
  { name: 'Medium SLA',   priority: :medium,   first_response_hours: 4,  resolution_hours: 24 },
  { name: 'Low SLA',      priority: :low,      first_response_hours: 8,  resolution_hours: 72 }
]

sla_data.each do |sla_item|
  SlaPolicy.find_or_create_by!(workspace: workspace, name: sla_item[:name]) do |sla|
    sla.priority             = sla_item[:priority]
    sla.first_response_hours = sla_item[:first_response_hours]
    sla.resolution_hours     = sla_item[:resolution_hours]
  end
  Rails.logger.debug { "  SLA Policy: #{sla_item[:name]}" }
end

# ── Users ────────────────────────────────────────────────────
users_data = [
  { email: 'admin@pulsedesk.ai',    first_name: 'Admin',  last_name: 'PulseDesk', role: :workspace_admin,
department_name: 'IT'      },
  { email: 'agent@pulsedesk.ai',    first_name: 'Sarah',  last_name: 'Connor',    role: :agent,
department_name: 'IT'      },
  { email: 'hr@pulsedesk.ai',       first_name: 'Maria',  last_name: 'Lopez',     role: :hr_manager,
department_name: 'HR'      },
  { email: 'it@pulsedesk.ai',       first_name: 'James',  last_name: 'Wilson',    role: :it_manager,
department_name: 'IT'      },
  { email: 'employee@pulsedesk.ai', first_name: 'Carlos', last_name: 'Ramirez',   role: :employee,
department_name: 'General' }
]

users_data.each do |data|
  user = User.find_or_initialize_by(workspace: workspace, email: data[:email])
  if user.new_record?
    user.assign_attributes(
      first_name:            data[:first_name],
      last_name:             data[:last_name],
      role:                  data[:role],
      department_id:         dept_map[data[:department_name]]&.id,
      password:              'Password123x',
      password_confirmation: 'Password123x',
      active:                true
    )
    user.save!
    Rails.logger.debug { "  User created: #{user.email} (#{user.role})" }
  else
    Rails.logger.debug { "  User exists:  #{user.email} (#{user.role})" }
  end
end

Rails.logger.debug ''
Rails.logger.debug '==> Seed complete!'
Rails.logger.debug ''
Rails.logger.debug '  Login credentials:'
Rails.logger.debug '  ----------------------------------'
users_data.each do |data|
  Rails.logger.debug "  #{data[:email].ljust(30)} Password123x  [#{data[:role]}]"
end
Rails.logger.debug '  ----------------------------------'
Rails.logger.debug ''
Rails.logger.debug { "  Workspace: #{workspace.name}" }
Rails.logger.debug { "  Slug:      #{workspace.slug}" }
Rails.logger.debug ''
