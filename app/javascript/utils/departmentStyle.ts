export type DeptCategory =
  | 'it'
  | 'software'
  | 'hr'
  | 'facilities'
  | 'finance'
  | 'operations'
  | 'compliance'
  | 'general'

interface CategoryMatch {
  keywords: string[]
  category: DeptCategory
}

const CATEGORY_TABLE: CategoryMatch[] = [
  { keywords: ['it', 'infrastructure', 'network'],       category: 'it' },
  { keywords: ['software', 'engineering', 'dev'],        category: 'software' },
  { keywords: ['hr', 'human resources', 'people'],       category: 'hr' },
  { keywords: ['facilities'],                            category: 'facilities' },
  { keywords: ['finance', 'treasury'],                   category: 'finance' },
  { keywords: ['operations', 'branch', 'customer'],      category: 'operations' },
  { keywords: ['compliance', 'risk', 'legal', 'audit', 'fraud'], category: 'compliance' },
]

const CATEGORY_COLORS: Record<DeptCategory, string> = {
  it:         '#028090',
  software:   '#6366F1',
  hr:         '#8B5CF6',
  facilities: '#F97316',
  finance:    '#16A34A',
  operations: '#2563EB',
  compliance: '#DC2626',
  general:    '#CBD5E1',
}

export function getDeptCategory(name: string): DeptCategory {
  const lower = name.toLowerCase()
  const words = lower.split(/[^a-z]+/).filter(Boolean)

  const found = CATEGORY_TABLE.find(entry =>
    entry.keywords.some(keyword =>
      keyword.includes(' ') ? lower.includes(keyword) : words.includes(keyword)
    )
  )
  return found?.category ?? 'general'
}

export function getDeptColor(name: string): string {
  return CATEGORY_COLORS[getDeptCategory(name)]
}