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


const Dropdown = ({ title, links }) => (
  <div className="relative group">
    <button className="flex items-center gap-1 text-sm font-medium hover:text-primary z-10 relative">
      {title}
      <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
    </button>

    <div className="absolute top-full left-0 mt-2 w-48 rounded-md border bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 ease-in-out z-50">
      {links.map(({ name, to }) => (
        <Link
          key={name}
          to={to}
          className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100"
        >
          {name}
        </Link>
      ))}
    </div>
  </div>
);




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


export function SiteHeader() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const [backendUser, setBackendUser] = useState(null);

  const handleLogin = useCallback(() => loginWithRedirect(), [loginWithRedirect]);
  const handleLogout = useCallback(() => logout({ returnTo: window.location.origin }), [logout]);

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
            className="z-1"
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

        {!isLoading && <AuthButtons {...authState} login={handleLogin} logout={handleLogout} />}

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
