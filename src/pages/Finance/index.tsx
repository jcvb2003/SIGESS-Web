import { Settings } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center -mt-4 -mx-4 md:-mx-8 lg:-mx-10 overflow-hidden relative">
      <div className="absolute inset-0 z-0 bg-slate-950/40 backdrop-blur-md" />
      
      <div className="relative z-10 max-w-lg w-full px-4">
        <div className="relative overflow-hidden rounded-[3rem] bg-white/5 p-px shadow-2xl animate-in fade-in zoom-in duration-700">
          {/* Decorative elements */}
          <div className="absolute inset-x-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="relative rounded-[2.9rem] bg-slate-900/95 px-8 py-16 text-center backdrop-blur-3xl">
            <div className="mb-10 inline-flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-emerald-500/10 shadow-inner border border-emerald-500/20">
              <div className="relative h-14 w-14">
                <Settings className="h-14 w-14 text-emerald-400 opacity-20 animate-spin absolute inset-0 [animation-duration:10s]" />
                <Settings className="h-14 w-14 text-emerald-500 relative z-10 animate-pulse" />
              </div>
            </div>
            
            <h2 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
              Em Desenvolvimento
            </h2>
            
            <p className="mx-auto max-w-[340px] text-lg leading-relaxed text-slate-400 font-medium">
              Estamos reconstruindo o ecossistema financeiro para trazer mais potência e transparência para sua gestão.
            </p>
            
            <div className="mt-14 flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/40" />
              <div className="flex gap-2.5">
                <div className="h-3 w-3 animate-bounce rounded-full bg-emerald-500" style={{ animationDelay: '0ms' }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-emerald-500/60" style={{ animationDelay: '200ms' }} />
                <div className="h-3 w-3 animate-bounce rounded-full bg-emerald-500/30" style={{ animationDelay: '400ms' }} />
              </div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/40" />
            </div>
            
            {/* Background Glows */}
            <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[120px]" />
            <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-emerald-600/10 blur-[120px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
