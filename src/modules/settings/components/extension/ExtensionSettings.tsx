import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import {
  Puzzle,
  Save,
  Trash2,
  RefreshCw,
  Monitor,
  ShieldCheck,
  Calendar,
  Layers,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { extensionService, LicenseInfo } from "../../services/extensionService";
import { cn } from "@/shared/lib/utils";
import { Separator } from "@/shared/components/ui/separator";

export function ExtensionSettings() {
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validatedKey, setValidatedKey] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deactivatingFingerprint, setDeactivatingFingerprint] = useState<string | null>(null);

  const refreshLicenseInfo = useCallback(async (key: string) => {
    setIsRefreshing(true);
    try {
      const info = await extensionService.callAdminApi("list_devices", key);
      setLicenseInfo(info);
      setValidatedKey(key);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Não foi possível carregar as informações da licença.";
      toast.error(message);
      setLicenseInfo(null);
      setValidatedKey(key);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const loadLocalKey = useCallback(async () => {
    setIsLoading(true);
    try {
      const key = await extensionService.getLicenseKey();
      if (key) {
        setLicenseKey(key);
        await refreshLicenseInfo(key);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [refreshLicenseInfo]);

  const handleSaveKey = async () => {
    if (!licenseKey.trim()) {
      toast.warning("Por favor, insira uma chave de licença válida.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await extensionService.saveLicenseKey(licenseKey);
      if (error) throw error;
      
      await refreshLicenseInfo(licenseKey);
      toast.success("Chave de licença salva com sucesso!");
    } catch (err: unknown) {
      console.error(err);
      toast.error("Erro ao salvar a chave de licença localmente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (fingerprint: string) => {
    setDeactivatingFingerprint(fingerprint);
    try {
      await extensionService.callAdminApi("deactivate_device", licenseKey, fingerprint);
      // Após desativar, força a atualização total da lista para garantir consistência
      await refreshLicenseInfo(licenseKey);
      toast.success("Dispositivo desvinculado com sucesso!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao desvincular dispositivo.";
      toast.error(message);
    } finally {
      setDeactivatingFingerprint(null);
    }
  };

  useEffect(() => {
    loadLocalKey();
  }, [loadLocalKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Puzzle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Configuração da Extensão SIGESS</CardTitle>
            <CardDescription>
              Gerencie a chave de licença e os computadores autorizados a usar a{" "}
              <a
                href="http://shortlink.uk/sigess"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline font-medium"
              >
                extensão
              </a>.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="license-key">Chave de Licença</Label>
              <div className="flex gap-2">
                <Input
                  id="license-key"
                  placeholder="X1Y2-Z3W4-..."
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="font-mono"
                />
                <Button 
                  onClick={handleSaveKey} 
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                A chave é salva localmente e usada para validar o uso da extensão em seus navegadores.
              </p>
            </div>
          </div>

          {licenseInfo && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
                  </div>
                  <Badge variant={licenseInfo.status === 'active' ? 'default' : 'destructive'} className="rounded-md">
                    {licenseInfo.status === 'active' ? 'Ativo' : 'Bloqueado'}
                  </Badge>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Layers className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Recursos</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(licenseInfo.max_manual ?? 0) > 0 && <Badge variant="outline" className="text-[10px] h-5">Manual</Badge>}
                    {(licenseInfo.max_turbo ?? 0) > 0 && <Badge variant="outline" className="text-[10px] h-5">Turbo</Badge>}
                    {(licenseInfo.max_agro ?? 0) > 0 && <Badge variant="outline" className="text-[10px] h-5">Agro</Badge>}
                    {!(licenseInfo.max_manual ?? 0) && !(licenseInfo.max_turbo ?? 0) && !(licenseInfo.max_agro ?? 0) && (
                      <span className="text-sm font-bold text-primary">Premium</span>
                    )}
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Validade</span>
                  </div>
                  <p className="text-sm font-bold">
                    {licenseInfo.expires_at ? new Date(licenseInfo.expires_at).toLocaleDateString() : "Indeterminada"}
                  </p>
                </div>

                <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Monitor className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Dispositivos</span>
                  </div>
                  <p className="text-sm font-bold">
                    {(() => {
                      if (Array.isArray(licenseInfo.devices)) return licenseInfo.devices.length;
                      if (typeof licenseInfo.devices === 'number') return licenseInfo.devices;
                      return (licenseInfo.fingerprints || []).length;
                    })()} / {licenseInfo.max_devices ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Vagas ocupadas</p>
                </div>
              </div>

              {/* Detalhes de Uso Avançado se existirem */}
              {((licenseInfo.max_turbo ?? 0) > 0 || (licenseInfo.max_agro ?? 0) > 0) && (
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  {(licenseInfo.max_turbo ?? 0) > 0 && (
                     <div className="bg-muted/10 p-3 rounded-lg border flex justify-between items-center animate-in zoom-in-95 duration-300">
                        <span className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Módulo Turbo
                        </span>
                        <span className="text-sm font-mono font-bold">
                          {licenseInfo.usage_turbo ?? 0} / {licenseInfo.max_turbo ?? 0}
                        </span>
                     </div>
                  )}
                  {(licenseInfo.max_agro ?? 0) > 0 && (
                     <div className="bg-muted/10 p-3 rounded-lg border flex justify-between items-center animate-in zoom-in-95 duration-300">
                        <span className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          Módulo Agro
                        </span>
                        <span className="text-sm font-mono font-bold">
                          {licenseInfo.usage_agro ?? 0} / {licenseInfo.max_agro ?? 0}
                        </span>
                     </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    Computadores Vinculados
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => refreshLicenseInfo(licenseKey)}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                    </Button>
                  </h4>
                </div>
                
                <div className="grid gap-3">
                  {(() => {
                    const devicesList = Array.isArray(licenseInfo.devices) 
                      ? licenseInfo.devices 
                      : (licenseInfo.fingerprints || []).map((fp: string) => ({
                          fingerprint: fp,
                          nome: licenseInfo.device_metadata?.[fp] || "Sem nome"
                        }));

                    if (devicesList.length === 0) {
                      return (
                        <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed text-muted-foreground text-sm">
                          Nenhum computador vinculado atualmente.
                        </div>
                      );
                    }

                    return devicesList.map((device) => (
                      <div 
                        key={device.fingerprint} 
                        className="flex items-center justify-between p-3 rounded-lg bg-card border hover:shadow-sm transition-all animate-in slide-in-from-left-2 duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-primary/5 flex items-center justify-center">
                            <Monitor className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{device.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px] md:max-w-none">
                              {device.fingerprint}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-8"
                          onClick={() => handleDeactivate(device.fingerprint)}
                          disabled={deactivatingFingerprint === device.fingerprint}
                        >
                          {deactivatingFingerprint === device.fingerprint ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          <span className="hidden sm:inline">Desvincular</span>
                        </Button>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Estado Vazio: Nenhuma chave configurada */}
      {!licenseInfo && !licenseKey && !isLoading && (
        <div className="p-10 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-3 bg-muted/5">
          <Puzzle className="h-10 w-10 text-muted-foreground/20" />
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground">Extensão não Configurada</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Insira a chave de licença acima para ativar os recursos de automação e produtividade.
            </p>
          </div>
        </div>
      )}

      {/* Estado de Erro: Chave tentou ser validada mas falhou ou foi removida */}
      {!licenseInfo && licenseKey && validatedKey === licenseKey && !isRefreshing && (
        <div className="p-10 rounded-xl border border-dashed flex flex-col items-center justify-center text-center space-y-3 bg-destructive/5 border-destructive/20">
          <Info className="h-10 w-10 text-destructive/50" />
          <div className="space-y-1">
            <p className="font-bold text-destructive/80">Chave não Validada</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              As informações da licença não puderam ser recuperadas para esta chave. Verifique se ela está correta ou se há conexão com a internet.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refreshLicenseInfo(licenseKey)}>
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}
