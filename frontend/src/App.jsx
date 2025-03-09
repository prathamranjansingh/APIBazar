import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useEffect, lazy, Suspense } from "react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider, useUser } from "./contexts/user-context"
import { AuthenticationProvider } from "./contexts/auth-context"
import { useAuth0 } from "@auth0/auth0-react"
import Layout from "./components/layout"
import Loading from "./components/ui/loading"

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"))
const Dashboard = lazy(() => import("./pages/dashboard"))
const ApisList = lazy(() => import("./pages/apis-list"))
const CreateApi = lazy(() => import("./pages/create-api"))
const ApiDetail = lazy(() => import("./pages/api-detail"))
const Analytics = lazy(() => import("./pages/analytics"))
// const MarketPlace = lazy(() => import("./pages/marketplace"))
// const Profile = lazy(() => import("./pages/profile"))

function ProtectedRoute({ children }) {
  const { user, loading } = useUser()
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const location = useLocation()

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      loginWithRedirect({
        appState: { returnTo: location.pathname },
      })
    }
  }, [loading, isAuthenticated, loginWithRedirect, location])

  if (loading) {
    return <Loading />
  }

  return isAuthenticated ? children : null
}

/**
 * Main App component
 * Sets up routing and global providers
 */
function App() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <ThemeProvider defaultTheme="system" storageKey="api-marketplace-theme">
        <AuthenticationProvider>
          <UserProvider>
            <main className="flex-grow">
              <Suspense fallback={<Loading />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  {/* <Route path="/marketplace" element={<MarketPlace />} /> */}

                  {/* Protected routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Dashboard />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/apis"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ApisList />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/apis/create"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <CreateApi />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/apis/:id"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ApiDetail />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/apis/:id/edit"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <CreateApi isEditing />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Analytics />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  {/* <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    }
                  /> */}

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            <Toaster position="top-right" />
          </UserProvider>
        </AuthenticationProvider>
      </ThemeProvider>
    </div>
  )
}

export default App