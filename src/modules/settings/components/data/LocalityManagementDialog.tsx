import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Edit, Trash } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Input } from "@/shared/components/ui/input";
import { settingsService } from "../../services/settingsService";
import type { Locality } from "../../types/settings.types";

interface LocalityManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (code: string) => void;
}

export function LocalityManagementDialog({
  open,
  onOpenChange,
  onCreated,
}: Readonly<LocalityManagementDialogProps>) {
  const queryClient = useQueryClient();
  const [editingLocality, setEditingLocality] = useState<Locality | null>(null);
  const [name, setName] = useState("");

  const localitiesQuery = useQuery({
    queryKey: ["localities"],
    queryFn: async () => {
      const { data, error } = await settingsService.getLocalities();
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: { id?: string; name: string }) => {
      const { data, error } = await settingsService.saveLocality({
        id: values.id,
        name: values.name,
        code: "", // O código é gerado pelo banco
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (newLocality) => {
      // Aguarda o refetch completo para garantir que a nova localidade esteja na lista global
      await queryClient.refetchQueries({
        queryKey: ["localities"],
      });
      
      toast.success("Localidade salva com sucesso.");
      
      // Se foi uma criação (não edição), chama o callback onCreated
      const isNew = editingLocality && !editingLocality.id;
      if (isNew && newLocality?.code && onCreated) {
        const selectedCode = newLocality.code;
        // Pequeno atraso para garantir que o React Hook Form e o SelectComponent 
        // tenham processado o novo estado da lista antes de setar o valor
        setTimeout(() => {
          onCreated(selectedCode);
          onOpenChange(false);
        }, 100);
      }
      
      setEditingLocality(null);
      setName("");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao salvar localidade.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await settingsService.deleteLocality(id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["localities"],
      });
      toast.success("Localidade excluída com sucesso.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao excluir localidade.";
      toast.error(message);
    },
  });

  const localities = localitiesQuery.data ?? [];

  let dialogTitle = "Gerenciar Localidades";
  if (editingLocality?.id) {
    dialogTitle = "Editar Localidade";
  } else if (editingLocality) {
    dialogTitle = "Nova Localidade";
  }

  const handleEdit = (locality: Locality) => {
    setEditingLocality(locality);
    setName(locality.name);
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      id: editingLocality?.id,
      name,
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = globalThis.confirm(
      "Tem certeza que deseja excluir esta localidade?",
    );
    if (!confirmed) {
      return;
    }
    await deleteMutation.mutateAsync(id);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) {
        setEditingLocality(null);
        setName("");
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Cadastre, edite e remova localidades utilizadas no cadastro de
            sócios.
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
                    <TableCell
                      colSpan={2}
                      className="py-6 text-sm text-muted-foreground text-center"
                    >
                      Nenhuma localidade cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  localities.map((locality) => (
                    <TableRow key={locality.id}>
                      <TableCell className="text-sm">
                        {locality.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                                  onClick={() => handleEdit(locality)}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={5}>Editar Localidade</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-red-600 hover:text-white hover:border-red-600"
                                  onClick={() => locality.id && handleDelete(locality.id)}
                                  disabled={deleteMutation.isPending || !locality.id}
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={5}>Excluir Localidade</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                autoFocus
                onChange={(event) =>
                  setName(event.target.value.toUpperCase())
                }
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {!editingLocality && (
            <Button
              type="button"
              onClick={() => {
                setEditingLocality({ id: "", name: "", code: "" });
                setName("");
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
                  setEditingLocality(null);
                  setName("");
                }}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending || !name.trim()}
              >
                {editingLocality.id ? "Atualizar" : "Adicionar"}
              </Button>
            </>
          )}

          {!editingLocality && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
