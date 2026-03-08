import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { LucideIcon } from "lucide-react"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { cn } from "@/shared/lib/utils"

export type StatCardVariant = "primary" | "secondary" | "accent" | "info" | "default"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  loading?: boolean
  className?: string
  variant?: StatCardVariant
}

const variants = {
  default: {
    bg: "bg-card",
    text: "text-foreground",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    border: "border-border"
  },
  primary: { // Mountain Meadow
    bg: "bg-[hsl(var(--primary))]/5",
    text: "text-[hsl(var(--primary))]",
    iconBg: "bg-[hsl(var(--primary))]/10",
    iconColor: "text-[hsl(var(--primary))]",
    border: "border-[hsl(var(--primary))]/20"
  },
  secondary: { // Bangladesh Green
    bg: "bg-[hsl(var(--secondary))]/5",
    text: "text-[hsl(var(--secondary))]",
    iconBg: "bg-[hsl(var(--secondary))]/10",
    iconColor: "text-[hsl(var(--secondary))]",
    border: "border-[hsl(var(--secondary))]/20"
  },
  accent: { // Caribbean Green
    bg: "bg-[hsl(var(--accent))]/5",
    text: "text-[hsl(var(--accent))]",
    iconBg: "bg-[hsl(var(--accent))]/10",
    iconColor: "text-[hsl(var(--accent))]",
    border: "border-[hsl(var(--accent))]/20"
  },
  info: {
    bg: "bg-blue-500/5",
    text: "text-blue-600",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    border: "border-blue-500/20"
  }
}

export function StatCard({ title, value, icon: Icon, description, loading, className, variant = "default" }: StatCardProps) {
  const styles = variants[variant]

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg border group",
      styles.bg,
      styles.border,
      className
    )}>
      {/* Background Pattern/Watermark */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.03] transform rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
        <Icon className={cn("h-32 w-32", styles.text)} />
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110",
          styles.iconBg,
          styles.iconColor
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-2">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-24 bg-muted/50" />
            <Skeleton className="h-4 w-32 bg-muted/50" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className={cn("text-3xl font-bold tracking-tight", styles.text)}>
              {value}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
