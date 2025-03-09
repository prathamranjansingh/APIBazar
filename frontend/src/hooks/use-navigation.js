// src/hooks/use-navigation.js
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Code2, BarChart3, ShoppingBag, Key } from "lucide-react";

export function useNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const mainMenuItems = useMemo(() => [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "My APIs", path: "/apis", icon: Code2 },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "Marketplace", path: "/marketplace", icon: ShoppingBag },
    { name: "API Keys", path: "/keys", icon: Key },
  ], []);

  const isPathActive = (path) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") {
      return true;
    }
    if (path === "/apis" && (location.pathname === "/apis" || location.pathname.startsWith("/apis/"))) {
      return true;
    }
    return location.pathname === path;
  };

  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "Dashboard";
    else if (path === "/apis" || path.startsWith("/apis/")) return "My APIs";
    else if (path === "/analytics") return "Analytics";
    else if (path === "/marketplace") return "Marketplace";
    else if (path === "/keys") return "API Keys";
    else if (path === "/purchased") return "Purchased APIs";
    else if (path === "/profile") return "Profile";
    else return "Dashboard";
  };

  return {
    mainMenuItems,
    isPathActive,
    getCurrentPageTitle,
    navigate,
  };
}