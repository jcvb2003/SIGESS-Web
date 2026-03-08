import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { memberService } from '../../services/memberService'
import { memberQueryKeys } from '../../queryKeys'
import type { MemberListItem } from '../../types/member.types'

export function useMemberActions() {
  const queryClient = useQueryClient()
  const [memberToDelete, setMemberToDelete] = useState<MemberListItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => memberService.deleteMember(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memberQueryKeys.all })
      toast.success('Sócio excluído com sucesso.')
      setIsDeleteDialogOpen(false)
      setMemberToDelete(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Erro ao excluir sócio.'
      toast.error(message)
    },
  })

  const openDeleteDialog = (member: MemberListItem) => {
    setMemberToDelete(member)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setMemberToDelete(null)
    }
  }

  const confirmDelete = async () => {
    if (!memberToDelete) {
      return
    }

    await deleteMutation.mutateAsync(memberToDelete.id)
  }

  return {
    memberToDelete,
    isDeleteDialogOpen,
    isDeleting: deleteMutation.isPending,
    openDeleteDialog,
    handleDeleteDialogChange,
    confirmDelete,
  }
}
