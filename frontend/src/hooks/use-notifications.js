// src/hooks/use-notifications.js
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/contexts/user-context";

export function useNotifications() {
  const { user, getNotifications } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { unreadCount } = await getNotifications(true);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, getNotifications]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up interval to check for new notifications
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  return { unreadCount, isLoading, fetchNotifications };
}