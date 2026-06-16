# frozen_string_literal: true

Rails.logger.debug '  Creating spaces and reservations...'

SPACES_BY_WORKSPACE = {
  'techcorp' => [
    { name: 'Main Conference Room A', floor: '2', capacity: 20, space_type: :conference_room,
      equipment: { 'projector' => true, 'whiteboard' => true, 'video_conferencing' => true } },
    { name: 'Conference Room B',      floor: '2', capacity: 10, space_type: :conference_room,
      equipment: { 'projector' => true, 'whiteboard' => true } },
    { name: 'War Room',               floor: '3', capacity: 8,  space_type: :meeting_room,
      equipment: { 'whiteboard' => true, 'tv_screen' => true } },
    { name: 'Phone Booth 1',          floor: '1', capacity: 1,  space_type: :phone_booth,
      equipment: { 'soundproofing' => true } },
    { name: 'Phone Booth 2',          floor: '1', capacity: 1,  space_type: :phone_booth,
      equipment: { 'soundproofing' => true } },
    { name: 'Open Desk Area — Floor 1', floor: '1', capacity: 40, space_type: :open_desk,
      equipment: { 'standing_desks' => true, 'monitors' => true } },
    { name: 'Event Hall',             floor: '1', capacity: 150, space_type: :event_hall,
      equipment: { 'stage' => true, 'projector' => true, 'microphone' => true } },
    { name: 'Executive Lounge',       floor: '4', capacity: 12,  space_type: :lounge,
      equipment: { 'tv_screen' => true, 'coffee_machine' => true } }
  ],
  'healthco' => [
    { name: 'Consultation Room 101',  floor: '1', capacity: 3,  space_type: :meeting_room,
      equipment: { 'examination_table' => true, 'medical_monitor' => true } },
    { name: 'Consultation Room 102',  floor: '1', capacity: 3,  space_type: :meeting_room,
      equipment: { 'examination_table' => true, 'medical_monitor' => true } },
    { name: 'Consultation Room 201',  floor: '2', capacity: 3,  space_type: :meeting_room,
      equipment: { 'examination_table' => true } },
    { name: 'Surgery Suite A',        floor: '2', capacity: 8,  space_type: :conference_room,
      equipment: { 'surgical_lights' => true, 'anesthesia_machine' => true } },
    { name: 'Waiting Room — Floor 1', floor: '1', capacity: 30, space_type: :lounge,
      equipment: { 'tv' => true, 'seating' => true } },
    { name: 'Staff Lounge',           floor: '3', capacity: 20, space_type: :lounge,
      equipment: { 'kitchen' => true, 'lockers' => true } },
    { name: 'Training Room',          floor: '3', capacity: 25, space_type: :conference_room,
      equipment: { 'projector' => true, 'whiteboard' => true } },
    { name: 'ICU Observation',        floor: '2', capacity: 5,  space_type: :meeting_room,
      equipment: { 'monitoring_systems' => true } }
  ],
  'retailplus' => [
    { name: 'HQ Conference Room',     floor: '1', capacity: 15, space_type: :conference_room,
      equipment: { 'projector' => true, 'whiteboard' => true } },
    { name: 'Training Room A',        floor: '2', capacity: 30, space_type: :conference_room,
      equipment: { 'projector' => true, 'computers' => true } },
    { name: 'Manager Meeting Room',   floor: '1', capacity: 8,  space_type: :meeting_room,
      equipment: { 'tv_screen' => true } },
    { name: 'Break Room — HQ',        floor: '1', capacity: 20, space_type: :lounge,
      equipment: { 'kitchen' => true, 'seating' => true } },
    { name: 'Open Office — HQ',       floor: '2', capacity: 50, space_type: :open_desk,
      equipment: { 'standing_desks' => true } }
  ],
  'startupai' => [
    { name: 'Main Meeting Room',      floor: '1', capacity: 12, space_type: :conference_room,
      equipment: { 'tv_screen' => true, 'whiteboard' => true, 'video_conferencing' => true } },
    { name: 'Phone Booth A',          floor: '1', capacity: 1,  space_type: :phone_booth,
      equipment: { 'soundproofing' => true } },
    { name: 'Open Office',            floor: '1', capacity: 40, space_type: :open_desk,
      equipment: { 'standing_desks' => true, 'monitors' => true } },
    { name: 'Chill Lounge',           floor: '1', capacity: 10, space_type: :lounge,
      equipment: { 'beanbags' => true, 'tv' => true } }
  ],
  'consultingpro' => [
    { name: 'Client Boardroom',       floor: '3', capacity: 20, space_type: :conference_room,
      equipment: { 'projector' => true, 'video_conferencing' => true, 'whiteboard' => true } },
    { name: 'Strategy Room A',        floor: '2', capacity: 8,  space_type: :meeting_room,
      equipment: { 'whiteboard' => true, 'tv_screen' => true } },
    { name: 'Strategy Room B',        floor: '2', capacity: 8,  space_type: :meeting_room,
      equipment: { 'whiteboard' => true, 'tv_screen' => true } },
    { name: 'Partner Lounge',         floor: '3', capacity: 10, space_type: :lounge,
      equipment: { 'coffee_machine' => true, 'tv_screen' => true } },
    { name: 'Open Desk — Consultants', floor: '1', capacity: 35, space_type: :open_desk,
      equipment: { 'monitors' => true, 'docking_stations' => true } },
    { name: 'Training Room', floor: '1', capacity: 25, space_type: :conference_room,
      equipment: { 'projector' => true, 'computers' => true } }
  ]
}.freeze

