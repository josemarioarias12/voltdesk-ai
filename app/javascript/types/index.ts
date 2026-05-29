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

export interface SharedProps {
  auth: { user: User | null }
  workspace: Workspace | null
  flash: { notice: string | null; alert: string | null }
  [key: string]: unknown
}