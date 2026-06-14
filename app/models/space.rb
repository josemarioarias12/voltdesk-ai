# frozen_string_literal: true

class Space < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  has_many :space_reservations, dependent: :destroy

  enum :status, { available: 0, maintenance: 1, inactive: 2 }, prefix: true
  enum :space_type, {
    meeting_room: 0,
    conference_room: 1,
    open_desk: 2,
    phone_booth: 3,
    event_hall: 4,
    lounge: 5
  }, prefix: true

  validates :name, presence: true
  validates :floor, presence: true
  validates :capacity, presence: true, numericality: { greater_than: 0 }
  validates :status, presence: true
  validates :space_type, presence: true

  scope :active, -> { where(status: statuses[:available]) }
  scope :for_floor, ->(floor) { where(floor: floor) }
  scope :with_capacity, ->(min) { where(capacity: min..) }
end
