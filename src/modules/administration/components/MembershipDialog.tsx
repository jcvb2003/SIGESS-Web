import { useState } from "react";
import type {
  TenantMembershipInput,
  TenantUnitRecord,
  TenantUserRecord,
} from "@/modules/administration/services/administrationService";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface MembershipDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly users: TenantUserRecord[];
  readonly units: TenantUnitRecord[];
  readonly onSubmit: (values: TenantMembershipInput) => Promise<void>;
  readonly isSaving: boolean;
}

export function MembershipDialog({
  open,
  onOpenChange,
  users,
  units,
  onSubmit,
  isSaving,
}: MembershipDialogProps) {
  const [userId, setUserId] = useState("");
  const [unitId, setUnitId] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setUserId("");
          setUnitId("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo acesso</DialogTitle>
          <DialogDescription>
            Vincule um usuario da entidade a um polo desta mesma entidade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="membership-user">Usuario</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="membership-user">
                <SelectValue placeholder="Selecione um usuario" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.userId} value={user.userId}>
                    {user.name || user.email || user.userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership-unit">Polo</Label>
            <Select value={unitId} onValueChange={setUnitId}>
              <SelectTrigger id="membership-unit">
                <SelectValue placeholder="Selecione um polo" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={isSaving || !userId || !unitId}
            onClick={() =>
              void onSubmit({
                userId,
                unitId,
                role: "unit_operator",
                isActive: true,
              })
            }
          >
            Criar acesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
