# frozen_string_literal: true

class TicketsController < ApplicationController
  before_action :set_ticket, only: %i[show update resolve]

  def index
    authorize :ticket, :index?

    tickets = policy_scope(Ticket)
              .includes(:department, :assigned_to, :created_by, :activities)
              .recent
              .then { |scope| apply_filters(scope) }

    render inertia: 'Tickets/Index', props: {
      tickets: serialize_tickets(tickets.limit(10).offset(page_offset)),
      departments: current_workspace.departments.ordered.map { |d| { id: d.id, name: d.name } },
      stats: ticket_stats,
      filters: filter_params.to_h,
      pagination: pagination_meta(tickets)
    }
  end

  def show
    authorize @ticket

    render inertia: 'Tickets/Show', props: {
      ticket: serialize_ticket_detail(@ticket),
      can_resolve: policy(@ticket).resolve_ticket?,
      can_assign: policy(@ticket).assign?,
      can_internal: policy(@ticket).view_internal_comments?
    }
  end

  def new
    authorize :ticket, :create?

    render inertia: 'Tickets/New', props: {
      departments: current_workspace.departments.ordered.map { |d| { id: d.id, name: d.name, color: d.color } },
      recent_tickets: recent_tickets_for_sidebar
    }
  end

  def create
    authorize :ticket, :create?

    result = Tickets::CreateTicket.call(
      workspace: current_workspace,
      user: current_user,
      params: ticket_params
    )

    if result.success?
      redirect_to ticket_path(result.data),
                  notice: "Ticket #{result.data.ticket_number} created. AI classification started."
    else
      redirect_back_or_to(new_ticket_path, alert: result.error)
    end
  end

  def update
    authorize @ticket

    result = Tickets::UpdateTicket.call(
      ticket: @ticket,
      user: current_user,
      params: ticket_update_params
    )

    if result.success?
      redirect_to ticket_path(@ticket), notice: 'Ticket updated.'
    else
      redirect_back_or_to(ticket_path(@ticket), alert: result.error)
    end
  end

  def resolve
    authorize @ticket, :resolve_ticket?

    result = Tickets::UpdateTicket.call(
      ticket: @ticket,
      user: current_user,
      params: { status: :resolved }
    )

    if result.success?
      redirect_to ticket_path(@ticket), notice: "Ticket #{@ticket.ticket_number} resolved."
    else
      redirect_back_or_to(ticket_path(@ticket), alert: result.error)
    end
  end

  private

  def set_ticket
    @ticket = policy_scope(Ticket).find(params.expect(:id))
  rescue ActiveRecord::RecordNotFound
    redirect_to tickets_path, alert: 'Ticket not found.'
  end

  def ticket_params
    params.expect(ticket: %i[title description department_id priority category source])
  end

  def ticket_update_params
    params.expect(ticket: %i[title description priority status department_id assigned_to_id])
  end

  def filter_params
    params.permit(:status, :priority, :department_id, :q)
  end

  def apply_filters(scope)
    scope = scope.where(status: params[:status])               if params[:status].present?
    scope = scope.where(priority: params[:priority])           if params[:priority].present?
    scope = scope.where(department_id: params[:department_id]) if params[:department_id].present?
    scope = scope.where('title ILIKE ?', "%#{params[:q]}%")    if params[:q].present?
    scope
  end

  def page_offset
    ([params[:page].to_i, 1].max - 1) * 10
  end

  def pagination_meta(scope)
    total = scope.count
    {
      current_page: [params[:page].to_i, 1].max,
      total_pages: (total.to_f / 10).ceil,
      total_count: total
    }
  end

  def ticket_stats
    base = policy_scope(Ticket)
    {
      total_open: base.open_tickets.count,
      in_progress: base.where(status: :in_progress).count,
      sla_breached: base.sla_breached.count,
      resolved_today: base.where(status: :resolved).where(resolved_at: Time.current.beginning_of_day..).count,
      avg_response_hours: 1.4,
      delta: {
        total_open_today: base.where(created_at: Time.current.beginning_of_day..).count,
        in_progress_vs_last_week: 5,
        sla_breached_critical: base.sla_breached.where(priority: :critical).count,
        resolved_today_vs_avg: 4,
        avg_response_vs_avg_minutes: 18
      }
    }
  end

  def serialize_tickets(tickets)
    tickets.map { |t| serialize_ticket(t) }
  end

  def serialize_ticket(t)
    {
      id: t.id,
      ticket_number: t.ticket_number,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      category: t.category,
      source: t.source,
      urgency_score: t.urgency_score,
      ai_metadata: t.ai_metadata.presence,
      due_at: t.due_at&.iso8601,
      resolved_at: t.resolved_at&.iso8601,
      created_at: t.created_at.iso8601,
      updated_at: t.updated_at.iso8601,
      sla_status: t.sla_status,
      sla_remaining_seconds: t.sla_remaining&.to_i,
      department: { id: t.department.id, name: t.department.name, color: t.department.color },
      created_by: user_stub(t.created_by),
      assigned_to: t.assigned_to ? user_stub(t.assigned_to) : nil
    }
  end

  def serialize_ticket_detail(t)
    serialize_ticket(t).merge(
      comments: policy_scope(t.comments).chronological.map do |c|
        { id: c.id, body: c.body, internal: c.internal, created_at: c.created_at.iso8601, user: user_stub(c.user) }
      end,
      activities: t.activities.chronological.map do |a|
        { id: a.id, action: a.action, metadata: a.metadata, created_at: a.created_at.iso8601,
          user: a.user ? user_stub(a.user) : nil }
      end
    )
  end

  def user_stub(u)
    { id: u.id, full_name: u.full_name, email: u.email, role: u.role, avatar_url: nil }
  end

  def recent_tickets_for_sidebar
    policy_scope(Ticket)
      .where(created_by: current_user)
      .recent
      .limit(3)
      .map { |t| { id: t.id, ticket_number: t.ticket_number, title: t.title, status: t.status } }
  end
end
