# frozen_string_literal: true

Rails.logger.debug '  Creating spaces and reservations...'

SPACES = [
  { name: 'Main Boardroom',            floor: '5', capacity: 20, space_type: :conference_room,
    equipment: { 'projector' => true, 'video_conferencing' => true, 'whiteboard' => true } },
  { name: 'Client Meeting Room A',     floor: '3', capacity: 8,  space_type: :meeting_room,
    equipment: { 'tv_screen' => true, 'video_conferencing' => true } },
  { name: 'Client Meeting Room B',     floor: '3', capacity: 8,  space_type: :meeting_room,
    equipment: { 'tv_screen' => true } },
  { name: 'Compliance War Room',       floor: '4', capacity: 10, space_type: :meeting_room,
    equipment: { 'whiteboard' => true, 'secure_document_storage' => true } },
  { name: 'Branch Training Room',      floor: '2', capacity: 25, space_type: :conference_room,
    equipment: { 'projector' => true, 'computers' => true } },
  { name: 'Phone Booth 1',             floor: '1', capacity: 1,  space_type: :phone_booth,
    equipment: { 'soundproofing' => true } },
  { name: 'Phone Booth 2',             floor: '1', capacity: 1,  space_type: :phone_booth,
    equipment: { 'soundproofing' => true } },
  { name: 'Teller Break Room',         floor: '1', capacity: 15, space_type: :lounge,
    equipment: { 'kitchen' => true, 'lockers' => true } },
  { name: 'Open Desk Area — Ops',      floor: '2', capacity: 40, space_type: :open_desk,
    equipment: { 'standing_desks' => true, 'monitors' => true } },
  { name: 'Executive Lounge',          floor: '5', capacity: 12, space_type: :lounge,
    equipment: { 'tv_screen' => true, 'coffee_machine' => true } }
].freeze

Workspace.find_each do |ws|
  users = User.where(workspace: ws)

  spaces = SPACES.map do |data|
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

  # Reservations — next 2 weeks
  bookers = users.select { |u| u.role_agent? || u.role_department_manager? || u.role_workspace_admin? }
  booker  = bookers.first || users.first

  reservations = [
    { space: spaces[0], title: 'Weekly Executive All-Hands',   offset_days: 1,  start_hour: 10, duration: 2,
attendees: 15 },
    { space: spaces[3], title: 'AML Program Review',           offset_days: 1,  start_hour: 11, duration: 1,
attendees: 8  },
    { space: spaces[1], title: '1:1 Branch Manager Sync',      offset_days: 2,  start_hour: 14, duration: 1,
attendees: 2  },
    { space: spaces[0], title: 'Quarterly Board Meeting',      offset_days: 3,  start_hour: 9,  duration: 4,
attendees: 20 },
    { space: spaces[2], title: 'Loan Committee Review',        offset_days: 4,  start_hour: 15, duration: 2,
attendees: 6  },
    { space: spaces[0], title: 'SOX Audit Kickoff',            offset_days: 7,  start_hour: 9,  duration: 3,
attendees: 12 },
    { space: spaces[4], title: 'New Teller Onboarding Training', offset_days: 5, start_hour: 13, duration: 3,
attendees: 18 },
    { space: spaces[1], title: 'Corporate Client Presentation', offset_days: 8, start_hour: 14, duration: 2,
attendees: 7  }
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