// src/contexts/auth-context.jsx
import { createContext, useContext, useEffect } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { useNavigate } from "react-router-dom"

export const AuthenticationContext = createContext()

export function AuthenticationProvider({ children }) {
  const auth0 = useAuth0()
  const navigate = useNavigate()

  useEffect(() => {
    const { isAuthenticated, logout } = auth0
    const enhancedLogout = () => {
      logout({
        returnTo: window.location.origin,
      })
      navigate("/")
    }

    if (isAuthenticated) {
      auth0.logout = enhancedLogout
    }
  }, [auth0, navigate])

  return (
    <AuthenticationContext.Provider value={auth0}>
      {children}
    </AuthenticationContext.Provider>
  )
}

export const useAuthentication = () => useContext(AuthenticationContext)