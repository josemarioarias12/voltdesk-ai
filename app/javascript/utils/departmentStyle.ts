
export type DeptCategory =
  | 'it'
  | 'software'
  | 'hr'
  | 'facilities'
  | 'finance'
  | 'operations'
  | 'general'

interface CategoryMatch {
  keywords: string[]
  category: DeptCategory
}

const CATEGORY_TABLE: CategoryMatch[] = [
  { keywords: ['it', 'infrastructure', 'network'], category: 'it' },
  { keywords: ['software', 'engineering', 'dev'],  category: 'software' },
  { keywords: ['hr', 'human resources', 'people'], category: 'hr' },
  { keywords: ['facilities'],                      category: 'facilities' },
  { keywords: ['finance'],                         category: 'finance' },
  { keywords: ['operations'],                      category: 'operations' },
]

const CATEGORY_COLORS: Record<DeptCategory, string> = {
  it:         '#028090',
  software:   '#6366F1',
  hr:         '#8B5CF6',
  facilities: '#F97316',
  finance:    '#16A34A',
  operations: '#2563EB',
  general:    '#6B7280',
}

export function getDeptCategory(name: string): DeptCategory {
  const lower = name.toLowerCase()
  const found = CATEGORY_TABLE.find(entry => entry.keywords.some(k => lower.includes(k)))
  return found?.category ?? 'general'
}

export function getDeptColor(name: string): string {
  return CATEGORY_COLORS[getDeptCategory(name)]
}