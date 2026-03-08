
import { ExternalLink } from 'lucide-react'

export function MemberExternalRefsSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Links Externos</h3>
      <div className="flex flex-col gap-2">
        <a 
            href="https://meu.inss.gov.br/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
        >
            <ExternalLink className="h-4 w-4" />
            Acessar Meu INSS
        </a>
        <a 
            href="https://www.gov.br/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
        >
            <ExternalLink className="h-4 w-4" />
            Acessar Gov.br
        </a>
      </div>
    </div>
  )
}
