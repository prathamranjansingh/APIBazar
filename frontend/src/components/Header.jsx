import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"; 

const authenticateUser = async (user) => {
  console.log("Authenticating user:", user);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      auth0Id: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
    return response.data.user;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
};

// Dropdown component
const Dropdown = ({ title, links }) => (
  <div className="group relative">
    <button className="flex items-center gap-1 text-sm font-medium hover:text-primary">
      {title}
      <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
    </button>
    <div className="absolute top-full left-0 hidden pt-2 group-hover:block">
      <div className="w-48 rounded-md border bg-background p-2 shadow-lg">
        {links.map(({ name, to }) => (
          <Link key={name} to={to} className="block px-3 py-2 text-sm rounded-md hover:bg-muted">
            {name}
          </Link>
        ))}
      </div>
    </div>
  </div>
);

// Authentication Buttons
const AuthButtons = ({ isAuthenticated, user, login, logout }) => (
  <div className="hidden md:flex items-center gap-2">
    {isAuthenticated ? (
      <>
        <span className="text-sm font-medium">{user?.name}</span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Logout
        </Button>
      </>
    ) : (
      <>
        <Button variant="ghost" size="sm">Contact Sales</Button>
        <Button variant="ghost" size="sm" onClick={login}>Sign In</Button>
        <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={login}>
          Sign Up for Free
        </Button>
      </>
    )}
  </div>
);

// Site Header Component
export function SiteHeader() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const [backendUser, setBackendUser] = useState(null);

  // Memoized Authentication Methods
  const handleLogin = useCallback(() => loginWithRedirect(), [loginWithRedirect]);
  const handleLogout = useCallback(() => logout({ returnTo: window.location.origin }), [logout]);

  // Sync user with backend on login
  useEffect(() => {
    if (isAuthenticated && user) {
      authenticateUser(user).then((data) => {
        setBackendUser(data);
      });
    }
  }, [isAuthenticated, user]);

  // Memoized Authentication State
  const authState = useMemo(() => ({ isAuthenticated, user: backendUser || user }), [isAuthenticated, backendUser, user]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur px-10">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
          <span className="font-bold text-xl">APIBazar</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Dropdown
            title="Product"
            links={[
              { name: "Features", to: "#" },
              { name: "Integrations", to: "#" },
              { name: "API Testing", to: "#" },
            ]}
          />
          <Link to="/pricing" className="text-sm font-medium hover:text-primary">Pricing</Link>
          <Link to="/enterprise" className="text-sm font-medium hover:text-primary">Enterprise</Link>
          <Dropdown
            title="Resources"
            links={[
              { name: "Documentation", to: "#" },
              { name: "Blog", to: "#" },
              { name: "Community", to: "#" },
            ]}
          />
          <Link to="/api-network" className="text-sm font-medium hover:text-primary">API Network</Link>
        </nav>

        {/* Authentication Buttons */}
        {!isLoading && <AuthButtons {...authState} login={handleLogin} logout={handleLogout} />}

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              {/* Mobile Menu Links */}
              <Dropdown
                title="Product"
                links={[
                  { name: "Features", to: "#" },
                  { name: "Integrations", to: "#" },
                  { name: "API Testing", to: "#" },
                ]}
              />
              <Link to="/pricing" className="text-sm font-medium hover:text-primary" onClick={() => setIsOpen(false)}>
                Pricing
              </Link>
              <Link to="/enterprise" className="text-sm font-medium hover:text-primary" onClick={() => setIsOpen(false)}>
                Enterprise
              </Link>
              <Dropdown
                title="Resources"
                links={[
                  { name: "Documentation", to: "#" },
                  { name: "Blog", to: "#" },
                  { name: "Community", to: "#" },
                ]}
              />
              <Link to="/api-network" className="text-sm font-medium hover:text-primary" onClick={() => setIsOpen(false)}>
                API Network
              </Link>

              {/* Authentication in Mobile Menu */}
              <div className="grid gap-2 pt-4">
                {isAuthenticated ? (
                  <Button variant="outline" onClick={handleLogout}>Logout</Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Contact Sales</Button>
                    <Button variant="outline" onClick={handleLogin}>Sign In</Button>
                    <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleLogin}>
                      Sign Up for Free
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
