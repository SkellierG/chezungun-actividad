import { useState, useEffect } from 'react'
import AdminScreen from './screens/AdminScreen' 

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false)

    return (
      <div>
        <AdminScreen />
      </div>
    )
}