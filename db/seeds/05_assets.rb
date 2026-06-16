# frozen_string_literal: true

Rails.logger.debug '  Creating assets...'

ASSETS_BY_WORKSPACE = {
  'techcorp' => [
    { name: 'Production Server PSV-001',    asset_type: :server,  status: :active,         risk_score: 92,
incident_count: 5, serial: 'PSV-001-TC', warranty_days: 15  },
    { name: 'Production Server PSV-002',    asset_type: :server,  status: :active,         risk_score: 78,
incident_count: 3, serial: 'PSV-002-TC', warranty_days: 45  },
    { name: 'Backup Server BSV-001',        asset_type: :server,  status: :in_maintenance, risk_score: 65,
incident_count: 2, serial: 'BSV-001-TC', warranty_days: 90  },
    { name: 'MacBook Pro 16 M3 — Dev 01',   asset_type: :laptop,  status: :active,         risk_score: 12,
incident_count: 0, serial: 'MBP-D01-TC', warranty_days: 400 },
    { name: 'MacBook Pro 16 M3 — Dev 02',   asset_type: :laptop,  status: :active,         risk_score: 15,
incident_count: 0, serial: 'MBP-D02-TC', warranty_days: 380 },
    { name: 'MacBook Pro 16 M3 — Dev 03',   asset_type: :laptop,  status: :active,         risk_score: 18,
incident_count: 1, serial: 'MBP-D03-TC', warranty_days: 350 },
    { name: 'ThinkPad X1 Carbon — Ops 01',  asset_type: :laptop,  status: :active,         risk_score: 55,
incident_count: 2, serial: 'TPX-O01-TC', warranty_days: 60  },
    { name: 'ThinkPad X1 Carbon — Ops 02',  asset_type: :laptop,  status: :in_maintenance, risk_score: 72,
incident_count: 4, serial: 'TPX-O02-TC', warranty_days: 20  },
    { name: 'Dell XPS 15 — Finance 01',     asset_type: :laptop,  status: :active,         risk_score: 35,
incident_count: 1, serial: 'XPS-F01-TC', warranty_days: 180 },
    { name: 'HP EliteBook 840 — HR 01',     asset_type: :laptop,  status: :active,         risk_score: 28,
incident_count: 1, serial: 'HPE-H01-TC', warranty_days: 200 },
    { name: 'LG UltraWide 34 — Dev 01',     asset_type: :monitor, status: :active,         risk_score: 8,
incident_count: 0, serial: 'LGU-D01-TC', warranty_days: 500 },
    { name: 'Dell 27 4K — Dev 02',          asset_type: :monitor, status: :active,         risk_score: 10,
incident_count: 0, serial: 'D27-D02-TC', warranty_days: 450 },
    { name: 'iPhone 14 Pro — CTO',          asset_type: :phone,   status: :active,         risk_score: 5,
incident_count: 0, serial: 'IP14-CTO-TC', warranty_days: 300 },
    { name: 'Samsung Galaxy S23 — Lost',    asset_type: :phone,   status: :lost,           risk_score: 95,
incident_count: 6, serial: 'SGS-L01-TC', warranty_days: 0   },
    { name: 'Adobe CC License — 25 seats',  asset_type: :software, status: :active,        risk_score: 45,
incident_count: 1, serial: 'ADO-CC-TC',  warranty_days: 60  }
  ],
  'healthco' => [
    { name: 'MRI Machine — Radiology',      asset_type: :other,   status: :in_maintenance, risk_score: 88,
incident_count: 4, serial: 'MRI-R01-HC', warranty_days: 30  },
    { name: 'CT Scanner — Radiology',       asset_type: :other,   status: :active,         risk_score: 65,
incident_count: 2, serial: 'CTS-R01-HC', warranty_days: 120 },
    { name: 'EHR Server — Primary',         asset_type: :server,  status: :active,         risk_score: 82,
incident_count: 3, serial: 'EHR-P01-HC', warranty_days: 45  },
    { name: 'EHR Server — Backup',          asset_type: :server,  status: :active,         risk_score: 55,
incident_count: 1, serial: 'EHR-B01-HC', warranty_days: 90  },
    { name: 'Nurse Station PC — Floor 1',   asset_type: :desktop, status: :active,         risk_score: 40,
incident_count: 2, serial: 'NPC-F1-HC',  warranty_days: 200 },
    { name: 'Nurse Station PC — Floor 2',   asset_type: :desktop, status: :active,         risk_score: 35,
incident_count: 1, serial: 'NPC-F2-HC',  warranty_days: 220 },
    { name: 'Nurse Station PC — Floor 3',   asset_type: :desktop, status: :in_maintenance, risk_score: 70,
incident_count: 3, serial: 'NPC-F3-HC',  warranty_days: 15  },
    { name: 'Medication Dispenser — Pharm', asset_type: :other,   status: :active,         risk_score: 75,
incident_count: 3, serial: 'MDS-P01-HC', warranty_days: 60  },
    { name: 'Dell Laptop — Admin 01',       asset_type: :laptop,  status: :active,         risk_score: 22,
incident_count: 0, serial: 'DLA-A01-HC', warranty_days: 300 },
    { name: 'iPad — Doctor Rounds',         asset_type: :phone,   status: :active,         risk_score: 18,
incident_count: 1, serial: 'IPD-DR-HC',  warranty_days: 250 }
  ],
  'retailplus' => [
    { name: 'POS Terminal — Store 12 A',    asset_type: :desktop, status: :in_maintenance, risk_score: 90,
incident_count: 5, serial: 'POS-12A-RP', warranty_days: 10  },
    { name: 'POS Terminal — Store 12 B',    asset_type: :desktop, status: :in_maintenance, risk_score: 88,
incident_count: 4, serial: 'POS-12B-RP', warranty_days: 10  },
    { name: 'POS Terminal — Store 7 A',     asset_type: :desktop, status: :in_maintenance, risk_score: 85,
incident_count: 4, serial: 'POS-07A-RP', warranty_days: 20  },
    { name: 'POS Terminal — Store 3 A',     asset_type: :desktop, status: :active,         risk_score: 60,
incident_count: 2, serial: 'POS-03A-RP', warranty_days: 60  },
    { name: 'Inventory Scanner — Wh 01',    asset_type: :other,   status: :active,         risk_score: 45,
incident_count: 2, serial: 'INV-W01-RP', warranty_days: 180 },
    { name: 'Refrigeration Unit — St 4',    asset_type: :other,   status: :active,         risk_score: 78,
incident_count: 3, serial: 'REF-S04-RP', warranty_days: 90  },
    { name: 'Security Camera System',       asset_type: :other,   status: :in_maintenance, risk_score: 65,
incident_count: 2, serial: 'CAM-P01-RP', warranty_days: 45  },
    { name: 'Store Manager Laptop — 01',    asset_type: :laptop,  status: :active,         risk_score: 25,
incident_count: 1, serial: 'SML-01-RP',  warranty_days: 300 },
    { name: 'Store Manager Laptop — 02',    asset_type: :laptop,  status: :active,         risk_score: 20,
incident_count: 0, serial: 'SML-02-RP',  warranty_days: 320 },
    { name: 'Network Switch — HQ',          asset_type: :other,   status: :active,         risk_score: 55,
incident_count: 2, serial: 'NSW-HQ-RP',  warranty_days: 120 }
  ],
  'startupai' => [
    { name: 'MacBook Pro M3 — Eng 01',      asset_type: :laptop,  status: :active,         risk_score: 10,
incident_count: 0, serial: 'MBP-E01-SA', warranty_days: 500 },
    { name: 'MacBook Pro M3 — Eng 02',      asset_type: :laptop,  status: :active,         risk_score: 12,
incident_count: 0, serial: 'MBP-E02-SA', warranty_days: 480 },
    { name: 'MacBook Pro M3 — Eng 03',      asset_type: :laptop,  status: :active,         risk_score: 8,
incident_count: 0, serial: 'MBP-E03-SA', warranty_days: 460 },
    { name: 'AWS Production Account',       asset_type: :software, status: :active,        risk_score: 70,
incident_count: 2, serial: 'AWS-P01-SA', warranty_days: 365 },
    { name: 'GitHub Enterprise License',    asset_type: :software, status: :active,        risk_score: 15,
incident_count: 0, serial: 'GHE-01-SA',  warranty_days: 200 },
    { name: 'Office WiFi Router',           asset_type: :other,   status: :in_maintenance, risk_score: 72,
incident_count: 4, serial: 'WFR-01-SA',  warranty_days: 30  },
    { name: 'Standing Desk Monitor — 01',   asset_type: :monitor, status: :active,         risk_score: 5,
incident_count: 0, serial: 'MON-01-SA',  warranty_days: 600 }
  ],
  'consultingpro' => [
    { name: 'Dell PowerEdge — Primary',     asset_type: :server,  status: :active,         risk_score: 75,
incident_count: 3, serial: 'DPE-P01-CP', warranty_days: 45  },
    { name: 'Dell PowerEdge — Backup',      asset_type: :server,  status: :active,         risk_score: 55,
incident_count: 1, serial: 'DPE-B01-CP', warranty_days: 90  },
    { name: 'ThinkPad X1 — Partner 01',    asset_type: :laptop,  status: :active,         risk_score: 20,
incident_count: 0, serial: 'TPX-P01-CP', warranty_days: 400 },
    { name: 'ThinkPad X1 — Partner 02',    asset_type: :laptop,  status: :active,         risk_score: 22,
incident_count: 1, serial: 'TPX-P02-CP', warranty_days: 380 },
    { name: 'ThinkPad X1 — Consultant 01', asset_type: :laptop,  status: :active,         risk_score: 18,
incident_count: 0, serial: 'TPX-C01-CP', warranty_days: 360 },
    { name: 'Cisco VPN Appliance',         asset_type: :other,   status: :active,         risk_score: 60,
incident_count: 2, serial: 'CVA-01-CP',  warranty_days: 120 },
    { name: 'Document Scanner — Legal',    asset_type: :other,   status: :active,         risk_score: 30,
incident_count: 1, serial: 'DSC-L01-CP', warranty_days: 200 },
    { name: 'SharePoint Online License',   asset_type: :software, status: :active,        risk_score: 25,
incident_count: 0, serial: 'SPO-01-CP',  warranty_days: 180 }
  ]
}.freeze

asset_counter = 0

Workspace.find_each do |ws|
  next if ws.slug == 'demo'

  depts  = Department.where(workspace: ws).index_by(&:name)
  users  = User.where(workspace: ws)
  it_mgr = users.find(&:role_it_manager?) || users.find(&:role_workspace_admin?)

  assets = ASSETS_BY_WORKSPACE[ws.slug] || ASSETS_BY_WORKSPACE['techcorp']

  assets.each do |data|
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
