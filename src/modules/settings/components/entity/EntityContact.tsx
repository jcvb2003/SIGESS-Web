import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { EntitySettings } from '../../types/settings.types'

interface EntityContactProps {
  entity?: EntitySettings
}

export function EntityContact({ entity }: EntityContactProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entity-phone-1">Telefone principal</Label>
            <Input
              id="entity-phone-1"
              name="phone1"
              placeholder="(00) 0000-0000"
              defaultValue={entity?.phone1 ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-phone-2">Telefone secundário</Label>
            <Input
              id="entity-phone-2"
              name="phone2"
              placeholder="(00) 0 0000-0000"
              defaultValue={entity?.phone2 ?? ''}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="entity-email">E-mail institucional</Label>
          <Input
            id="entity-email"
            name="email"
            type="email"
            placeholder="contato@exemplo.org"
            defaultValue={entity?.email ?? ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}
