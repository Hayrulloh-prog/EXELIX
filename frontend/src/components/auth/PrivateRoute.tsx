import { Navigate } from 'react-router-dom'
import useStore from '@/store/useStore'

interface PrivateRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function PrivateRoute({ children, adminOnly = false }: PrivateRouteProps) {
  const { isAuthenticated, user } = useStore()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (adminOnly && user?.profileType !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
