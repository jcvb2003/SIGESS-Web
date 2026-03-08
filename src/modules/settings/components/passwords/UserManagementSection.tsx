import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { KeyRound, UserMinus } from 'lucide-react'
import { useAuth } from '@/modules/auth/context/authContextStore'

export function UserManagementSection() {
  const { user } = useAuth()

  const users =
    user && user.email
      ? [
          {
            id: user.id,
            email: user.email,
            role: 'admin',
            createdAt: user.created_at ?? '',
          },
        ]
      : []

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Usuários do Sistema</CardTitle>
        <CardDescription>
          Gerencie contas de acesso, redefina senhas e desative usuários quando necessário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 border-t border-border/10">
        <div className="rounded-md border border-border/60 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="px-4 py-2">Usuário</TableHead>
                <TableHead className="px-4 py-2">Email</TableHead>
                <TableHead className="px-4 py-2">Perfil</TableHead>
                <TableHead className="px-4 py-2">Status</TableHead>
                <TableHead className="px-4 py-2 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell className="px-4 py-4 text-sm text-muted-foreground" colSpan={5}>
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="px-4 py-2 text-sm font-medium">
                      {user.email.split('@')[0]}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                      {user.role}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <KeyRound className="h-4 w-4" />
                          Redefinir Senha
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/40"
                        >
                          <UserMinus className="h-4 w-4" />
                          Desativar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">Exibe o usuário atualmente autenticado no sistema.</p>
      </CardContent>
    </Card>
  )
}
