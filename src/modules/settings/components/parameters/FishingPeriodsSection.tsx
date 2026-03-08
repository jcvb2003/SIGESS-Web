import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ParametersSettings } from '../../types/settings.types'

interface FishingPeriodsSectionProps {
  parameters?: ParametersSettings
}

export function FishingPeriodsSection({ parameters }: FishingPeriodsSectionProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Períodos de Defeso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defeso-1-start">Início do 1º período</Label>
            <Input
              id="defeso-1-start"
              name="defeso1Start"
              type="date"
              defaultValue={parameters?.defeso1Start ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defeso-1-end">Fim do 1º período</Label>
            <Input
              id="defeso-1-end"
              name="defeso1End"
              type="date"
              defaultValue={parameters?.defeso1End ?? ''}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="defeso-2-start">Início do 2º período</Label>
            <Input
              id="defeso-2-start"
              name="defeso2Start"
              type="date"
              defaultValue={parameters?.defeso2Start ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defeso-2-end">Fim do 2º período</Label>
            <Input
              id="defeso-2-end"
              name="defeso2End"
              type="date"
              defaultValue={parameters?.defeso2End ?? ''}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="defeso-species">Espécies abrangidas</Label>
          <Input
            id="defeso-species"
            name="defesoSpecies"
            placeholder="Lista de espécies em defeso"
            defaultValue={parameters?.defesoSpecies ?? ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}
