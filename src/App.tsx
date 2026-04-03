import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastContainer } from './components/common/Toast'
import { GlobalConfetti } from './components/common/Confetti'
import { CommandPalette } from './components/common/CommandPalette'
import { QuickStash } from './components/common/QuickStash'

// Lazy-loaded pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Tasks = lazy(() => import('./pages/Tasks').then(m => ({ default: m.Tasks })))
const Projects = lazy(() => import('./pages/Projects').then(m => ({ default: m.Projects })))
const Contacts = lazy(() => import('./pages/Contacts').then(m => ({ default: m.Contacts })))
const Deals = lazy(() => import('./pages/Deals').then(m => ({ default: m.Deals })))
const VictoryOak = lazy(() => import('./pages/VictoryOak').then(m => ({ default: m.VictoryOak })))
const Stash = lazy(() => import('./pages/Stash').then(m => ({ default: m.Stash })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const Timer = lazy(() => import('./pages/Timer').then(m => ({ default: m.Timer })))
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <AppLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/victory-oak" element={<VictoryOak />} />
            <Route path="/stash" element={<Stash />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AppLayout>
      <CommandPalette />
      <QuickStash />
      <ToastContainer />
      <GlobalConfetti />
    </>
  )
}

export default App
