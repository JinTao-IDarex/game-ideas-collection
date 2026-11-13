import { Routes, Route } from 'react-router'
import ModeHome from './pages/ModeHome'
import Home from './pages/Home'
import DriverPage from './pages/DriverPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ModeHome />} />
      <Route path="/passenger" element={<Home />} />
      <Route path="/driver" element={<DriverPage />} />
    </Routes>
  )
}
