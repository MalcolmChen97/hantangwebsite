import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth-context'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import TodaySchedulePage from './pages/TodaySchedulePage'
import PatientRecordsPage from './pages/PatientRecordsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import VisitFormPage from './pages/VisitFormPage'
import VisitDetailPage from './pages/VisitDetailPage'
import CalendarPage from './pages/CalendarPage'
import SignaturePage from './pages/SignaturePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell>
            <Routes>
              <Route path="/" element={<TodaySchedulePage />} />
              <Route path="/patients" element={<PatientRecordsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="/visits/new" element={<VisitFormPage />} />
              <Route path="/visits/:id" element={<VisitDetailPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/signature/:type" element={<SignaturePage />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
