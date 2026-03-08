import { Suspense, lazy } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/modules/auth/context/authContextStore'
import { Loader2 } from 'lucide-react'
import { RouteError } from '@/shared/components/feedback/RouteError'

import { DashboardLayout } from '@/shared/components/layout/DashboardLayout'

const LoginPage = lazy(() => import('@/pages/Login'))
const DashboardPage = lazy(() => import('@/pages/Dashboard'))
const MembersPage = lazy(() => import('@/pages/Members'))
const MemberDetailsPage = lazy(() => import('@/pages/Members/MemberDetailsPage'))
const RegistrationPage = lazy(() => import('@/pages/Registration'))
const DocumentsPage = lazy(() => import('@/pages/Documents'))
const ReportsPage = lazy(() => import('@/pages/Reports'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const NotFoundPage = lazy(() => import('@/pages/NotFound'))

function PrivateRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return session ? <DashboardLayout /> : <Navigate to="/auth" replace />
}

function PublicRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return !session ? <Outlet /> : <Navigate to="/dashboard" replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    element: <PublicRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/auth',
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <PrivateRoute />,
    errorElement: <RouteError />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/members',
        element: <MembersPage />,
      },
      {
        path: '/members/:id',
        element: <MemberDetailsPage />,
      },
      {
        path: '/registration',
        element: <RegistrationPage />,
      },
      {
        path: '/documents',
        element: <DocumentsPage />,
      },
      {
        path: '/reports',
        element: <ReportsPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RouterProvider router={router} />
    </Suspense>
  )
}
