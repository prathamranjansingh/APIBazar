"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { toast } from "sonner"
import { useAuth0 } from "@auth0/auth0-react"

const ApiContext = createContext()

export function ApiProvider({ children }) {
  const [apis, setApis] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { getAccessTokenSilently } = useAuth0()

  const fetchApis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:5000/api")
      if (!response.ok) {
        throw new Error("Failed to fetch APIs")
      }
      const data = await response.json()
      setApis(data)
    } catch (err) {
      setError(err.message)
      toast.error("Error", {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchApiById = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:5000/api/${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch API details")
      }
      return await response.json()
    } catch (err) {
      setError(err.message)
      toast.error("Error", {
        description: err.message,
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createApi = useCallback(
    async (apiData) => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAccessTokenSilently()
        const response = await fetch("http://localhost:5000/api/createApi", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to create API")
        }

        const newApi = await response.json()
        setApis((prev) => [...prev, newApi])
        toast.success("Success", {
          description: "API created successfully",
        })
        return newApi
      } catch (err) {
        setError(err.message)
        toast.error("Error", {
          description: err.message,
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [getAccessTokenSilently],
  )

  const addEndpoint = useCallback(
    async (endpointData) => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAccessTokenSilently()
        const response = await fetch("http://localhost:5000/endpoint/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(endpointData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to add endpoint")
        }

        const newEndpoint = await response.json()
        toast.success("Success", {
          description: "Endpoint added successfully",
        })
        return newEndpoint
      } catch (err) {
        setError(err.message)
        toast.error("Error", {
          description: err.message,
        })
        return null
      } finally {
        setLoading(false)
      }
    },
    [getAccessTokenSilently],
  )

  const deleteEndpoint = useCallback(
    async (endpointId) => {
      setLoading(true)
      setError(null)
      try {
        const token = await getAccessTokenSilently()
        const response = await fetch(`http://localhost:5000/endpoint/${endpointId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to delete endpoint")
        }

        toast.success("Success", {
          description: "Endpoint deleted successfully",
        })
        return true
      } catch (err) {
        setError(err.message)
        toast.error("Error", {
          description: err.message,
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [getAccessTokenSilently],
  )

  const fetchEndpoints = useCallback(async (apiId) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:5000/endpoint/${apiId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch endpoints")
      }
      return await response.json()
    } catch (err) {
      setError(err.message)
      toast.error("Error", {
        description: err.message,
      })
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <ApiContext.Provider
      value={{
        apis,
        loading,
        error,
        fetchApis,
        fetchApiById,
        createApi,
        addEndpoint,
        deleteEndpoint,
        fetchEndpoints,
      }}
    >
      {children}
    </ApiContext.Provider>
  )
}

export const useApi = () => useContext(ApiContext)

