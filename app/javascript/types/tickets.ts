// Ticket domain types — strict TypeScript, no any

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'resolved'
  | 'closed'
  | 'pending_classification'

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export type TicketCategory =
  | 'general' | 'it' | 'hr' | 'facilities'
  | 'finance' | 'operations' | 'support'

export type TicketSource = 'web' | 'voice' | 'qr_demo' | 'email'

export type SlaStatus = 'on_track' | 'at_risk' | 'breached' | 'met'

export interface UserStub {
  id: number
  full_name: string
  email: string
  role: string
  avatar_url: string | null
}

export interface DepartmentStub {
  id: number
  name: string
  color: string
}

export interface AiMetadata {
  category: string
  priority: string
  urgency_score: number
  reasoning: {
    category_signals: string[]
    priority_signals: string[]
    confidence: number
  }
  tags: string[]
  suggested_agent: string | null
  classified_at: string | null
  image_analysis?: string
}

export interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  source: TicketSource
  urgency_score: number
  ai_metadata: AiMetadata | null
  correction_rate: { category: string; times_corrected: number; total_in_workspace: number } | null
  due_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  sla_status: SlaStatus
  sla_remaining_seconds: number | null
  department: DepartmentStub
  created_by: UserStub
  assigned_to: UserStub | null
  attachments: Array<{ id: number; filename: string; content_type: string; url: string }>
}

export interface TicketComment {
  id: number
  body: string
  internal: boolean
  created_at: string
  user: UserStub
}

export interface TicketActivity {
  id: number
  action: string
  metadata: Record<string, unknown>
  created_at: string
  user: UserStub | null
}

export interface TicketStats {
  total_open: number
  in_progress: number
  pending: number
  sla_breached: number
  resolved_today: number
  avg_response_hours: number
  by_status: Record<TicketStatus, number>
  delta: {
    total_open_today: number
    in_progress_vs_last_week: number
    sla_breached_critical: number
    resolved_today_vs_avg: number
    avg_response_vs_avg_minutes: number
  }
}

export interface PaginationMeta {
  current_page: number
  total_pages: number
  total_count: number
}

export type TicketSortColumn = 'priority' | 'updated_at'
export type SortDirection = 'asc' | 'desc'

export interface TicketsFilters {
  status?: string
  priority?: string
  department_id?: string
  q?: string
  sort?: TicketSortColumn
  direction?: SortDirection
}

export interface TicketsIndexProps {
  tickets: Ticket[]
  departments: Array<{ id: number; name: string }>
  assignable_agents: Array<{ id: number; full_name: string }>
  stats: TicketStats
  filters: TicketsFilters
  pagination: PaginationMeta
}

// AgentAction pending approval — propagated to Tickets/Show when human_in_the_loop is active
export interface AgentActionPending {
  id: number
  action_type: string
  status: string
  confidence: number
  ai_reasoning: string
  similar_tickets: Array<{ id: number; title: string; similarity: number }>
  top_similarity: number
  created_at: string
}

export interface TicketsShowProps {
  ticket: Ticket & {
    comments: TicketComment[]
    activities: TicketActivity[]
  }
  can_resolve: boolean
  can_assign: boolean
  can_change_priority: boolean
  can_internal: boolean
  assignable_agents: Array<{ id: number; full_name: string }>
  agent_action: AgentActionPending | null
}

export interface TicketsNewProps {
  departments: Array<{ id: number; name: string; color: string }>
  recent_tickets: Array<{
    id: number
    ticket_number: string
    title: string
    status: TicketStatus
  }>
}

// S4 — AI Engine types
export interface AiSuggestion {
  suggestion:   string
  based_on:     string[]
  generated_at: string
}

export interface AiAuditLog {
  id:                 number
  operation:          string
  model:              string
  prompt_tokens:      number
  completion_tokens:  number
  total_tokens:       number
  duration_ms:        number
  confidence_score:   number | null
  status:             'success' | 'error' | 'timeout'
  estimated_cost_usd: number
  created_at:         string
  user:               UserStub | null
}

export interface TicketClassifiedPayload {
  type:       'ticket_classified'
  ticket_id:  number
  ticket:     Partial<Ticket>
}