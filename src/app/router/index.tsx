import { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "@/modules/auth/context/authContextStore";
import { Loader2 } from "lucide-react";
import { RouteError } from "@/shared/components/feedback/RouteError";
import { DashboardLayout } from "@/shared/components/layout/DashboardLayout";
import { TenantAdministrationLayout } from "@/shared/components/layout/TenantAdministrationLayout";
import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
const LoginPage = lazy(() => import("@/pages/Login"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const MembersPage = lazy(() => import("@/pages/Members"));
const CoordinatorsPage = lazy(() => import("@/pages/Coordinators"));
const MemberDetailsPage = lazy(
  () => import("@/pages/Members/MemberDetailsPage"),
);
const RegistrationPage = lazy(() => import("@/pages/Registration"));
const DocumentsPage = lazy(() => import("@/pages/Documents"));
const FinancePage = lazy(() => import("@/pages/Finance"));
const PaymentsByPeriodPage = lazy(
  () => import("@/pages/Finance/PaymentsByPeriodPage"),
);
const ExternalChargesPage = lazy(
  () => import("@/pages/Finance/ExternalChargesPage"),
);
const DAEsByPeriodPage = lazy(
  () => import("@/pages/Finance/DAEsByPeriodPage"),
);
const ReportsPage = lazy(() => import("@/pages/Reports"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const PasswordPage = lazy(() => import("@/pages/Password"));
const FotoUploadPage = lazy(() => import("@/pages/FotoUpload"));
const RequirementsPage = lazy(() => import("@/pages/Requirements"));
const ReapPage = lazy(() => import("@/pages/Reap"));
const AutomationPage = lazy(() => import("@/pages/Automation"));
const AdministrationPage = lazy(() => import("@/pages/Administration"));
const MemberFichaPage = lazy(() => import("@/pages/Members/MemberFichaPage"));
const MemberCardPage = lazy(() => import("@/pages/Members/MemberCardPage"));
const SelectUnitPage = lazy(() => import("@/pages/SelectUnit"));
const SubscriptionPage = lazy(() => import("@/pages/Subscription"));
const PaymentPortalPage = lazy(() => import("@/pages/PaymentPortal"));

function PublicRoute() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return session ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/foto-upload",
    element: <FotoUploadPage />,
  },
  {
    path: "/pay/:token",
    element: <PaymentPortalPage />,
  },
  {
    path: "/ficha-socio/:id",
    element: <MemberFichaPage />,
  },
  {
    path: "/carteirinha/:id",
    element: <MemberCardPage />,
  },
  // Rota independente: sem guard de sessão.
  // O token chega via hash da URL — não pode estar sob PublicRoute
  // pois o Supabase criaria sessão automaticamente e redirecionaria para /dashboard.
  {
    path: "/password",
    element: <PasswordPage />,
    errorElement: <RouteError />,
  },
  {
    element: <PublicRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/auth",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <TenantAdministrationLayout />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/administration",
        element: <AdministrationPage />,
      },
    ],
  },
  {
    element: <DashboardLayout />,
    errorElement: <RouteError />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/select-unit",
        element: <SelectUnitPage />,
      },
      {
        path: "/members",
        element: <MembersPage />,
      },
      {
        path: "/coordinators",
        element: <CoordinatorsPage />,
      },
      {
        path: "/members/:id",
        element: <MemberDetailsPage />,
      },
      {
        path: "/registration",
        element: <RegistrationPage />,
      },
      {
        path: "/documents",
        element: <DocumentsPage />,
      },
      {
        path: "/finance",
        element: <FinancePage />,
      },
      {
        path: "/finance/payments-report",
        element: <PaymentsByPeriodPage />,
      },
      {
        path: "/finance/external-charges",
        element: <ExternalChargesPage />,
      },
      {
        path: "/finance/daes-report",
        element: <DAEsByPeriodPage />,
      },
      {
        path: "/reports",
        element: <ReportsPage />,
      },
      {
        path: "/requirements",
        element: <RequirementsPage />,
      },
      {
        path: "/reap",
        element: <ReapPage />,
      },
      {
        path: "/automation",
        element: <AutomationPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
      {
        path: "/subscription",
        element: <SubscriptionPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
}
