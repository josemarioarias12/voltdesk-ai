# frozen_string_literal: true

module WorkspaceAdmin
  class DemoModesController < ApplicationController
    def activate
      authorize current_workspace, :manage_demo?, policy_class: WorkspacePolicy

      result = DemoModes::ActivateDemo.call(workspace: current_workspace)

      if result.success?
        redirect_to demo_presenter_path(result.data[:token])
      else
        redirect_back_or_to root_path, alert: result.error
      end
    end

    def deactivate
      authorize current_workspace, :manage_demo?, policy_class: WorkspacePolicy

      DemoModes::DeactivateDemo.call(token: params[:token])
      redirect_to root_path, notice: 'Demo session ended.'
    end

    def status
      authorize current_workspace, :manage_demo?, policy_class: WorkspacePolicy

      result = DemoModes::GetStatus.call(token: params[:token])

      return render json: { error: result.error }, status: :gone unless result.success?

      tickets = current_workspace.tickets
                                 .where(source: 'qr_demo')
                                 .order(created_at: :desc)
                                 .limit(10)
                                 .includes(:department)

      render json: result.data.merge(tickets: serialize_tickets(tickets))
    end

    private

    def serialize_tickets(tickets)
      tickets.map do |tkt|
        {
          id:            tkt.id,
          ticket_number: tkt.ticket_number,
          title:         tkt.title,
          department:    tkt.department&.name || 'General',
          priority:      tkt.priority,
          created_at:    tkt.created_at.iso8601
        }
      end
    end
  end
end
