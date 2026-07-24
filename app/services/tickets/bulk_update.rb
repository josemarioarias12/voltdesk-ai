# frozen_string_literal: true

module Tickets
  class BulkUpdate
    PERMITTED_ACTIONS = %w[assign resolve priority].freeze

    def self.call(workspace:, user:, ticket_ids:, action:, value: nil)
      new(workspace: workspace, user: user, ticket_ids: ticket_ids, action: action, value: value).call
    end

    def initialize(workspace:, user:, ticket_ids:, action:, value: nil)
      @workspace  = workspace
      @user       = user
      @ticket_ids = Array(ticket_ids)
      @action     = action.to_s
      @value      = value
    end

    def call
      return ServiceResult.failure("Unknown action: #{@action}") unless PERMITTED_ACTIONS.include?(@action)
      return ServiceResult.failure('No tickets selected') if @ticket_ids.empty?
      return ServiceResult.failure('Missing value for this action') if @action.in?(%w[assign priority]) && @value.blank?

      updated_count = 0
      skipped_count = 0

      tickets.find_each do |ticket|
        if authorized?(ticket) && apply_update(ticket).success?
          updated_count += 1
        else
          skipped_count += 1
        end
      end

      ServiceResult.success({ updated_count: updated_count, skipped_count: skipped_count })
    end

    private

    def tickets
      @workspace.tickets.where(id: @ticket_ids)
    end

    def authorized?(ticket)
      policy = TicketPolicy.new(@user, ticket)

      case @action
      when 'resolve'  then policy.resolve_ticket?
      when 'assign'   then policy.assign?
      when 'priority' then policy.change_priority?
      else policy.update?
      end
    end

    def apply_update(ticket)
      Tickets::UpdateTicket.call(ticket: ticket, user: @user, params: update_params)
    end

    def update_params
      case @action
      when 'resolve'  then { status: :resolved }
      when 'assign'   then { assigned_to_id: @value }
      when 'priority' then { priority: @value }
      end
    end
  end
end
