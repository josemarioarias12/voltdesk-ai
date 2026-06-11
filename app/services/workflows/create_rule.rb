# frozen_string_literal: true

module Workflows
  class CreateRule
    def self.call(workspace:, params:)
      new(workspace:, params:).call
    end

    def initialize(workspace:, params:)
      @workspace = workspace
      @params    = params
    end

    def call
      rule = WorkflowRule.new(
        workspace:     @workspace,
        name:          @params[:name],
        trigger_event: @params[:trigger_event],
        conditions:    @params[:conditions] || [],
        actions:       @params[:actions]    || [],
        active:        @params.fetch(:active, true)
      )

      if rule.save
        ServiceResult.success(rule)
      else
        ServiceResult.failure(rule.errors.full_messages.join(', '))
      end
    end
  end
end
