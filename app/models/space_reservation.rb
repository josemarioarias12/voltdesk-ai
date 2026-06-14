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

  private

  def end_after_start
    return unless start_at && end_at

    errors.add(:end_at, 'must be after start time') if end_at <= start_at
  end

  def capacity_not_exceeded
    return unless space && attendees_count

    return unless attendees_count > space.capacity

    errors.add(:attendees_count, "exceeds space capacity of #{space.capacity}")
  end
end
