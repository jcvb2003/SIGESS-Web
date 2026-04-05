import { SetPasswordForm } from "@/modules/auth/components/SetPasswordForm";
import { AuthLayout } from "@/modules/auth/components/AuthLayout";

export default function PasswordPage() {
  return (
    <AuthLayout>
      <SetPasswordForm />
    </AuthLayout>
  );
}
