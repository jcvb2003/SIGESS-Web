import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/shared/components/ui/button';
import { WifiOff, RefreshCw, X, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useEffect, useState } from 'react';

export function PWABanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    globalThis.addEventListener('online', handleOnline);
    globalThis.addEventListener('offline', handleOffline);

    return () => {
      globalThis.removeEventListener('online', handleOnline);
      globalThis.removeEventListener('offline', handleOffline);
    };
  }, []);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh && !isOffline) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] flex flex-col gap-3 animate-in slide-in-from-bottom-5 duration-300",
    )}>
      {isOffline && (
        <div className="bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg border border-destructive/20 flex items-center gap-3">
          <WifiOff className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold">Você está offline</p>
            <p className="text-xs opacity-90">Verifique sua conexão. O sistema continuará funcionando com dados em cache.</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-destructive-foreground hover:bg-white/20"
            onClick={() => setIsOffline(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {offlineReady && !isOffline && (
        <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg border border-primary/20 flex items-center gap-3">
          <ArrowUpCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold">Pronto para uso offline</p>
            <p className="text-xs opacity-90">O sistema foi baixado e pode ser usado sem internet.</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-primary-foreground hover:bg-white/20"
            onClick={() => setOfflineReady(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {needRefresh && (
        <div className="bg-primary text-primary-foreground p-4 rounded-lg shadow-lg border border-primary/20 flex items-center gap-3">
          <RefreshCw className="h-5 w-5 shrink-0 animate-spin-slow" />
          <div className="flex-1">
            <p className="text-sm font-bold">Nova versão disponível</p>
            <p className="text-xs opacity-90">Uma atualização foi baixada. Clique para aplicar as melhorias.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 text-xs font-bold"
              onClick={() => updateServiceWorker(true)}
            >
              Atualizar
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-primary-foreground hover:bg-white/20"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
