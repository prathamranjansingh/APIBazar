"use client"

import { useState, useEffect } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
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
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
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
  Zap,
  Star,
  PlusCircle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function Layout() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0()
  const location = useLocation()
  const navigate = useNavigate()
  const [token, setToken] = useState(null)
  const [notifications, setNotifications] = useState(3)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setSidebarOpen(window.innerWidth >= 1024) // Open by default on larger screens
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      const getToken = async () => {
        try {
          const accessToken = await getAccessTokenSilently()
          setToken(accessToken)
          localStorage.setItem("auth_token", accessToken)
        } catch (error) {
          console.error("Error getting token:", error)
          toast.error("Authentication Error", {
            description: "Failed to get authentication token. Please try logging in again.",
          })
        }
      }
      getToken()
    }
  }, [isAuthenticated, getAccessTokenSilently])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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
    )
  }

  const mainMenuItems = [
    { name: "Dashboard", path: "/lay", icon: Home },
    { name: "My APIs", path: "/lay/apis", icon: Code2 },
    { name: "Analytics", path: "/lay/analytics", icon: BarChart3 },
    { name: "Marketplace", path: "/lay/marketplace", icon: ShoppingBag },
  ]

  const favoriteApis = [
    { name: "User Authentication", path: "/lay/apis/auth", icon: "🔐" },
    { name: "Payment Processing", path: "/lay/apis/payment", icon: "💳" },
    { name: "Data Analytics", path: "/lay/apis/analytics", icon: "📊" },
  ]

  // Helper function to check if a path is active
  const isPathActive = (path) => {
    if (path === "/lay" && location.pathname === "/lay") {
      return true
    }
    return location.pathname.startsWith(path) && path !== "/lay"
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          className={`border-r transition-all duration-300 ease-in-out ${sidebarOpen ? "w-64" : "w-[60px]"}`}
          collapsible={isMobile ? "offcanvas" : sidebarOpen ? "icon" : "none"}
        >
          <SidebarHeader className="px-3 py-2">
            <div className={`flex items-center gap-2 px-2 py-3 ${!sidebarOpen && "justify-center"}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Code2 className="h-5 w-5" />
              </div>
              {sidebarOpen && <span className="font-bold text-lg">API Market</span>}
            </div>
            {sidebarOpen && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search APIs..." className="pl-9 h-9 bg-muted/50 border-none" />
              </div>
            )}
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarGroup>
              {sidebarOpen && <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainMenuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isPathActive(item.path)}
                        tooltip={!sidebarOpen ? item.name : undefined}
                        className="transition-colors"
                      >
                        <button onClick={() => navigate(item.path)} className="flex items-center w-full">
                          <item.icon className="h-4 w-4 mr-2" />
                          {sidebarOpen && <span>{item.name}</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {sidebarOpen && <SidebarSeparator className="my-2" />}

            <SidebarGroup>
              {sidebarOpen && (
                <SidebarGroupLabel className="flex items-center justify-between">
                  <span>Favorite APIs</span>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {favoriteApis.map((api) => (
                    <SidebarMenuItem key={api.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isPathActive(api.path)}
                        tooltip={!sidebarOpen ? api.name : undefined}
                        className="transition-colors"
                      >
                        <button onClick={() => navigate(api.path)} className="flex items-center w-full">
                          <span className="flex h-4 w-4 items-center justify-center text-xs mr-2">{api.icon}</span>
                          {sidebarOpen && <span>{api.name}</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {sidebarOpen && <SidebarSeparator className="my-2" />}

            <SidebarGroup>
              {sidebarOpen && <SidebarGroupLabel>Support</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={!sidebarOpen ? "Documentation" : undefined}
                      className="transition-colors"
                    >
                      <button onClick={() => navigate("/lay/docs")} className="flex items-center w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {sidebarOpen && <span>Documentation</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={!sidebarOpen ? "Help Center" : undefined}
                      className="transition-colors"
                    >
                      <button onClick={() => navigate("/lay/help")} className="flex items-center w-full">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        {sidebarOpen && <span>Help Center</span>}
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
                <Button
                  variant="ghost"
                  className={`w-full flex items-center justify-start gap-2 px-2 h-auto py-2 ${!sidebarOpen && "justify-center"}`}
                >
                  <Avatar className="h-8 w-8 border">
                    <AvatarImage src={user?.picture} alt={user?.name} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  {sidebarOpen && (
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
                    </div>
                  )}
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
            {sidebarOpen && (
              <div className="mt-3 flex justify-between items-center">
                <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/lay/notifications")}>
                  <Bell className="h-4 w-4" />
                  {notifications > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                      variant="destructive"
                    >
                      {notifications}
                    </Badge>
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => navigate("/lay/settings")}>
                  <Settings className="h-4 w-4" />
                </Button>
                <ModeToggle />
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="border-b py-3 px-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <h1 className="text-xl font-semibold truncate">
                {mainMenuItems.find((item) => isPathActive(item.path))?.name || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1 hidden sm:flex">
                <Zap className="h-4 w-4" />
                <span>Upgrade</span>
              </Button>
              {location.pathname.includes("/lay/apis") && (
                <Button size="sm" className="gap-1" onClick={() => navigate("/lay/apis/create")}>
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Create API</span>
                </Button>
              )}
              <Avatar className="h-8 w-8 border hidden sm:flex">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main
            className={`p-4 md:p-6 flex-grow transition-all duration-300 ease-in-out ${sidebarOpen ? "lg:ml-64" : "lg:ml-[60px]"}`}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

export default Layout

