# frozen_string_literal: true

class TicketsController < ApplicationController
  before_action :set_ticket, only: %i[show update resolve]
  ALLOWED_SORT_COLUMNS = %w[priority updated_at].freeze
  def index
    authorize :ticket, :index?

    tickets = policy_scope(Ticket)
              .includes(:department, :assigned_to, :created_by, :activities)
              .recent
              .then { |scope| apply_filters(scope) }
              .then { |scope| apply_sort(scope) }

    stats_result = Analytics::TicketIndexStats.call(workspace: current_workspace, scope: policy_scope(Ticket))

    render inertia: 'Tickets/Index', props: {
      tickets: serialize_tickets(tickets.limit(10).offset(page_offset)),
      departments: current_workspace.departments.ordered.map { |d| { id: d.id, name: d.name } },
      assignable_agents: assignable_agents_list,
      stats: stats_result.data,
      filters: filter_params.to_h,
      pagination: pagination_meta(tickets)
    }
  end

  def show
    authorize @ticket

    render inertia: 'Tickets/Show', props: {
      ticket:       serialize_ticket_detail(@ticket),
      can_resolve:  policy(@ticket).resolve_ticket?,
      can_assign:   policy(@ticket).assign?,
      can_internal: policy(@ticket).view_internal_comments?,
      agent_action: serialize_pending_agent_action(@ticket)
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

  def ai_preview
    authorize :ticket, :create?
    title       = params[:title].to_s.strip
    description = params[:description].to_s.strip
    if title.blank? && description.length < 10
      return render json: { error: 'insufficient_input' },
                    status: :unprocessable_content
    end

    result = Tickets::AiPreview.call(title: title, description: description)
    render json: result.data
  end

  def bulk_update
    authorize :ticket, :index?

    result = Tickets::BulkUpdate.call(
      workspace:  current_workspace,
      user:       current_user,
      ticket_ids: bulk_params[:ticket_ids],
      action:     bulk_params[:bulk_action],
      value:      bulk_params[:value]
    )

    if result.success?
      message = "#{result.data[:updated_count]} ticket(s) updated."
      skipped = result.data[:skipped_count]
      message += " #{skipped} skipped (invalid status or permission)." if skipped.positive?
      redirect_to tickets_path, notice: message
    else
      redirect_to tickets_path, alert: result.error
    end
  end

  private

  def set_ticket
    @ticket = policy_scope(Ticket).includes(:department, :assigned_to, :created_by, :activities, comments: :user,
activities: :user).find(params.expect(:id))
  end

  def ticket_params
    # rubocop:disable Rails/StrongParametersExpect
    if params[:ticket].present?
      params.require(:ticket).permit(:title, :description, :department_id, :priority, :category, :source, :space_id,
                                     attachments: [])
    else
      params.permit(:title, :description, :department_id, :priority, :category, :source, :space_id,
                    attachments: [])
    end
    # rubocop:enable Rails/StrongParametersExpect
  end

  def ticket_update_params
    params.expect(ticket: %i[title description priority status department_id assigned_to_id space_id])
  end

  def bulk_params
    params.permit(:bulk_action, :value, ticket_ids: [])
  end

  def filter_params
    params.permit(:status, :priority, :department_id, :q, :sort, :direction)
  end

  def apply_filters(scope)
    scope = scope.where(status: params[:status])               if params[:status].present?
    scope = scope.where(priority: params[:priority])           if params[:priority].present?
    scope = scope.where(department_id: params[:department_id]) if params[:department_id].present?
    scope = scope.where('title ILIKE ?', "%#{params[:q]}%")    if params[:q].present?
    scope
  end

  def apply_sort(scope)
    return scope unless ALLOWED_SORT_COLUMNS.include?(params[:sort])

    direction = params[:direction] == 'asc' ? :asc : :desc
    scope.reorder(params[:sort] => direction)
  end

  def assignable_agents_list
    excluded_roles = User.roles.values_at('employee', 'guest')
    current_workspace.users
                     .where.not(role: excluded_roles)
                     .order(:first_name, :last_name)
                     .map { |u| { id: u.id, full_name: u.full_name } }
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

  def serialize_tickets(tickets)
    tickets.map { |t| serialize_ticket(t) }
  end

  def serialize_ticket(tkt)
    {
      id: tkt.id,
      ticket_number: tkt.ticket_number,
      title: tkt.title,
      description: tkt.description,
      status: tkt.status,
      priority: tkt.priority,
      category: tkt.category,
      source: tkt.source,
      urgency_score: tkt.urgency_score,
      ai_metadata: tkt.ai_metadata.presence,
      due_at: tkt.due_at&.iso8601,
      resolved_at: tkt.resolved_at&.iso8601,
      created_at: tkt.created_at.iso8601,
      updated_at: tkt.updated_at.iso8601,
      sla_status: tkt.sla_status,
      sla_remaining_seconds: tkt.sla_remaining&.to_i,
      department: { id: tkt.department.id, name: tkt.department.name, color: tkt.department.color },
      created_by: user_stub(tkt.created_by),
      assigned_to: tkt.assigned_to ? user_stub(tkt.assigned_to) : nil,
      attachments: tkt.attachments.map do |att|
        {
          id:           att.id,
          filename:     att.filename.to_s,
          content_type: att.content_type,
          url:          url_for(att)
        }
      end
    }
  end

  def serialize_ticket_detail(tkt)
    serialize_ticket(tkt).merge(
      comments: policy_scope(tkt.comments).chronological.map do |com|
        { id: com.id, body: com.body, internal: com.internal, created_at: com.created_at.iso8601,
user: user_stub(com.user) }
      end,
      activities: tkt.activities.chronological.map do |act|
        { id: act.id, action: act.action, metadata: act.metadata, created_at: act.created_at.iso8601,
          user: act.user ? user_stub(act.user) : nil }
      end,
      correction_rate: build_correction_rate(tkt)
    )
  end

  def build_correction_rate(tkt)
    ai_category = tkt.ai_metadata&.dig('category')
    return nil if ai_category.blank?

    {
      category: ai_category,
      times_corrected: ClassificationCorrection.where(
        original_category: ai_category,
        workspace: tkt.workspace
      ).count,
      total_in_workspace: Ticket.where(workspace: tkt.workspace).count
    }
  end

  def user_stub(usr)
    { id: usr.id, full_name: usr.full_name, email: usr.email, role: usr.role, avatar_url: nil }
  end

  def recent_tickets_for_sidebar
    policy_scope(Ticket)
      .where(created_by: current_user)
      .recent
      .limit(3)
      .map { |t| { id: t.id, ticket_number: t.ticket_number, title: t.title, status: t.status } }
  end

  def serialize_pending_agent_action(tkt)
    action = AgentAction.where(ticket: tkt, status: AgentAction.statuses[:pending_approval])
                        .order(created_at: :desc)
                        .first
    return nil unless action

    result = action.result || {}
    {
      id:              action.id,
      action_type:     action.action_type,
      status:          action.status,
      confidence:      action.confidence.to_f,
      ai_reasoning:    result['ai_reasoning'].to_s,
      similar_tickets: result['similar_tickets'] || [],
      top_similarity:  result['top_similarity'].to_f,
      created_at:      action.created_at.iso8601
    }
  end
end
