import { useQuery } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { memberService } from '../../services/memberService'
import { MemberRegistrationForm } from '../../types/member.types'
import { MemberModalHeader } from './MemberModalHeader'
import { MemberModalActions } from './MemberModalActions'
import { PrimaryInfoTab } from './tabs/PrimaryInfoTab'
import { ComplementaryInfoTab } from './tabs/ComplementaryInfoTab'
import { Loader2 } from 'lucide-react'

interface MemberDetailsModalProps {
  memberId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string, member: MemberRegistrationForm) => void
  onDelete: (id: string, member: MemberRegistrationForm) => void
  onDocuments: (id: string, member: MemberRegistrationForm) => void
}

export function MemberDetailsModal({
  memberId,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onDocuments,
}: MemberDetailsModalProps) {
  const { data: member, isLoading, error } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => (memberId ? memberService.getMemberById(memberId) : null),
    enabled: !!memberId && open,
  })

  const handleEdit = () => {
    if (memberId && member) onEdit(memberId, member)
  }

  const handleDelete = () => {
    if (memberId && member) onDelete(memberId, member)
  }

  const handleDocuments = () => {
    if (memberId && member) onDocuments(memberId, member)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error || !member ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <h2 className="text-xl font-semibold text-destructive">
              Erro ao carregar dados
            </h2>
            <p className="text-muted-foreground">
              Não foi possível carregar os dados do sócio.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="sr-only">Detalhes do Sócio</DialogTitle>
              <MemberModalHeader member={member} />
            </DialogHeader>

            <Tabs defaultValue="primary" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6">
                <TabsList>
                  <TabsTrigger value="primary">
                    Dados Principais
                  </TabsTrigger>
                  <TabsTrigger value="complementary">
                    Dados Complementares
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden p-6 pt-4 bg-muted/10">
                <TabsContent value="primary" className="h-full m-0 data-[state=active]:flex flex-col">
                  <PrimaryInfoTab member={member} />
                </TabsContent>
                <TabsContent value="complementary" className="h-full m-0 data-[state=active]:flex flex-col">
                  <ComplementaryInfoTab member={member} />
                </TabsContent>
              </div>
            </Tabs>

            <div className="p-6 pt-2 bg-background border-t">
              <MemberModalActions
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDocuments={handleDocuments}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
