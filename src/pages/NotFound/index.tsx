import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
        <span className="text-3xl font-bold">404</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        Página não encontrada
      </h1>
      <p className="max-w-md text-sm md:text-base text-muted-foreground">
        A página que você tentou acessar não existe ou não está mais disponível.
      </p>
      <Link
        to="/dashboard"
        className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
      >
        Voltar para o início
      </Link>
    </div>
  )
}
