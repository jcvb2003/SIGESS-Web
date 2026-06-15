import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { settingsService } from "../../services/settingsService";
import { settingsQueryKeys } from "../../queryKeys";
import { useActiveScope } from "@/shared/hooks/useActiveScope";
import { PortariaManagementDialog } from "./PortariaManagementDialog";

export function PortariasCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { unitId } = useActiveScope();

  const portariasQuery = useQuery({
    queryKey: settingsQueryKeys.portarias(unitId),
    queryFn: async () => {
      const { data, error } = await settingsService.getPortarias(unitId);
      if (error) throw error;
      return data;
    },
  });

  const portarias = portariasQuery.data ?? [];
  const isLoading = portariasQuery.isLoading || portariasQuery.isFetching;

  return (
    <>
      <Card className="border-border/50 shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Portarias
          </CardTitle>
          <CardDescription>
            Segmente os sócios por portaria de defeso.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-t border-border/10 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {isLoading && <span>Carregando portarias...</span>}
            {!isLoading && portarias.length === 0 && (
              <span>Nenhuma portaria cadastrada ainda.</span>
            )}
            {!isLoading && portarias.length > 0 && (
              <span>{portarias.length} portaria{portarias.length !== 1 ? "s" : ""} cadastrada{portarias.length !== 1 ? "s" : ""}.</span>
            )}
          </div>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Gerenciar Portarias
          </Button>
        </CardContent>
      </Card>

      <PortariaManagementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
