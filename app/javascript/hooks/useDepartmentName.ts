import { useTranslation } from 'react-i18next'

export function useDepartmentName() {
  const { t } = useTranslation('departments')
  return (name: string) => t(name, { defaultValue: name })
}