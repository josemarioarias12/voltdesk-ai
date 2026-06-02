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
    similar_ticket: string | null
    confidence: number
  }
  tags: string[]
  suggested_agent: string | null
  classified_at: string | null
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
  due_at: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  sla_status: SlaStatus
  sla_remaining_seconds: number | null
  department: DepartmentStub
  created_by: UserStub
  assigned_to: UserStub | null
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
  sla_breached: number
  resolved_today: number
  avg_response_hours: number
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

export interface TicketsFilters {
  status?: string
  priority?: string
  department_id?: string
  q?: string
}

export interface TicketsIndexProps {
  tickets: Ticket[]
  departments: Array<{ id: number; name: string }>
  stats: TicketStats
  filters: TicketsFilters
  pagination: PaginationMeta
}

export interface TicketsShowProps {
  ticket: Ticket & {
    comments: TicketComment[]
    activities: TicketActivity[]
  }
  can_resolve: boolean
  can_assign: boolean
  can_internal: boolean
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
