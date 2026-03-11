import './App.css';
import { Route, Routes } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';

import { useAuthStore } from './store/auth-store';
import Loading from './pages/Loading';

const Landing = lazy(() => import('./pages/Landing'));
const Signin = lazy(() => import('./pages/Signin'));
const Signup = lazy(() => import('./pages/Signup'));
const BoardView = lazy(() => import('./pages/BoardView'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WorkspaceList = lazy(() => import('./pages/WorkspaceList'));
const WorkspaceView = lazy(() => import('./pages/WorkspaceView'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
import { ProtectedRoute } from './components/ProtectedRoute';

import { Navbar } from './components/Navbar';
import { Toaster } from './components/ui/sonner';
import { SocketProvider } from './components/SocketProvider';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <SocketProvider>
        <Navbar />
        <div className="flex-1">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspaces"
                element={
                  <ProtectedRoute>
                    <WorkspaceList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspaces/:workspaceId"
                element={
                  <ProtectedRoute>
                    <WorkspaceView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/boards/:boardId"
                element={
                  <ProtectedRoute>
                    <BoardView />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
        <Toaster />
      </SocketProvider>
    </div>
  );
}

export default App;
