"use client";
import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "@/contexts/user-context";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Loader2,
  Home,
  Code2,
  BarChart3,
  Settings,
  ShoppingBag,
  LogOut,
  User,
  Search,
  Bell,
  HelpCircle,
  BookOpen,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

function Layout() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  const { user, loading: userLoading, getNotifications } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);

  // Get token and store it for API calls
  useEffect(() => {
    if (isAuthenticated) {
      const getToken = async () => {
        try {
          const accessToken = await getAccessTokenSilently();
          setToken(accessToken);
          localStorage.setItem("auth_token", accessToken);
        } catch (error) {
          console.error("Error getting token:", error);
          toast.error("Authentication Error", {
            description: "Failed to get authentication token. Please try logging in again.",
          });
        }
      };
      getToken();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Fetch notification count
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchNotifications = async () => {
        try {
          setIsNotificationsLoading(true);
          const { unreadCount } = await getNotifications(true);
          setUnreadCount(unreadCount);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        } finally {
          setIsNotificationsLoading(false);
        }
      };
      fetchNotifications();
      // Set up interval to check for new notifications
      const interval = setInterval(fetchNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, getNotifications]);

  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">API Marketplace</h1>
          <p className="text-muted-foreground">Please sign in to access the dashboard</p>
        </div>
        <Button onClick={() => loginWithRedirect()}>Sign In</Button>
      </div>
    );
  }

  const mainMenuItems = [
    { name: "Dashboard", path: "/lay", icon: Home },
    { name: "My APIs", path: "/lay/apis", icon: Code2 },
    { name: "Analytics", path: "/lay/analytics", icon: BarChart3 },
    { name: "Marketplace", path: "/lay/marketplace", icon: ShoppingBag },
    { name: "API Keys", path: "/lay/keys", icon: Key },
  ];

  // Helper function to check if a path is active
  const isPathActive = (path) => {
    if (path === "/lay" && location.pathname === "/lay") {
      return true;
    }
    return location.pathname.startsWith(path) && path !== "/lay";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="px-3 py-2">
            <div className="flex items-center gap-2 px-2 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg">API Bazar</span>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search APIs..." className="pl-9 h-9 bg-muted/50 border-none" />
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2">
            <SidebarGroup>
              <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild isActive={isPathActive(item.path)} className="transition-colors">
                        <button onClick={() => navigate(item.path)} className="flex items-center w-full">
                          <item.icon className="h-4 w-4 mr-2" />
                          <span>{item.name}</span>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                <span>Purchased APIs</span>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="transition-colors">
                      <button onClick={() => navigate("/lay/purchased")} className="flex items-center w-full">
                        <span className="flex h-4 w-4 items-center justify-center text-xs mr-2">🛒</span>
                        <span>View All Purchased APIs</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel>Support</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="transition-colors">
                      <button onClick={() => navigate("/lay/docs")} className="flex items-center w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>Documentation</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="transition-colors">
                      <button onClick={() => navigate("/lay/help")} className="flex items-center w-full">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        <span>Help Center</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-start gap-2 px-2 h-auto py-2">
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-sm">
                    <span className="font-medium">{user?.name}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/lay/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/lay/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout({ returnTo: window.location.origin })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="mt-3 flex justify-between items-center">
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/lay/notifications")}>
                <Bell className="h-4 w-4" />
                {!isNotificationsLoading && unreadCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    variant="destructive"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/lay/settings")}>
                <Settings className="h-4 w-4" />
              </Button>
              <ModeToggle />
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="w-full h-full flex flex-col">
          <header className="border-b py-3 px-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-bold font-bricolage truncate">
                {mainMenuItems.find((item) => isPathActive(item.path))?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border hidden sm:flex">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="p-4 md:p-6 w-full h-full">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default Layout;