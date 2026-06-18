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
import { settingsQueryKeys } from "../../queryKeys";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import type { Portaria } from "../../types/settings.types";

interface PortariaManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PortariaManagementDialog({
  open,
  onOpenChange,
}: Readonly<PortariaManagementDialogProps>) {
  const queryClient = useQueryClient();
  const { unitId } = useActiveScope();
  const [editingPortaria, setEditingPortaria] = useState<Portaria | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");

  const portariasQuery = useQuery({
    queryKey: settingsQueryKeys.portarias(unitId),
    queryFn: async () => {
      const { data, error } = await settingsService.getPortarias(unitId);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: { id?: string; codigoPortaria: string; nome: string }) => {
      const { data, error } = await settingsService.savePortaria(
        { id: values.id, codigoPortaria: values.codigoPortaria, nome: values.nome },
        unitId,
      );
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: settingsQueryKeys.portarias(unitId),
      });
      toast.success("Portaria salva com sucesso.");
      setEditingPortaria(null);
      setCodigo("");
      setNome("");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao salvar portaria.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await settingsService.deletePortaria(id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: settingsQueryKeys.portarias(unitId),
      });
      toast.success("Portaria excluída com sucesso.");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Erro ao excluir portaria.";
      toast.error(message);
    },
  });

  const portarias = portariasQuery.data ?? [];

  let dialogTitle = "Gerenciar Portarias";
  if (editingPortaria?.id) {
    dialogTitle = "Editar Portaria";
  } else if (editingPortaria) {
    dialogTitle = "Nova Portaria";
  }

  const handleEdit = (portaria: Portaria) => {
    setEditingPortaria(portaria);
    setCodigo(portaria.codigoPortaria);
    setNome(portaria.nome);
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({
      id: editingPortaria?.id,
      codigoPortaria: codigo,
      nome,
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = globalThis.confirm(
      "Tem certeza que deseja excluir esta portaria?",
    );
    if (!confirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      setEditingPortaria(null);
      setCodigo("");
      setNome("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            Cadastre, edite e remova portarias utilizadas no cadastro de sócios.
          </DialogDescription>
        </DialogHeader>

        {!editingPortaria && (
          <div className="max-h-80 overflow-y-auto border border-border/40 rounded-md">
            <TooltipProvider delayDuration={100}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portarias.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-6 text-sm text-muted-foreground text-center"
                      >
                        Nenhuma portaria cadastrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    portarias.map((portaria) => (
                      <TableRow key={portaria.id}>
                        <TableCell className="text-sm font-medium w-24">
                          {portaria.codigoPortaria}
                        </TableCell>
                        <TableCell className="text-sm">
                          {portaria.nome}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                                onClick={() => handleEdit(portaria)}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={5}>Editar Portaria</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 transition-all duration-200 shadow-sm hover:scale-110 active:scale-95 hover:bg-red-600 hover:text-white hover:border-red-600"
                                onClick={() => portaria.id && handleDelete(portaria.id)}
                                disabled={deleteMutation.isPending || !portaria.id}
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={5}>Excluir Portaria</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        )}

        {editingPortaria && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="portaria-codigo" className="text-sm font-medium">
                Código da portaria
              </label>
              <Input
                id="portaria-codigo"
                placeholder="Ex: 43"
                value={codigo}
                autoFocus
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="portaria-nome" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="portaria-nome"
                placeholder="Ex: SALGADO"
                value={nome}
                onChange={(e) => setNome(e.target.value.toUpperCase())}
                style={{ textTransform: "uppercase" }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {!editingPortaria && (
            <Button
              type="button"
              onClick={() => {
                setEditingPortaria({ id: "", codigoPortaria: "", nome: "" });
                setCodigo("");
                setNome("");
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Portaria
            </Button>
          )}

          {editingPortaria && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingPortaria(null);
                  setCodigo("");
                  setNome("");
                }}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending || !codigo.trim() || !nome.trim()}
              >
                {editingPortaria.id ? "Atualizar" : "Adicionar"}
              </Button>
            </>
          )}

          {!editingPortaria && (
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
