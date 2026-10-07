import { Route, Routes } from 'react-router-dom'
import DesignSystem from './pages/DesignSystem'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/design-system" element={<DesignSystem />} />
    </Routes>
  )
}
