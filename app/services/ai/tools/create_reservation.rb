# frozen_string_literal: true

module Ai
  module Tools
    class CreateReservation < Base
      def self.tool_name = 'create_reservation'

      def self.description
        'Creates a new space reservation for the current user, following a two-step confirm-before-execute flow. ' \
          'You must NEVER compose or describe a reservation summary yourself from memory — the preview text the ' \
          'user sees must always come from an actual call to this tool. Step 1: call this tool with confirmed ' \
          'omitted or false as soon as you have a space name, start time and end time; this validates the ' \
          'request WITHOUT saving it and returns a real preview summary, including space capacity and any ' \
          'scheduling conflict. Present THAT returned summary to the user, not your own version. Step 2: only ' \
          'after the user explicitly confirms, call this tool again with confirmed: true and the exact same ' \
          'space_name, start_at and end_at used in the preview.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {
            space_name: {
              type: 'string',
              description: 'The name of the space, as the user referred to it (e.g. "Executive Lounge", ' \
                           '"the boardroom"). Never pass a numeric id or a list position here — always the name.'
            },
            title: {
              type: 'string',
              description: 'Short title for the reservation, e.g. the meeting name.'
            },
            start_at: {
              type: 'string',
              description: 'Start date and time in ISO 8601 format, including the timezone offset ' \
                           '(e.g. 2026-08-06T21:00:00-06:00). Times without an offset are treated ' \
                           "as the workspace's local time."
            },
            end_at: {
              type: 'string',
              description: 'End date and time in ISO 8601 format, including the timezone offset ' \
                           '(e.g. 2026-08-06T22:00:00-06:00). Times without an offset are treated ' \
                           "as the workspace's local time."
            },
            attendees_count: {
              type: 'integer',
              description: 'Number of attendees. Defaults to 1 if not specified.'
            },
            confirmed: {
              type: 'boolean',
              description: 'Set to true only on the second call, after explicit user confirmation. ' \
                           'Defaults to false.'
            }
          },
          required: %w[space_name title start_at end_at]
        }
      end

      def self.visible_to?(user)
        SpaceReservationPolicy.new(user, SpaceReservation.new(workspace: user.workspace)).create?
      end

      def call(space_name:, title:, start_at:, end_at:, attendees_count: 1, confirmed: false)
        parsed_start = parse_time(start_at)
        parsed_end = parse_time(end_at)
        return ServiceResult.failure('Invalid start or end time format') unless parsed_start && parsed_end

        space = resolve_space(space_name)
        return space if space.is_a?(ServiceResult)

        reservation_params = {
          space_id: space.id, title: title, start_at: parsed_start, end_at: parsed_end,
          attendees_count: attendees_count
        }

        return execute(reservation_params) if confirmed

        preview(space, reservation_params)
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end

      private

      def resolve_space(space_name)
        scope = @workspace.spaces
        exact = scope.where('LOWER(name) = ?', space_name.to_s.downcase).first
        return exact if exact

        matches = scope.where('LOWER(name) LIKE ?', "%#{space_name.to_s.downcase}%").to_a
        return matches.first if matches.size == 1

        ServiceResult.failure(no_match_message(space_name, matches))
      end

      def no_match_message(space_name, matches)
        available = @workspace.spaces.order(:name).pluck(:name).join(', ')
        if matches.empty?
          "No space matches \"#{space_name}\". Available spaces: #{available}. Ask the user to pick one."
        else
          ambiguous = matches.map(&:name).join(', ')
          "\"#{space_name}\" matches multiple spaces: #{ambiguous}. Ask the user which one they mean."
        end
      end

      def parse_time(value)
        return value if value.is_a?(Time) || value.is_a?(ActiveSupport::TimeWithZone)

        Time.zone.parse(value.to_s)
      rescue ArgumentError
        nil
      end

      def preview(space, reservation_params)
        reservation = space.space_reservations.new(reservation_params.merge(user: @user, workspace: @workspace))
        return ServiceResult.failure(reservation.errors.full_messages.join(', ')) unless reservation.valid?

        ServiceResult.success(
          preview: true,
          summary: {
            space_name: space.name,
            floor: space.floor,
            capacity: space.capacity,
            title: reservation.title,
            start_at: reservation.start_at,
            end_at: reservation.end_at,
            attendees_count: reservation.attendees_count
          },
          params: reservation_params
        )
      end

      def execute(reservation_params)
        result = Facilities::CreateReservation.new(
          workspace: @workspace, user: @user, params: reservation_params
        ).call
        return result if result.failure?

        ServiceResult.success(
          message: "Reservation for #{result.data.space.name} confirmed successfully.",
          reservation: result.data,
          resource_link: {
            title: "#{result.data.space.name} reservation",
            path: "/facilities/spaces/#{result.data.space_id}",
            icon: 'calendar'
          }
        )
      end
    end
  end
end
