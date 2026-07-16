# frozen_string_literal: true

Rails.logger.debug '  Creating assets...'

ASSETS = [
  # ── Core Infrastructure ────────────────────────────────────────────────────
  { name: 'Core Banking Server — Primary',     asset_type: :server,  status: :active,         risk_score: 88,
incident_count: 4, serial: 'CBS-P01-CB', warranty_days: 20  },
  { name: 'Core Banking Server — Standby',     asset_type: :server,  status: :active,         risk_score: 60,
incident_count: 1, serial: 'CBS-S01-CB', warranty_days: 90  },
  { name: 'SWIFT Gateway Server',              asset_type: :server,  status: :active,         risk_score: 70,
incident_count: 2, serial: 'SWG-01-CB',  warranty_days: 60  },
  { name: 'Backup Server — Data Center',       asset_type: :server,  status: :in_maintenance, risk_score: 55,
incident_count: 2, serial: 'BKS-01-CB',  warranty_days: 100 },
  { name: 'Fraud Detection Server',            asset_type: :server,  status: :active,         risk_score: 45,
incident_count: 1, serial: 'FDS-01-CB',  warranty_days: 200 },

  # ── ATMs & Branch Security ─────────────────────────────────────────────────
  { name: 'ATM — Branch 12 Downtown',          asset_type: :other,   status: :in_maintenance, risk_score: 90,
incident_count: 5, serial: 'ATM-B12-CB', warranty_days: 10  },
  { name: 'ATM — Branch 7 Riverside',          asset_type: :other,   status: :in_maintenance, risk_score: 85,
incident_count: 4, serial: 'ATM-B07-CB', warranty_days: 15  },
  { name: 'ATM — Branch 3 Main St',            asset_type: :other,   status: :active,         risk_score: 40,
incident_count: 1, serial: 'ATM-B03-CB', warranty_days: 300 },
  { name: 'ATM — Branch 9 Vestibule',          asset_type: :other,   status: :active,         risk_score: 35,
incident_count: 1, serial: 'ATM-B09-CB', warranty_days: 250 },
  { name: 'Vault Security System — Branch 3',  asset_type: :other,   status: :active,         risk_score: 65,
incident_count: 2, serial: 'VLT-B03-CB', warranty_days: 90  },

  # ── Teller & Branch Workstations ──────────────────────────────────────────
  { name: 'Teller Workstation — Branch 4 #1',  asset_type: :desktop, status: :active,         risk_score: 30,
incident_count: 1, serial: 'TWS-B4-1-CB', warranty_days: 200 },
  { name: 'Teller Workstation — Branch 4 #2',  asset_type: :desktop, status: :active,         risk_score: 25,
incident_count: 0, serial: 'TWS-B4-2-CB', warranty_days: 220 },
  { name: 'Teller Workstation — Branch 12 #1', asset_type: :desktop, status: :in_maintenance, risk_score: 68,
incident_count: 3, serial: 'TWS-B12-1-CB', warranty_days: 25 },
  { name: 'Branch Manager Desktop — Branch 19', asset_type: :desktop, status: :active,        risk_score: 20,
incident_count: 0, serial: 'BMD-B19-CB', warranty_days: 300 },

  # ── Employee Laptops ───────────────────────────────────────────────────────
  { name: 'MacBook Pro 16 M3 — IT Dev 01',     asset_type: :laptop,  status: :active,         risk_score: 12,
incident_count: 0, serial: 'MBP-D01-CB', warranty_days: 400 },
  { name: 'MacBook Pro 16 M3 — IT Dev 02',     asset_type: :laptop,  status: :active,         risk_score: 15,
incident_count: 0, serial: 'MBP-D02-CB', warranty_days: 380 },
  { name: 'ThinkPad X1 Carbon — Compliance 01', asset_type: :laptop, status: :active,          risk_score: 22,
incident_count: 1, serial: 'TPX-C01-CB', warranty_days: 250 },
  { name: 'Dell XPS 15 — Treasury 01',         asset_type: :laptop,  status: :active,         risk_score: 35,
incident_count: 1, serial: 'XPS-T01-CB', warranty_days: 180 },
  { name: 'HP EliteBook 840 — HR 01',          asset_type: :laptop,  status: :active,         risk_score: 28,
incident_count: 1, serial: 'HPE-H01-CB', warranty_days: 200 },
  { name: 'HP EliteBook 840 — Customer Service 01', asset_type: :laptop, status: :active,     risk_score: 18,
incident_count: 0, serial: 'HPE-CS1-CB', warranty_days: 320 },

  # ── Monitors ───────────────────────────────────────────────────────────────
  { name: 'Dell UltraWide 34 — IT Dev 01',     asset_type: :monitor, status: :active,         risk_score: 8,
incident_count: 0, serial: 'DUW-D01-CB', warranty_days: 500 },
  { name: 'LG 27 4K — Treasury 01',            asset_type: :monitor, status: :active,         risk_score: 10,
incident_count: 0, serial: 'LG27-T01-CB', warranty_days: 450 },

  # ── Mobile Devices ─────────────────────────────────────────────────────────
  { name: 'iPhone 14 Pro — Branch Manager',    asset_type: :phone,   status: :active,         risk_score: 5,
incident_count: 0, serial: 'IP14-BM-CB', warranty_days: 300 },
  { name: 'Samsung Galaxy S23 — Lost (Compliance Officer)', asset_type: :phone, status: :lost, risk_score: 95,
incident_count: 6, serial: 'SGS-L01-CB', warranty_days: 0   },

  # ── Software Licenses ──────────────────────────────────────────────────────
  { name: 'Core Banking Software License',     asset_type: :software, status: :active,        risk_score: 40,
incident_count: 1, serial: 'CBS-LIC-CB', warranty_days: 365 },
  { name: 'AML Screening Software License',    asset_type: :software, status: :active,        risk_score: 25,
incident_count: 0, serial: 'AML-LIC-CB', warranty_days: 300 },
  { name: 'Microsoft 365 Enterprise License',  asset_type: :software, status: :active,        risk_score: 15,
incident_count: 0, serial: 'M365-LIC-CB', warranty_days: 250 },

  # ── Network & Physical Security ───────────────────────────────────────────
  { name: 'Network Switch — HQ Data Center',   asset_type: :other,   status: :active,         risk_score: 55,
incident_count: 2, serial: 'NSW-HQ-CB',  warranty_days: 120 },
  { name: 'Security Camera System — HQ Parking', asset_type: :other, status: :in_maintenance, risk_score: 62,
incident_count: 2, serial: 'CAM-HQ-CB',  warranty_days: 45  }
].freeze

