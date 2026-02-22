import './App.css'
import { Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth-store'

import Landing from './pages/Landing'
import Signin from './pages/Signin'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import WorkspaceList from './pages/WorkspaceList'
import WorkspaceView from './pages/WorkspaceView'
import BoardView from './pages/BoardView'
import { ProtectedRoute } from './components/ProtectedRoute'

import { Navbar } from './components/Navbar'

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path='/signin' element={<Signin />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/onboarding' element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
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
          <Route
            path='/workspaces/:workspaceId'
            element={
              <ProtectedRoute>
                <WorkspaceView />
              </ProtectedRoute>
            }
          />
          <Route
            path='/boards/:boardId'
            element={
              <ProtectedRoute>
                <BoardView />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  )
}

export default App
