import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { SmoothScroll } from './components/SmoothScroll'
import { ROUTES } from './constants/site'
import { OrbitProvider } from './context/OrbitProvider'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import { AboutPage } from './pages/AboutPage'
import { CleanupPage } from './pages/CleanupPage'
import { DeorbitPage } from './pages/DeorbitPage'
import { HomePage } from './pages/HomePage'
import { LawPage } from './pages/LawPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProblemPage } from './pages/ProblemPage'
import { SolutionPage } from './pages/SolutionPage'
import { TrafficPage } from './pages/TrafficPage'
import { scrollToTop } from './utils/scroll'

/** The research page carries the full benchmark data, so it is loaded only when someone opens it. */
const ResearchPage = lazy(() => import('./pages/ResearchPage').then((m) => ({ default: m.ResearchPage })))

/** Every page opens at its top, unless the link points at a section (#pledge). */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    scrollToTop()
  }, [pathname, hash])
  return null
}

function AppShell() {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-ink text-white">
      <a href="#main" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-full bg-flare px-5 py-2.5 text-sm font-semibold text-ink transition-transform focus:translate-y-0">
        {t.common.skip}
      </a>
      <SmoothScroll />
      <ScrollToTop />
      <Header />
      <Sidebar />
      <div className="lg:pr-[var(--sidebar-offset)]">
        <main id="main">
          <Routes>
            <Route path={ROUTES.home} element={<HomePage />} />
            <Route path={ROUTES.problem} element={<ProblemPage />} />
            <Route path={ROUTES.solution} element={<SolutionPage />} />
            <Route path={ROUTES.deorbit} element={<DeorbitPage />} />
            <Route path={ROUTES.cleanup} element={<CleanupPage />} />
            <Route path={ROUTES.traffic} element={<TrafficPage />} />
            <Route path={ROUTES.law} element={<LawPage />} />
            <Route
              path={ROUTES.research}
              element={
                <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
                  <ResearchPage />
                </Suspense>
              }
            />
            <Route path={ROUTES.about} element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <OrbitProvider>
        <AppShell />
      </OrbitProvider>
    </LanguageProvider>
  )
}

export default App
