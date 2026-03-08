import { Badge } from '@/shared/components/ui/badge'

interface MemberStatusBadgeProps {
  status: string | null
}

const getStatusLabel = (status: string | null) => {
  if (!status) {
    return 'Desconhecido'
  }

  const normalized = status.toUpperCase()

  if (normalized.includes('ATIVO')) {
    return 'Ativo'
  }

  if (normalized.includes('INATIVO')) {
    return 'Inativo'
  }

  return status
}

const isActiveStatus = (status: string | null) => {
  if (!status) {
    return false
  }

  return status.toUpperCase().includes('ATIVO')
}

export function MemberStatusBadge({ status }: MemberStatusBadgeProps) {
  if (isActiveStatus(status)) {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20 dark:text-emerald-400">
        {getStatusLabel(status)}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
      {getStatusLabel(status)}
    </Badge>
  )
}
