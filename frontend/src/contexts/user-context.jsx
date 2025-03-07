// UserContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const { user: auth0User, isAuthenticated, getAccessTokenSilently, isLoading: auth0Loading } = useAuth0();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fix 2: Make sure syncUser is defined before it's called
  const syncUser = useCallback(async () => {
    if (isAuthenticated && auth0User) {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const response = await axios.patch(
          `${API_BASE_URL}/users/me`,
          {
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser({ ...auth0User, ...response.data });
      } catch (err) {
        console.error("Error syncing user:", err);
        setError(err.message);
        setUser(auth0User);
      } finally {
        setLoading(false);
      }
    } else if (!auth0Loading) {
      setUser(null);
      setLoading(false);
    }
  }, [isAuthenticated, auth0User, auth0Loading, getAccessTokenSilently]);

  // Fix 3: Call syncUser in useEffect
  useEffect(() => {
    if (!auth0Loading) {
      syncUser();
    }
  }, [auth0Loading, syncUser]);

  // Fix 4: Add dependencies to updateProfile callback
  const updateProfile = useCallback(
    async (profileData) => {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const response = await axios.patch(`${API_BASE_URL}/users/me/profile`, profileData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser((prev) => ({ ...prev, profile: response.data }));
        toast.success("Profile updated successfully");
        return true;
      } catch (err) {
        setError(err.message);
        toast.error("Failed to update profile");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAccessTokenSilently]
  );

  // Fix 5: Add dependencies to getNotifications callback
  const getNotifications = useCallback(
    async (unreadOnly = false) => {
      try {
        const token = await getAccessTokenSilently();
        const response = await axios.get(`${API_BASE_URL}/users/me/notifications?unread=${unreadOnly}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (err) {
        console.error("Error fetching notifications:", err);
        return { notifications: [], unreadCount: 0 };
      }
    },
    [getAccessTokenSilently]
  );

  return (
    <UserContext.Provider
      value={{ user, loading: loading || auth0Loading, error, updateProfile, getNotifications, isAuthenticated }}
    >
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);