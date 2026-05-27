import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, Check, ChevronRight, MapPinned } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { useTenantUnits } from "@/modules/tenant-units/context/TenantUnitContext";

export default function SelectUnitPage() {
  const navigate = useNavigate();
  const { hydrated, availableUnits, activeUnit, hasMultipleUnits, setActiveUnit } =
    useTenantUnits();

  const sortedUnits = useMemo(
    () =>
      [...availableUnits].sort((left, right) =>
        left.name.localeCompare(right.name, "pt-BR"),
      ),
    [availableUnits],
  );

  if (!hydrated) {
    return null;
  }

  if (!hasMultipleUnits) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSelectUnit = (unitId: string) => {
    const nextUnit = availableUnits.find((unit) => unit.id === unitId) ?? null;
    if (!nextUnit) return;

    setActiveUnit(nextUnit);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-5xl items-center justify-center py-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_1.4fr]">
        <Card className="border-primary/20 bg-card/70 shadow-xl backdrop-blur-sm">
          <CardHeader className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPinned className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Escolha o polo</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Seu acesso est&aacute; vinculado a mais de um polo. Selecione qual contexto
                deseja usar agora para navegar no sistema.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-medium text-foreground">Como funciona</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Voc&ecirc; poder&aacute; trocar de polo depois pelo menu lateral, sem
                precisar sair da conta.
              </p>
            </div>
            {activeUnit && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                  Polo ativo atual
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {activeUnit.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {sortedUnits.map((unit) => {
            const isActive = unit.id === activeUnit?.id;

            return (
              <Card
                key={unit.id}
                variant="interactive"
                role="button"
                tabIndex={0}
                onClick={() => handleSelectUnit(unit.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectUnit(unit.id);
                  }
                }}
                className="group rounded-3xl border-border/60 bg-card/80 shadow-lg backdrop-blur-sm"
              >
                <CardContent className="flex items-center justify-between gap-4 p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-foreground">
                          {unit.name}
                        </p>
                        {isActive && (
                          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            Atual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {unit.code ? `C&oacute;digo ${unit.code}` : "Polo sem c&oacute;digo p&uacute;blico"}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={isActive ? "secondary" : "default"}
                    className="min-w-36 justify-center rounded-xl"
                  >
                    {isActive ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Continuar
                      </>
                    ) : (
                      <>
                        Acessar
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
