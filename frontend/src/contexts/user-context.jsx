import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { toast } from "sonner";

export const UserContext = createContext(); 

export function UserProvider({ children }) {
  const { user: auth0User, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🔄 Running useEffect for auth0User update");
    console.log("👉 isAuthenticated:", isAuthenticated);
    console.log("👉 auth0User:", auth0User);

    if (isAuthenticated && auth0User) {
      setUser(auth0User);
      setLoading(false);
      console.log("✅ User set in state:", auth0User);
    }
  }, [isAuthenticated, auth0User]);

  const updateProfile = useCallback(
    async (profileData) => {
      setLoading(true);
      try {
        const token = await getAccessTokenSilently();
        setUser((prev) => ({
          ...prev,
          profile: {
            ...prev?.profile,
            ...profileData,
          },
        }));

        toast.success("Success", {
          description: "Profile updated successfully",
        });
        return true;
      } catch (err) {
        setError(err.message);
        toast.error("Error", {
          description: "Failed to update profile",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAccessTokenSilently]
  );

  return (
    <UserContext.Provider value={{ user, loading, error, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
