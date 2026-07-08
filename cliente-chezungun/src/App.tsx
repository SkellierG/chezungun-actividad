import { useState } from 'react'
import DeviceStorage from './utils/localstorage'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
      <button onClick={() => DeviceStorage.setItem('code', count)}>Save Count</button>
    </div>
  )
}

export default App
