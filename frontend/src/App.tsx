import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResultPage from './pages/ResultPage'
import BarcodePage from './pages/BarcodePage'
import MapPage from './pages/MapPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/barcode" element={<BarcodePage />} />
        <Route path="/map" element={<MapPage />} />
      </Route>
    </Routes>
  )
}
