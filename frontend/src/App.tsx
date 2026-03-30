import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { LangProvider, hasSelectedLang } from './lib/LangContext'
import SplashPage from './pages/SplashPage'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import ResultPage from './pages/ResultPage'
import BarcodePage from './pages/BarcodePage'
import MapPage from './pages/MapPage'
import TranslatePage from './pages/TranslatePage'

export default function App() {
  const [showSplash, setShowSplash] = useState(() => !hasSelectedLang())

  return (
    <LangProvider>
      {showSplash ? (
        <SplashPage onDone={() => setShowSplash(false)} />
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/barcode" element={<BarcodePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/translate" element={<TranslatePage />} />
          </Route>
        </Routes>
      )}
    </LangProvider>
  )
}
