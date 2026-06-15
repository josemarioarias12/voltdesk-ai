# frozen_string_literal: true

module Api
  module V1
    class TicketsController < BaseController
      def index
        per_page     = params[:per_page].to_i
        per_page     = 25 unless per_page.positive?
        per_page     = [per_page, 100].min
        current_page = [params[:page].to_i, 1].max
        offset       = (current_page - 1) * per_page

        scope   = @current_workspace.tickets
                                    .includes(:department, :assigned_to)
                                    .then { |scp| filter_tickets(scp) }
                                    .order(created_at: :desc)
        total   = scope.count
        tickets = scope.limit(per_page).offset(offset)

        render_success({
                         tickets: tickets.map { |tkt| serialize_ticket(tkt) },
          meta: {
            current_page: current_page,
            total_pages:  (total.to_f / per_page).ceil,
            total_count:  total
          }
                       })
      end

      def show
        ticket = @current_workspace.tickets.find(params.expect(:id))
        render_success(serialize_ticket(ticket, detailed: true))
      end

      def create
        result = Tickets::CreateTicket.call(
          workspace: @current_workspace,
          user:      @current_api_key.user,
          params:    ticket_params
        )

        if result.success?
          render_success(serialize_ticket(result.data), status: :created)
        else
          render_error(result.error, code: 'unprocessable', status: :unprocessable_entity)
        end
      end

      private

      def ticket_params
        params.expect(ticket: %i[title description priority department_id])
      end

      def filter_tickets(scope)
        scope = scope.where(status: params[:status])                if params[:status].present?
        scope = scope.where(priority: params[:priority])            if params[:priority].present?
        scope = scope.where(department_id: params[:department_id])  if params[:department_id].present?
        scope
      end

      def serialize_ticket(ticket, detailed: false)
        base = {
          id:          ticket.id,
          number:      ticket.ticket_number,
          title:       ticket.title,
          status:      ticket.status,
          priority:    ticket.priority,
          department:  ticket.department&.name,
          assigned_to: ticket.assigned_to&.full_name,
          created_at:  ticket.created_at.iso8601,
          updated_at:  ticket.updated_at.iso8601,
          ai_metadata: {
            category:      ticket.ai_metadata&.dig('category'),
            confidence:    ticket.ai_metadata&.dig('confidence'),
            urgency_score: ticket.urgency_score
          }
        }

        return base unless detailed

        base.merge(
          description:      ticket.description,
          comments_count:   ticket.comments.count,
          activities_count: ticket.activities.count,
          sla_status:       sla_status_for(ticket),
          due_at:           ticket.due_at&.iso8601
        )
      end

      def sla_status_for(ticket)
        return 'resolved' if ticket.status_resolved?
        return 'breached' if ticket.due_at && ticket.due_at < Time.current
        return 'at_risk'  if ticket.due_at && ticket.due_at < 30.minutes.from_now

        'on_track'
      end
    end
  end
end
