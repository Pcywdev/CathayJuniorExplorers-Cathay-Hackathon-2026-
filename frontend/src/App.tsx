import { MotionConfig } from 'framer-motion'
import { ChildScreen } from './screens/ChildScreen'
import { ParentScreen } from './screens/ParentScreen'

// Two routes only, so a pathname switch is enough (no router dependency).
export function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  const screen = path === '/parent' ? <ParentScreen /> : <ChildScreen />

  return <MotionConfig reducedMotion="user">{screen}</MotionConfig>
}
