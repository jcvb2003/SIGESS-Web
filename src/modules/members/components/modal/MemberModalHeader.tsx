import { MemberRegistrationForm } from '../../types/member.types'
import { MemberStatusBadge } from '../MemberStatusBadge'
import { User, Loader2 } from 'lucide-react'
import { usePhotoManager } from '../../hooks/registration/usePhotoManager'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'

interface MemberModalHeaderProps {
  member: MemberRegistrationForm
}

export function MemberModalHeader({ member }: MemberModalHeaderProps) {
  const { photoUrl, isLoading } = usePhotoManager({ 
    cpf: member.cpf,
    initialPhotoUrl: member.fotos?.[0]?.url 
  })

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const AvatarContent = (
    <div className={`relative h-20 w-[3.75rem] sm:h-24 sm:w-[4.5rem] rounded-md border-2 border-border overflow-hidden bg-muted flex items-center justify-center shrink-0 shadow-sm ${photoUrl ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}>
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : photoUrl ? (
        <img 
          src={photoUrl} 
          alt={member.nome} 
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <User className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
          <span className="text-sm sm:text-base font-bold">
            {getInitials(member.nome)}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-4 pb-6 border-b">
      <Dialog>
        {photoUrl ? (
          <DialogTrigger asChild>
            {AvatarContent}
          </DialogTrigger>
        ) : (
          AvatarContent
        )}
        
        {photoUrl && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Foto de {member.nome}</DialogTitle>
              <DialogDescription>
                Visualização ampliada da foto de perfil.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center p-2">
              <img 
                src={photoUrl} 
                alt={`Foto de ${member.nome}`}
                className="max-h-[80vh] w-full object-contain rounded-md"
              />
            </div>
          </DialogContent>
        )}
      </Dialog>

      <div className="flex flex-col items-center sm:items-start sm:justify-between gap-2 sm:gap-0 flex-1 text-center sm:text-left py-1">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-none">{member.nome}</h2>
          <MemberStatusBadge status={member.situacao} />
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1 w-full">
          <p className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-medium text-foreground">Matrícula:</span> 
            {member.codigoDoSocio}
          </p>
          <p className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-medium text-foreground">CPF:</span> 
            {member.cpf}
          </p>
        </div>
      </div>
    </div>
  )
}
