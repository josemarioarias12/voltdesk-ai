# frozen_string_literal: true

Rails.logger.debug '  Creating departments and SLA policies...'

DEPARTMENTS_BY_INDUSTRY = {
  'techcorp' => [
    { name: 'IT Infrastructure', color: '#0ea5e9', icon: 'laptop' },
    { name: 'Software Engineering', color: '#6366f1', icon: 'laptop'      },
    { name: 'HR',                   color: '#22c55e', icon: 'users'       },
    { name: 'Finance',              color: '#eab308', icon: 'dollar-sign' },
    { name: 'Operations',           color: '#f97316', icon: 'chart-bar'   },
    { name: 'Facilities',           color: '#8b5cf6', icon: 'building'    },
    { name: 'General',              color: '#14b8a6', icon: 'briefcase'   }
  ],
  'healthco' => [
    { name: 'IT',             color: '#0ea5e9', icon: 'laptop'      },
    { name: 'Nursing',        color: '#ec4899', icon: 'users'       },
    { name: 'HR',             color: '#22c55e', icon: 'users'       },
    { name: 'Finance',        color: '#eab308', icon: 'dollar-sign' },
    { name: 'Facilities',     color: '#f97316', icon: 'building'    },
    { name: 'Administration', color: '#6366f1', icon: 'briefcase'   },
    { name: 'General',        color: '#14b8a6', icon: 'briefcase'   }
  ],
  'retailplus' => [
    { name: 'IT', color: '#0ea5e9', icon: 'laptop'      },
    { name: 'Store Operations', color: '#f97316', icon: 'briefcase'  },
    { name: 'HR',              color: '#22c55e', icon: 'users'       },
    { name: 'Finance',         color: '#eab308', icon: 'dollar-sign' },
    { name: 'Logistics',       color: '#6366f1', icon: 'briefcase'   },
    { name: 'Facilities',      color: '#8b5cf6', icon: 'building'    },
    { name: 'General',         color: '#14b8a6', icon: 'briefcase'   }
  ],
  'startupai' => [
    { name: 'Engineering', color: '#6366f1', icon: 'laptop'      },
    { name: 'Product',     color: '#0ea5e9', icon: 'briefcase'   },
    { name: 'HR',          color: '#22c55e', icon: 'users'       },
    { name: 'Finance',     color: '#eab308', icon: 'dollar-sign' },
    { name: 'Operations',  color: '#f97316', icon: 'chart-bar'   },
    { name: 'Facilities',  color: '#8b5cf6', icon: 'building'    },
    { name: 'General',     color: '#14b8a6', icon: 'briefcase'   }
  ],
  'consultingpro' => [
    { name: 'IT',                  color: '#0ea5e9', icon: 'laptop'      },
    { name: 'Consulting',          color: '#6366f1', icon: 'briefcase'   },
    { name: 'HR',                  color: '#22c55e', icon: 'users'       },
    { name: 'Finance',             color: '#eab308', icon: 'dollar-sign' },
    { name: 'Legal & Compliance',  color: '#ef4444', icon: 'wrench'      },
    { name: 'Facilities',          color: '#8b5cf6', icon: 'building'    },
    { name: 'General',             color: '#14b8a6', icon: 'briefcase'   }
  ]
}.freeze

SLA_POLICIES = [
  { name: 'Critical SLA', priority: :critical, first_response_hours: 1,  resolution_hours: 4  },
  { name: 'High SLA',     priority: :high,     first_response_hours: 2,  resolution_hours: 8  },
  { name: 'Medium SLA',   priority: :medium,   first_response_hours: 4,  resolution_hours: 24 },
  { name: 'Low SLA',      priority: :low,      first_response_hours: 8,  resolution_hours: 72 }
].freeze

Workspace.find_each do |ws|
  depts = DEPARTMENTS_BY_INDUSTRY[ws.slug] || DEPARTMENTS_BY_INDUSTRY['techcorp']
  depts.each do |data|
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
