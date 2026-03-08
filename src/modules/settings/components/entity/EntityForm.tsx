import { FormEvent } from 'react'
import { Button } from '@/shared/components/ui/button'
import { EntityBasicInfo } from './EntityBasicInfo'
import { EntityAddress } from './EntityAddress'
import { EntityContact } from './EntityContact'
import { EntityInstitutional } from './EntityInstitutional'
import { useEntityData } from '../../hooks/useEntityData'
import { EntitySettings } from '../../types/settings.types'

export function EntityForm() {
  const { entity, isLoading, isSaving, saveEntity } = useEntityData()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    const values: EntitySettings = {
      id: entity?.id,
      name: String(formData.get('name') ?? ''),
      shortName: String(formData.get('shortName') ?? ''),
      cnpj: String(formData.get('cnpj') ?? ''),
      street: String(formData.get('street') ?? ''),
      number: String(formData.get('number') ?? ''),
      district: String(formData.get('district') ?? ''),
      city: String(formData.get('city') ?? ''),
      state: String(formData.get('state') ?? ''),
      cep: String(formData.get('cep') ?? ''),
      phone1: String(formData.get('phone1') ?? ''),
      phone2: String(formData.get('phone2') ?? ''),
      email: String(formData.get('email') ?? ''),
      federation: String(formData.get('federation') ?? ''),
      confederation: String(formData.get('confederation') ?? ''),
      pole: String(formData.get('pole') ?? ''),
      foundation: String(formData.get('foundation') ?? ''),
      county: String(formData.get('county') ?? ''),
    }

    await saveEntity(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || isSaving} size="sm">
          {isSaving ? 'Salvando...' : 'Salvar dados da entidade'}
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <EntityBasicInfo entity={entity} />
          <EntityAddress entity={entity} />
        </div>
        <div className="space-y-4">
          <EntityContact entity={entity} />
          <EntityInstitutional entity={entity} />
        </div>
      </div>
    </form>
  )
}
