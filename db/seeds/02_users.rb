# frozen_string_literal: true

Rails.logger.debug '  Creating users...'

USERS_BLUEPRINT = [
  { email_prefix: 'admin',       first_name: 'Admin',    last_name: 'Owner',     role: :workspace_admin,
dept: 'IT & Digital Banking' },
  { email_prefix: 'it.manager',  first_name: 'James',    last_name: 'Wilson',    role: :it_manager,
dept: 'IT & Digital Banking' },
  { email_prefix: 'hr.manager',  first_name: 'Maria',    last_name: 'Lopez',     role: :hr_manager,
dept: 'HR'         },
  { email_prefix: 'ops',         first_name: 'Diana',    last_name: 'Torres',    role: :operations_manager,
dept: 'Branch Operations' },
  { email_prefix: 'fac.manager', first_name: 'Carlos',   last_name: 'Vega',     role: :facilities_manager,
dept: 'Facilities' },
  { email_prefix: 'dept.mgr',    first_name: 'Roberto',  last_name: 'Castillo',  role: :department_manager,
dept: 'Finance & Treasury' },
  { email_prefix: 'agent1',      first_name: 'Sarah',    last_name: 'Connor',    role: :agent,
dept: 'IT & Digital Banking' },
  { email_prefix: 'agent2',      first_name: 'Luis',     last_name: 'Mendez',    role: :agent,
dept: 'HR'         },
  { email_prefix: 'emp1',        first_name: 'Carlos',   last_name: 'Ramirez',   role: :employee,
dept: 'General'    },
  { email_prefix: 'emp2',        first_name: 'Ana',      last_name: 'Gutierrez', role: :employee,
dept: 'Finance & Treasury' },
  { email_prefix: 'emp3',        first_name: 'Pedro',    last_name: 'Vargas',    role: :employee,
dept: 'Branch Operations' }
].freeze

Workspace.find_each do |ws|
  depts = Department.where(workspace: ws).index_by(&:name)

  USERS_BLUEPRINT.each do |data|
    User.create!(
      workspace:             ws,
      email:                 "#{data[:email_prefix]}@#{ws.slug}.voltdesk.ai",
      first_name:            data[:first_name],
      last_name:             data[:last_name],
      role:                  data[:role],
      department:            depts[data[:dept]],
      password:              'Password123x',
      password_confirmation: 'Password123x',
      active:                true
    )
  end

  Rails.logger.debug { "  Users created for #{ws.name} (#{USERS_BLUEPRINT.size} users)" }
end


REAL_DEMO_USERS = [
  { email: 'jmariasm@ucenfotec.ac.cr',      first_name: 'Michael', last_name: 'Chen',    role: :workspace_admin, dept: 'IT & Digital Banking' },
  { email: 'josemarioarias12@gmail.com',    first_name: 'Laura',   last_name: 'Jimenez', role: :employee,        dept: 'Branch Operations' },
  { email: 'josemarioarias123@gmail.com',   first_name: 'David',   last_name: 'Torres',  role: :agent,           dept: 'Customer Service' },
  { email: 'josemarioarias96@gmail.com',    first_name: 'Rachel',  last_name: 'Kim',     role: :workspace_admin, dept: 'IT & Digital Banking' }
].freeze

demo_ws    = Workspace.find_by!(slug: 'cordillera-bank')
demo_depts = Department.where(workspace: demo_ws).index_by(&:name)

REAL_DEMO_USERS.each do |data|
  User.create!(
    workspace:             demo_ws,
    email:                 data[:email],
    first_name:            data[:first_name],
    last_name:             data[:last_name],
    role:                  data[:role],
    department:            demo_depts[data[:dept]],
    password:              'VoltDesk@2026',
    password_confirmation: 'VoltDesk@2026',
    active:                true
  )
end

Rails.logger.debug { "  Real demo users created (#{REAL_DEMO_USERS.size})" }
Rails.logger.debug { "  Users total: #{User.count}" }