Workspace.find_each do |ws|
  next if ws.slug == 'demo'

  users = User.where(workspace: ws)
  spaces_data = SPACES_BY_WORKSPACE[ws.slug] || SPACES_BY_WORKSPACE['techcorp']

  spaces = spaces_data.map do |data|
    Space.create!(
      workspace:  ws,
      name:       data[:name],
      floor:      data[:floor],
      capacity:   data[:capacity],
      space_type: data[:space_type],
      equipment:  data[:equipment],
      status:     :available
    )
  end

  Rails.logger.debug { "  Spaces created for #{ws.name}: #{spaces.size}" }

  # Reservations — next 2 weeks, some conflicts for demo
  bookers = users.select { |u| u.role_agent? || u.role_department_manager? || u.role_workspace_admin? }
  booker  = bookers.first || users.first

  reservations = [
    { space: spaces[0], title: 'Weekly All-Hands',        offset_days: 1,  start_hour: 10, duration: 2,
attendees: 15 },
    { space: spaces[0], title: 'Product Strategy Review', offset_days: 1,  start_hour: 11, duration: 1,
attendees: 8  },
    { space: spaces[1] || spaces[0], title: '1:1 Manager Meeting', offset_days: 2, start_hour: 14, duration: 1,
attendees: 2 },
    { space: spaces[0], title: 'Quarterly Planning', offset_days: 3, start_hour: 9, duration: 4,
attendees: 20 },
    { space: spaces[1] || spaces[0], title: 'Tech Interview', offset_days: 4, start_hour: 15, duration: 2,
attendees: 3 },
    { space: spaces[0], title: 'Board Meeting', offset_days: 7, start_hour: 9, duration: 3,
attendees: 12 },
    { space: spaces[1] || spaces[0], title: 'Design Review', offset_days: 5, start_hour: 13, duration: 2,
attendees: 6 },
    { space: spaces[0], title: 'Client Presentation', offset_days: 8, start_hour: 14, duration: 2, attendees: 10 }
  ]

  reservations.each do |res|
    start_at = Date.current + res[:offset_days].days
    start_at = start_at.to_time + res[:start_hour].hours
    end_at   = start_at + res[:duration].hours

    SpaceReservation.create!(
      workspace:      ws,
      space:          res[:space],
      user:           booker,
      title:          res[:title],
      start_at:       start_at,
      end_at:         end_at,
      attendees_count: [res[:attendees], res[:space].capacity].min,
      status:         :confirmed
    )
  end

  Rails.logger.debug { "  Reservations for #{ws.name}: #{SpaceReservation.where(workspace: ws).count}" }
end

Rails.logger.debug { "  Spaces total: #{Space.count}" }
Rails.logger.debug { "  Reservations total: #{SpaceReservation.count}" }
