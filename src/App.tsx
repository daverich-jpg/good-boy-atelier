import { useEffect } from 'react'
import { Redirect, useRoute, useToast } from './components/ui'
import { Home } from './screens/Home'
import { NewCommission } from './screens/NewCommission'
import { Review } from './screens/Review'
import { Details, Settings } from './screens/Settings'
import { Welcome } from './screens/Welcome'
import { useStore } from './state/store'

export function App() {
  const route = useRoute()
  const { state } = useStore()
  const [toast, setToast] = useToast()
  const has = !!state.commission

  useEffect(() => {
    const n = state.commission?.dog.name
    document.title = n ? `${n}’s sculpture · Good Boy Atelier` : 'Good Boy Atelier'
  }, [state.commission?.dog.name])

  let screen
  if (route === '/new') screen = has ? <Redirect to="/home" /> : <NewCommission onToast={setToast} />
  else if (!has) screen = route === '/' ? <Welcome /> : <Redirect to="/" />
  else if (route === '/review') screen = <Review onToast={setToast} />
  else if (route === '/settings') screen = <Settings onToast={setToast} />
  else if (route === '/details') screen = <Details onToast={setToast} />
  else screen = route === '/home' ? <Home onToast={setToast} /> : <Redirect to="/home" />

  return (
    <div className="app">
      {screen}
      {toast}
    </div>
  )
}
