# frozen_string_literal: true

module Ai
  module Tools
    class Registry
      TOOLS = [
        Ai::Tools::TicketsOverview,
        Ai::Tools::LeaveRequestsOverview,
        Ai::Tools::AssetsOverview
      ].freeze

      def self.available_for(user)
        TOOLS.select { |tool_class| tool_class.visible_to?(user) }
      end

      def self.schema_for(user, provider:)
        available_for(user).map { |tool_class| tool_class.to_provider_schema(provider) }
      end

      def self.find(tool_name)
        TOOLS.find { |tool_class| tool_class.tool_name == tool_name.to_s }
      end
    end
  end
end
