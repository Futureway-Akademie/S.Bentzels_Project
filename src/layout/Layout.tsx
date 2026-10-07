import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Footer from './Footer'
import Header from './Header'

export default function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
