# frozen_string_literal: true

module Ai
  module Tools
    class SpacesOverview < Base
      def self.tool_name = 'spaces_overview'

      def self.description
        'Returns the list of bookable spaces in the workspace: id, name, floor, capacity, ' \
          'status and space type. ALWAYS call this before asking the user for a space id — ' \
          'use it to resolve a space name the user mentions (e.g. "the boardroom", ' \
          '"Phone Booth 1") to its id, or to offer the user real options by name when they ' \
          'ask to reserve "a room" or "a space" without naming one. Never invent space ids.'
      end

      def self.parameters_schema
        {
          type: 'object',
          properties: {},
          required: []
        }
      end

      def self.visible_to?(user)
        SpaceReservationPolicy.new(user, SpaceReservation.new(workspace: user.workspace)).create?
      end

      def call(**_params)
        spaces = @workspace.spaces.order(:floor, :id).map do |space|
          {
            id: space.id,
            name: space.name,
            floor: space.floor,
            capacity: space.capacity,
            status: space.status,
            space_type: space.space_type
          }
        end

        ServiceResult.success(
          total: spaces.size,
          spaces: spaces,
          usage_note: 'This list has no inherent order or numbering — it is data, not a menu. ' \
                      'If you show it to the user as a numbered list for readability, that ' \
                      'numbering exists only in your reply text and must NEVER be treated as ' \
                      'data. If the user replies with a number, that number refers to YOUR list ' \
                      'position, not any field in this data — look up which space was at that ' \
                      'position in the list YOU wrote, then use that space\'s "id" field, and ' \
                      'nothing else, as space_id. Never pass the position number itself as ' \
                      'space_id.'
        )
      rescue StandardError => e
        ServiceResult.failure(e.message)
      end
    end
  end
end
