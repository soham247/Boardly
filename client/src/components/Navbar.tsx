import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import { Button } from './ui/button'
import { Avatar } from './ui/avatar'
import { Badge } from './ui/badge'
import { Menu, X, LogOut, User, LayoutDashboard, FolderOpen } from 'lucide-react'
import { cn } from '../lib/utils'

function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect even if logout fails
      navigate('/')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isPremium = user?.tier === 'Premium'

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">B</span>
          </div>
          <span className="text-xl font-bold">Boarda</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center space-x-1 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/workspaces"
                className="flex items-center space-x-1 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground"
              >
                <FolderOpen className="h-4 w-4" />
                <span>Workspaces</span>
              </Link>

              {/* User Section */}
              <div className="flex items-center space-x-3 border-l pl-4 ml-2">
                <div className="flex items-center space-x-2">
                  <Avatar
                    fallback={user?.fullName ? getInitials(user.fullName) : 'U'}
                    className="h-9 w-9"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user?.fullName}</span>
                    <Badge
                      variant={isPremium ? 'premium' : 'secondary'}
                      className="mt-0.5 h-5 w-fit text-[10px]"
                    >
                      {user?.tier}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="mr-1 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link to="/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'border-t md:hidden',
          isMobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div className="container mx-auto space-y-4 px-4 py-4">
          {isAuthenticated ? (
            <>
              {/* User Info */}
              <div className="flex items-center space-x-3 border-b pb-4">
                <Avatar
                  fallback={user?.fullName ? getInitials(user.fullName) : 'U'}
                  className="h-10 w-10"
                />
                <div className="flex flex-col">
                  <span className="font-medium">{user?.fullName}</span>
                  <Badge
                    variant={isPremium ? 'premium' : 'secondary'}
                    className="mt-0.5 h-5 w-fit text-[10px]"
                  >
                    {user?.tier}
                  </Badge>
                </div>
              </div>

              {/* Mobile Links */}
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/workspaces"
                className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FolderOpen className="h-4 w-4" />
                <span>Workspaces</span>
              </Link>

              {/* Logout Button */}
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <div className="flex flex-col space-y-2">
              <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
