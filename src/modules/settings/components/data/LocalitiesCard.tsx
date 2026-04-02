import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { settingsService } from "../../services/settingsService";
import { LocalityManagementDialog } from "./LocalityManagementDialog";

export function LocalitiesCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const localitiesQuery = useQuery({
    queryKey: ["localities"],
    queryFn: async () => {
      const { data, error } = await settingsService.getLocalities();
      if (error) throw error;
      return data;
    },
  });

  const localities = localitiesQuery.data ?? [];
  const isLoading = localitiesQuery.isLoading || localitiesQuery.isFetching;

  return (
    <>
      <Card className="border-border/50 shadow-sm h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localidades
          </CardTitle>
          <CardDescription>
            Cadastre e organize as comunidades e regiões atendidas pelo
            sindicato.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 border-t border-border/10 pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {isLoading && <span>Carregando localidades...</span>}
            {!isLoading && localities.length === 0 && (
              <span>Nenhuma localidade cadastrada ainda.</span>
            )}
            {!isLoading && localities.length > 0 && (
              <span>{localities.length} localidades cadastradas.</span>
            )}
          </div>
          <Button
            variant="outline"
            className="justify-start gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Gerenciar Localidades
          </Button>
        </CardContent>
      </Card>

      <LocalityManagementDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </>
  );
}
