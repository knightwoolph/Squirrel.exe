import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastContainer } from './components/common/Toast'
import { GlobalConfetti } from './components/common/Confetti'
import { Dashboard } from './pages/Dashboard'
import { Tasks } from './pages/Tasks'
import { Projects } from './pages/Projects'
import { Contacts } from './pages/Contacts'
import { Deals } from './pages/Deals'
import { VictoryOak } from './pages/VictoryOak'
import { Stash } from './pages/Stash'
import { Settings } from './pages/Settings'
import { Timer } from './pages/Timer'

function App() {
  return (
    <>
      <AppLayout>
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
        </Routes>
      </AppLayout>
      <ToastContainer />
      <GlobalConfetti />
    </>
  )
}

export default App
