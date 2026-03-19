import { ReactNode } from "react";
import { AnimatedSeaBackground } from "./AnimatedSeaBackground";
interface AuthLayoutProps {
  children: ReactNode;
}
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <AnimatedSeaBackground />

      <div className="relative z-10 w-full max-w-[420px] px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}
