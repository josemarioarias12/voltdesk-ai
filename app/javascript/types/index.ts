export interface User {
  id: number
  email: string
  full_name: string
  first_name: string
  last_name: string
  role: Role
  active: boolean
}

export type Role =
  | 'super_admin'
  | 'workspace_admin'
  | 'hr_manager'
  | 'it_manager'
  | 'facilities_manager'
  | 'operations_manager'
  | 'department_manager'
  | 'agent'
  | 'employee'
  | 'guest'

export interface Workspace {
  id: number
  name: string
  slug: string
  plan: 'starter' | 'professional' | 'enterprise'
}

export interface Notification {
  id: number
  title: string
  body: string
  notification_type: string
  resource_type: string | null
  resource_id: number | null
  read: boolean
  created_at: string
}

export interface SharedProps {
  auth: { user: User | null }
  workspace: Workspace | null
  flash: { notice: string | null; alert: string | null }
  notifications: Notification[]
  unread_notifications_count: number
  active_tickets_count: number
  [key: string]: unknown
}

export interface LeaveRequest {
  id: number
  leave_type: string
  start_date: string
  end_date: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string | null
  rejection_reason: string | null
  business_days: number
  created_at: string
  user: {
    id: number
    full_name: string
    email: string
    role: string
    department: string | null
  }
  approved_by: {
    id: number
    full_name: string
  } | null
}

export interface OnboardingTask {
  id: number
  title: string
  completed: boolean
  due_date: string | null
  order_index: number
}

export interface OnboardingSection {
  category: string
  title: string
  tasks: OnboardingTask[]
}

export interface OnboardingPlan {
  id: number
  status: string
  completion_percentage: number
  target_completion_date: string | null
  started_at: string
  tasks_completed: number
  tasks_total: number
  sections: OnboardingSection[]
}
