import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useRef } from 'react'
import { ChildScreen } from './screens/ChildScreen'
import { DemoScreen } from './screens/DemoScreen'
import { FamilyScreen } from './screens/FamilyScreen'
import { GraduationScreen } from './screens/GraduationScreen'
import { MissionCompleteScreen } from './screens/MissionCompleteScreen'
import { ParentScreen } from './screens/ParentScreen'
import { StoryScreen } from './screens/StoryScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { routeDepth, useRoute, type Route } from './nav'

const SCREENS: Record<Exclude<Route, '/demo'>, () => React.JSX.Element> = {
  '/welcome': WelcomeScreen,
  '/child': ChildScreen,
  '/story': StoryScreen,
  '/complete': MissionCompleteScreen,
  '/graduation': GraduationScreen,
  '/parent': ParentScreen,
  '/family': FamilyScreen,
}

// Screen change = 200ms horizontal slide (DESIGN.md Motion). Deeper screens enter from the right.
export function App() {
  const route = useRoute()
  // The demo page frames the other routes, so it skips the phone layout and slide.
  if (route === '/demo') return <DemoScreen />
  return <PhoneApp route={route} />
}

function PhoneApp({ route }: { route: Exclude<Route, '/demo'> }) {
  const prev = useRef(route)
  const dir = routeDepth[route] >= routeDepth[prev.current] ? 1 : -1
  prev.current = route
  const Screen = SCREENS[route]

  return (
    <MotionConfig reducedMotion="user">
      <div className="overflow-x-clip">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={route}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: `${d * 100}%` }),
              center: { x: 0 },
              exit: (d: number) => ({ x: `${d * -100}%` }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
