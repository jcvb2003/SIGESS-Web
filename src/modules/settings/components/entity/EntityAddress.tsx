import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { EntitySettings } from '../../types/settings.types'

interface EntityAddressProps {
  entity?: EntitySettings
}

export function EntityAddress({ entity }: EntityAddressProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Endereço</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="entity-street">Logradouro</Label>
            <Input
              id="entity-street"
              name="street"
              placeholder="Rua, avenida, travessa..."
              defaultValue={entity?.street ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-number">Número</Label>
            <Input
              id="entity-number"
              name="number"
              placeholder="S/N"
              defaultValue={entity?.number ?? ''}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="entity-district">Bairro</Label>
            <Input
              id="entity-district"
              name="district"
              placeholder="Bairro"
              defaultValue={entity?.district ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-city">Cidade</Label>
            <Input
              id="entity-city"
              name="city"
              placeholder="Cidade"
              defaultValue={entity?.city ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-uf">UF</Label>
            <Input
              id="entity-uf"
              name="state"
              placeholder="UF"
              maxLength={2}
              defaultValue={entity?.state ?? ''}
            />
          </div>
        </div>
        <div className="space-y-2 md:max-w-xs">
          <Label htmlFor="entity-cep">CEP</Label>
          <Input
            id="entity-cep"
            name="cep"
            placeholder="00000-000"
            defaultValue={entity?.cep ?? ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}
