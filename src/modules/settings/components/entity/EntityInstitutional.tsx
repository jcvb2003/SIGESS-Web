import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { EntitySettings } from '../../types/settings.types'

interface EntityInstitutionalProps {
  entity?: EntitySettings
}

export function EntityInstitutional({ entity }: EntityInstitutionalProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Informações Institucionais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entity-federation">Federação</Label>
            <Input
              id="entity-federation"
              name="federation"
              placeholder="Nome da federação"
              defaultValue={entity?.federation ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-confederation">Confederação</Label>
            <Input
              id="entity-confederation"
              name="confederation"
              placeholder="Nome da confederação"
              defaultValue={entity?.confederation ?? ''}
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entity-pole">Polo</Label>
            <Input
              id="entity-pole"
              name="pole"
              placeholder="Polo"
              defaultValue={entity?.pole ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="entity-foundation">Fundação</Label>
            <Input
              id="entity-foundation"
              name="foundation"
              placeholder="Data de fundação"
              defaultValue={entity?.foundation ?? ''}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="entity-county">Comarca</Label>
          <Input
            id="entity-county"
            name="county"
            placeholder="Comarca"
            defaultValue={entity?.county ?? ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}
