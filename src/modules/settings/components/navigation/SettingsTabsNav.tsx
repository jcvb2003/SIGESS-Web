import { TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Settings as SettingsIcon, Building, Database, KeyRound } from 'lucide-react'

export function SettingsTabsNav() {
  return (
    <TabsList>
      <TabsTrigger value="dados" className="gap-2">
        <Database className="h-4 w-4" />
        <span className="hidden sm:inline">Dados</span>
      </TabsTrigger>
      <TabsTrigger value="entidade" className="gap-2">
        <Building className="h-4 w-4" />
        <span className="hidden sm:inline">Entidade</span>
      </TabsTrigger>
      <TabsTrigger value="parametros" className="gap-2">
        <SettingsIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Parâmetros</span>
      </TabsTrigger>
      <TabsTrigger value="senhas">
        <KeyRound className="h-4 w-4" />
        <span className="hidden sm:inline">Senhas</span>
      </TabsTrigger>
    </TabsList>
  )
}
