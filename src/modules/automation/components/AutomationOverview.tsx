import { Bot, Clock3, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const AUTOMATION_PILLARS = [
  {
    title: "Rotinas programadas",
    description:
      "Centralize tarefas recorrentes, agendamentos operacionais e execuções em lote em um único lugar.",
    icon: Clock3,
  },
  {
    title: "Fluxos documentados",
    description:
      "Mantenha regras, etapas e responsáveis visíveis antes de automatizar processos sensíveis do sistema.",
    icon: FileText,
  },
  {
    title: "Execução assistida",
    description:
      "Prepare ações com validações e checkpoints para reduzir erros em operações administrativas.",
    icon: Bot,
  },
  {
    title: "Governança",
    description:
      "Estruture permissões, auditoria e critérios de segurança para automações futuras.",
    icon: ShieldCheck,
  },
];

export function AutomationOverview() {
  return (
    <div className="grid gap-6">
      <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Espaço inicial do módulo de Automação
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Este módulo foi preparado para concentrar automações operacionais do SIGESS.
              A base já está pronta para receber fluxos, jobs, integrações e painéis específicos
              sem fugir da arquitetura atual do projeto.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {AUTOMATION_PILLARS.map((pillar) => (
          <Card key={pillar.title} className="border-border/60 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <pillar.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{pillar.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {pillar.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
