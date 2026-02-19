import './App.css'
import { Route, Routes } from 'react-router-dom'

import Landing from './pages/Landing'
import Signin from './pages/Signin'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import WorkspaceList from './pages/WorkspaceList'
import { ProtectedRoute } from './components/ProtectedRoute'
import Navbar from './components/Navbar'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path='/signin' element={<Signin />} />
        <Route path='/signup' element={<Signup />} />
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path='/workspaces'
          element={
            <ProtectedRoute>
              <WorkspaceList />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

export default App
