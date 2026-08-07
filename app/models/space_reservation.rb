# frozen_string_literal: true

class SpaceReservation < ApplicationRecord
  include WorkspaceScoped

  belongs_to :workspace
  belongs_to :space
  belongs_to :user

  enum :status, { confirmed: 0, cancelled: 1, completed: 2 }, prefix: true

  validates :title, presence: true
  validates :start_at, presence: true
  validates :end_at, presence: true
  validates :attendees_count, presence: true, numericality: { greater_than: 0 }
  validate :end_after_start
  validate :capacity_not_exceeded

  scope :active, -> { where.not(status: statuses[:cancelled]) }
  scope :upcoming, -> { where('start_at > ?', Time.current) }
  scope :for_space, ->(space_id) { where(space_id: space_id) }
  scope :overlapping, lambda { |start_time, end_time|
    where(
      'start_at < ? AND end_at > ?',
      end_time,
      start_time
    )
  }

  def self.capacity_conflict_for(space:, start_at:, end_at:, attendees_count:, exclude_id: nil)
    scope = space.space_reservations.active.overlapping(start_at, end_at)
    scope = scope.where.not(id: exclude_id) if exclude_id
    reserved = scope.sum(:attendees_count)
    return nil if reserved + attendees_count <= space.capacity

    { reserved: reserved, capacity: space.capacity, remaining: [space.capacity - reserved, 0].max }
  end

  private

  def end_after_start
    return unless start_at && end_at

    errors.add(:end_at, 'must be after start time') if end_at <= start_at
  end

  def capacity_not_exceeded
    return unless space && attendees_count && start_at && end_at

    conflict = self.class.capacity_conflict_for(
      space: space, start_at: start_at, end_at: end_at, attendees_count: attendees_count, exclude_id: id
    )
    return unless conflict

    errors.add(:attendees_count,
               "would exceed capacity — only #{conflict[:remaining]} seat(s) available " \
               "(#{conflict[:reserved]}/#{conflict[:capacity]} already booked for that time)")
  end
end
