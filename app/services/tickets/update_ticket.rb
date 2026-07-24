# frozen_string_literal: true

module Tickets
  class UpdateTicket
    def self.call(**args) = new(**args).call

    def initialize(ticket:, user:, params:)
      @ticket = ticket
      @user   = user
      @params = params
    end

    def call
      return validate_status_transition if changing_status?

      snapshot = capture_snapshot
      ActiveRecord::Base.transaction do
        return ServiceResult.failure(@ticket.errors.full_messages.join(', ')) unless @ticket.update(permitted_params)

        record_changes(snapshot)
      end

      record_classification_correction_if_needed(snapshot)
      broadcast_update
      ServiceResult.success(@ticket)
    rescue StandardError => e
      Rails.logger.error("[Tickets::UpdateTicket] #{e.class}: #{e.message}")
      ServiceResult.failure('An unexpected error occurred. Please try again.')
    end

    private

    def record_classification_correction_if_needed(snapshot)
      return unless snapshot['category'] != @ticket.category
      return if @ticket.ai_metadata&.dig('category').blank?

      Tickets::RecordClassificationCorrection.call(
        ticket:             @ticket,
        agent:              @user,
        corrected_category: @ticket.category
      )
    rescue StandardError => e
      Rails.logger.error("[UpdateTicket] correction record failed: #{e.message}")
    end

    def changing_status?
      @params.key?(:status) && @params[:status].to_s != @ticket.status
    end

    def validate_status_transition
      new_status = @params[:status].to_s

      unless @ticket.can_transition_to?(new_status, user: @user)
        return ServiceResult.failure(
          "Cannot transition from '#{@ticket.status}' to '#{new_status}'"
        )
      end

      snapshot   = capture_snapshot
      old_status = @ticket.status

      ActiveRecord::Base.transaction do
        return ServiceResult.failure(@ticket.errors.full_messages.join(', ')) unless @ticket.update(permitted_params)

        @ticket.activities.create!(
          user: @user,
          action: TicketActivity::STATUS_CHANGED,
          metadata: { from: old_status, to: @ticket.status }
        )

        record_changes(snapshot.except('status'))
      end

      broadcast_update
      trigger_resolved_webhook if @ticket.status_resolved?
      ServiceResult.success(@ticket)
    end

    def trigger_resolved_webhook
      Webhooks::TriggerService.call(
        workspace: @ticket.workspace,
        event:     'ticket.resolved',
        payload:   { ticket_id: @ticket.id, number: @ticket.ticket_number,
                     title: @ticket.title, resolved_at: @ticket.resolved_at&.iso8601 }
      )
    end

    def permitted_params
      @params.slice(:title, :description, :priority, :category, :status,
                    :department_id, :assigned_to_id, :sla_policy_id,
                    :ai_metadata, :urgency_score)
    end

    def capture_snapshot
      @ticket.slice(:title, :description, :priority, :category,
                    :department_id, :assigned_to_id, :status)
    end

    def record_changes(snapshot)
      snapshot.each do |field, old_value|
        next if field == 'status'
        next if @ticket[field] == old_value

        @ticket.activities.create!(
          user: @user,
          action: "#{field}_changed",
          metadata: { field: field, from: old_value, to: @ticket[field] }
        )
      end
    end

    def broadcast_update
      ActionCable.server.broadcast(
        "tickets:#{@ticket.workspace_id}",
        { event: 'ticket_updated', ticket_id: @ticket.id }
      )
    end
  end
end
