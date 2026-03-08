import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { FilterSection } from './FilterSection'
import { FilterActions } from './FilterActions'
import type { LocalityOption, StatusFilter, RgpStatusFilter } from '../../types/member.types'

interface FilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  statusFilter: StatusFilter
  onStatusChange: (value: StatusFilter) => void
  localityFilter: string
  onLocalityChange: (value: string) => void
  birthMonthFilter: string
  onBirthMonthChange: (value: string) => void
  genderFilter: string
  onGenderChange: (value: string) => void
  rgpStatusFilter: RgpStatusFilter
  onRgpStatusChange: (value: string) => void
  localities: LocalityOption[]
  onClear: () => void
  onApply: () => void
}

export function FilterPanel({
  open,
  onOpenChange,
  statusFilter,
  onStatusChange,
  localityFilter,
  onLocalityChange,
  birthMonthFilter,
  onBirthMonthChange,
  genderFilter,
  onGenderChange,
  rgpStatusFilter,
  onRgpStatusChange,
  localities,
  onClear,
  onApply,
}: FilterPanelProps) {
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filtros de sócios</SheetTitle>
          <SheetDescription>
            Refine a listagem por situação, localidade e outros critérios.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6">
          <FilterSection title="Situação">
            <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as StatusFilter)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="1 - ATIVO">Ativo</SelectItem>
                <SelectItem value="2 - APOSENTADO">Aposentado</SelectItem>
                <SelectItem value="3 - FALECIDO">Falecido</SelectItem>
                <SelectItem value="4 - TRANSFERIDO">Transferido</SelectItem>
                <SelectItem value="5 - CANCELADO">Cancelado</SelectItem>
                <SelectItem value="6 - SUSPENSO">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Localidade">
            <Select value={localityFilter} onValueChange={onLocalityChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {localities.map((locality) => (
                  <SelectItem key={locality.code || locality.name} value={locality.code || ''}>
                    {locality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Mês de Aniversário">
            <Select 
              value={birthMonthFilter || 'all'} 
              onValueChange={(value) => onBirthMonthChange(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="Gênero">
            <Select value={genderFilter} onValueChange={onGenderChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMININO">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </FilterSection>

          <FilterSection title="RGP">
            <Select value={rgpStatusFilter} onValueChange={onRgpStatusChange}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_rgp">Ativo (Com RGP)</SelectItem>
                <SelectItem value="without_rgp">Sem RGP</SelectItem>
              </SelectContent>
            </Select>
          </FilterSection>
        </div>
        <SheetFooter className="mt-6 mb-6">
          <FilterActions onClear={onClear} onApply={onApply} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
