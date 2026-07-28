# frozen_string_literal: true

module Ai
  module Tools
    class Base
      def self.tool_name
        raise NotImplementedError, "#{name} must define .tool_name"
      end

      def self.description
        raise NotImplementedError, "#{name} must define .description"
      end

      def self.parameters_schema
        { type: 'object', properties: {}, required: [] }
      end

      def self.visible_to?(_user)
        raise NotImplementedError, "#{name} must define .visible_to?"
      end

      def self.to_provider_schema(provider)
        if provider.to_s == 'anthropic'
          { name: tool_name, description: description, input_schema: parameters_schema }
        else
          { type: 'function', function: { name: tool_name, description: description, parameters: parameters_schema } }
        end
      end

      def initialize(user:, workspace:, locale: nil)
        @user = user
        @workspace = workspace
        @locale = locale
      end

      def call(**_params)
        raise NotImplementedError, "#{self.class.name} must implement #call"
      end
    end
  end
end
