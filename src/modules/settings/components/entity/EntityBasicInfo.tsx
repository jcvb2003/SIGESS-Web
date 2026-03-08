import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { EntitySettings } from '../../types/settings.types'

interface EntityBasicInfoProps {
  entity?: EntitySettings
}

export function EntityBasicInfo({ entity }: EntityBasicInfoProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Dados Básicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entity-name">Nome completo da entidade</Label>
            <Input
              id="entity-name"
              name="name"
              placeholder="Nome do sindicato"
              defaultValue={entity?.name ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-short-name">Nome abreviado</Label>
            <Input
              id="entity-short-name"
              name="shortName"
              placeholder="Sigla / abreviação"
              defaultValue={entity?.shortName ?? ''}
            />
          </div>
        </div>
        <div className="space-y-2 md:max-w-sm">
          <Label htmlFor="entity-cnpj">CNPJ</Label>
          <Input
            id="entity-cnpj"
            name="cnpj"
            placeholder="00.000.000/0000-00"
            defaultValue={entity?.cnpj ?? ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}
