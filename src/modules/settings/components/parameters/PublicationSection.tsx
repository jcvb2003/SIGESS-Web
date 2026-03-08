import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ParametersSettings } from '../../types/settings.types'

interface PublicationSectionProps {
  parameters?: ParametersSettings
}

export function PublicationSection({ parameters }: PublicationSectionProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Publicação Oficial e Área de Pesca</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="publication-number">Número da publicação</Label>
            <Input
              id="publication-number"
              name="publicationNumber"
              placeholder="0000"
              defaultValue={parameters?.publicationNumber ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publication-date">Data da publicação</Label>
            <Input
              id="publication-date"
              name="publicationDate"
              type="date"
              defaultValue={parameters?.publicationDate ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publication-local">Local da publicação</Label>
            <Input
              id="publication-local"
              name="publicationLocal"
              placeholder="Diário Oficial / outro"
              defaultValue={parameters?.publicationLocal ?? ''}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fishing-area">Área de pesca</Label>
          <Input
            id="fishing-area"
            name="fishingArea"
            placeholder="Ex.: Águas interiores da região de ..."
            defaultValue={parameters?.fishingArea ?? ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}
