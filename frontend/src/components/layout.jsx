// src/components/layout.jsx
import { memo } from "react";
import { Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useUser } from "@/contexts/user-context";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarSeparator,
  SidebarInset,
  SidebarTrigger,
  SidebarRail,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
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
  Search,
  Bell,
  HelpCircle,
  BookOpen,
  LogOut,
  User,
  Settings,
  ShoppingBag,
  Code2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import SidebarNavItem from "./sidebar/sidebar-nav-item";
import LoadingScreen from "./ui/loading-screen";
import { useNavigation } from "@/hooks/use-navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { useAuthToken } from "@/hooks/use-auth-token";

const UserProfileButton = memo(({ user, logout, navigate }) => (
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
      <DropdownMenuItem onClick={() => navigate("/profile")}>
        <User className="mr-2 h-4 w-4" />
        <span>Profile</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => logout({ returnTo: window.location.origin })}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
));

UserProfileButton.displayName = "UserProfileButton";

const PageHeader = memo(({ title, user }) => (
  <header className="border-b py-3 px-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
    <div className="flex items-center gap-3">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-xl font-bold font-bricolage truncate">{title}</h1>
    </div>
    <div className="flex items-center gap-2">
      <Avatar className="h-8 w-8 border hidden sm:flex">
        <AvatarImage src={user?.picture} alt={user?.name} />
        <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
    </div>
  </header>
));

PageHeader.displayName = "PageHeader";

function Layout() {
  const { logout } = useAuth0();
  const { user } = useUser();
  const { mainMenuItems, isPathActive, getCurrentPageTitle, navigate } = useNavigation();
  const { unreadCount, isLoading: isNotificationsLoading } = useNotifications();
  const { token } = useAuthToken();
  const currentPageTitle = getCurrentPageTitle();

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
                    <SidebarNavItem
                      key={item.path}
                      icon={item.icon}
                      name={item.name}
                      path={item.path}
                      isActive={isPathActive(item.path)}
                    />
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
                      <button onClick={() => navigate("/purchased")} className="flex items-center w-full">
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
                      <button className="flex items-center w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>Documentation</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="transition-colors">
                      <button className="flex items-center w-full">
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
            <UserProfileButton user={user} logout={logout} navigate={navigate} />
            <div className="mt-3 flex justify-between items-center">
              <Button variant="ghost" size="icon" className="relative">
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
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
              <ModeToggle />
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset className="w-full h-full flex flex-col">
          <PageHeader title={currentPageTitle} user={user} />
          <main className="p-4 md:p-6 w-full h-full overflow-y-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export default Layout;