asset_counter = 0

Workspace.find_each do |ws|
  depts  = Department.where(workspace: ws).index_by(&:name)
  users  = User.where(workspace: ws)
  it_mgr = users.find(&:role_it_manager?) || users.find(&:role_workspace_admin?)

  ASSETS.each do |data|
    asset_counter += 1
    dept = depts.values.find { |d| d.name.include?('IT') || d.name.include?('Engineering') } || depts.values.first

    Asset.create!(
      workspace:          ws,
      asset_number:       "AST-#{ws.slug.upcase[0..2]}-#{asset_counter.to_s.rjust(4, '0')}",
      name:               data[:name],
      asset_type:         data[:asset_type],
      status:             data[:status],
      risk_score:         data[:risk_score],
      incident_count:     data[:incident_count],
      serial_number:      data[:serial],
      warranty_expires_at: data[:warranty_days].zero? ? nil : Time.current + data[:warranty_days].days,
      assigned_to:        it_mgr,
      department:         dept,
      ai_metadata: {
        'risk_factors'     => %w[incident_history warranty_status],
        'last_assessed_at' => rand(1..14).days.ago.iso8601,
        'recommendation'   => data[:risk_score] > 80 ? 'Schedule immediate maintenance' : 'Monitor regularly'
      }
    )
  end

  Rails.logger.debug { "  Assets created for #{ws.name}: #{Asset.where(workspace: ws).count}" }
end

Rails.logger.debug { "  Assets total: #{Asset.count}" }