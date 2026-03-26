import { SetPasswordForm } from "@/modules/auth/components/SetPasswordForm";

export default function PasswordPage() {
  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 relative bg-[url('/LoginCanoa.jpg')] bg-cover bg-center bg-no-repeat"
    >
      <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm z-0"></div>
      
      <div className="w-full max-w-md relative z-10 transition-all duration-500 ease-out transform">
        <SetPasswordForm />
      </div>
    </div>
  );
}
