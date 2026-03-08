import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MapPin, Plus, Edit, Trash } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { settingsService } from '../../services/settingsService'
import type { Locality } from '../../types/settings.types'

export function LocalitiesCard() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocality, setEditingLocality] = useState<Locality | null>(null)
  const [name, setName] = useState('')

  const localitiesQuery = useQuery({
    queryKey: ['settings', 'localities'],
    queryFn: () => settingsService.getLocalities(),
    staleTime: 1000 * 60 * 5,
  })

  const saveMutation = useMutation({
    mutationFn: (values: { id?: string; name: string }) => settingsService.saveLocality(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'localities'] })
      toast.success('Localidade salva com sucesso.')
      setEditingLocality(null)
      setName('')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao salvar localidade.'
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsService.deleteLocality(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['settings', 'localities'] })
      toast.success('Localidade excluída com sucesso.')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao excluir localidade.'
      toast.error(message)
    },
  })

  const localities = localitiesQuery.data ?? []

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
    setEditingLocality(null)
    setName('')
  }

  const handleEdit = (locality: Locality) => {
    setEditingLocality(locality)
    setName(locality.name)
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      id: editingLocality?.id,
      name,
    })
  }

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta localidade?')
    if (!confirmed) {
      return
    }

    await deleteMutation.mutateAsync(id)
  }

  const isLoading = localitiesQuery.isLoading || localitiesQuery.isFetching

  return (
    <>
      <Card className="border-border/50 shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localidades
          </CardTitle>
          <CardDescription>
            Cadastre e organize as comunidades e regiões atendidas pelo sindicato.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-t border-border/10 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {isLoading ? (
              <span>Carregando localidades...</span>
            ) : localities.length === 0 ? (
              <span>Nenhuma localidade cadastrada ainda.</span>
            ) : (
              <span>{localities.length} localidades cadastradas.</span>
            )}
          </div>
          <Button variant="outline" className="justify-start gap-2" onClick={handleOpenDialog}>
            <Plus className="h-4 w-4" />
            Gerenciar Localidades
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLocality ? 'Editar Localidade' : 'Gerenciar Localidades'}</DialogTitle>
            <DialogDescription>
              Cadastre, edite e remova localidades utilizadas no cadastro de sócios.
            </DialogDescription>
          </DialogHeader>

          {!editingLocality && (
            <div className="max-h-80 overflow-y-auto border border-border/40 rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="py-6 text-sm text-muted-foreground text-center">
                        Nenhuma localidade cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    localities.map((locality) => (
                      <TableRow key={locality.id}>
                        <TableCell className="text-sm">{locality.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-foreground"
                              onClick={() => handleEdit(locality)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(locality.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {editingLocality && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="locality-name" className="text-sm font-medium">
                  Nome da localidade
                </label>
                <Input
                  id="locality-name"
                  placeholder="Nome da localidade"
                  value={name}
                  onChange={(event) => setName(event.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {!editingLocality && (
              <Button
                type="button"
                onClick={() => {
                  setEditingLocality({ id: '', name: '', code: '' })
                  setName('')
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Localidade
              </Button>
            )}

            {editingLocality && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingLocality(null)
                    setName('')
                  }}
                  disabled={saveMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSave} disabled={saveMutation.isPending || !name.trim()}>
                  {editingLocality.id ? 'Atualizar' : 'Adicionar'}
                </Button>
              </>
            )}

            {!editingLocality && (
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Fechar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
