import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import AdminHome from './AdminHome'
import AdminLogin from './AdminLogin'
import { AuthProvider } from './AuthProvider'

// Der Admin-Bereich wird nur bei Bedarf geladen und nicht von Suchmaschinen erfasst.
export default function AdminRoutes() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      meta.remove()
    }
  }, [])

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route index element={<AdminHome />} />
        <Route path="*" element={<AdminHome />} />
      </Routes>
    </AuthProvider>
  )
}
