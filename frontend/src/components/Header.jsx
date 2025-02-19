import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
          <span className="font-bold text-xl">API Platform</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              Product
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 hidden pt-2 group-hover:block">
              <div className="w-48 rounded-md border bg-background p-2 shadow-lg">
                <Link to="#" className="block px-3 py-2 text-sm rounded-md hover:bg-muted">Features</Link>
                <Link to="#" className="block px-3 py-2 text-sm rounded-md hover:bg-muted">Integrations</Link>
                <Link to="#" className="block px-3 py-2 text-sm rounded-md hover:bg-muted">API Testing</Link>
              </div>
            </div>
          </div>
          <Link to="/pricing" className="text-sm font-medium hover:text-primary">Pricing</Link>
          <Link to="/enterprise" className="text-sm font-medium hover:text-primary">Enterprise</Link>
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm font-medium hover:text-primary">
              Resources
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="absolute top-full left-0 hidden pt-2 group-hover:block">
              <div className="w-48 rounded-md border bg-background p-2 shadow-lg">
                <Link to="#" className="block px-3 py-2 text-sm rounded-md hover:bg-muted">Documentation</Link>
                <Link to="#" className="block px-3 py-2 text-sm rounded-md hover:bg-muted">Blog</Link>
                <Link to="#" className="block px-3 py-2 text-sm rounded-md hover:bg-muted">Community</Link>
              </div>
            </div>
          </div>
          <Link to="/api-network" className="text-sm font-medium hover:text-primary">API Network</Link>
        </nav>

        {/* Desktop CTA Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm">Contact Sales</Button>
          <Button variant="ghost" size="sm">Sign In</Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Sign Up for Free</Button>
        </div>

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
              <div className="grid gap-2">
                <h3 className="text-sm font-medium">Product</h3>
                <div className="grid gap-2 pl-2">
                  <Link to="#" className="text-sm hover:text-primary" onClick={() => setIsOpen(false)}>Features</Link>
                  <Link to="#" className="text-sm hover:text-primary" onClick={() => setIsOpen(false)}>Integrations</Link>
                  <Link to="#" className="text-sm hover:text-primary" onClick={() => setIsOpen(false)}>API Testing</Link>
                </div>
              </div>
              <div className="grid gap-2">
                <Link to="/pricing" className="text-sm font-medium hover:text-primary" onClick={() => setIsOpen(false)}>Pricing</Link>
                <Link to="/enterprise" className="text-sm font-medium hover:text-primary" onClick={() => setIsOpen(false)}>Enterprise</Link>
              </div>
              <div className="grid gap-2">
                <h3 className="text-sm font-medium">Resources</h3>
                <div className="grid gap-2 pl-2">
                  <Link to="#" className="text-sm hover:text-primary" onClick={() => setIsOpen(false)}>Documentation</Link>
                  <Link to="#" className="text-sm hover:text-primary" onClick={() => setIsOpen(false)}>Blog</Link>
                  <Link to="#" className="text-sm hover:text-primary" onClick={() => setIsOpen(false)}>Community</Link>
                </div>
              </div>
              <div className="grid gap-2">
                <Link to="/api-network" className="text-sm font-medium hover:text-primary" onClick={() => setIsOpen(false)}>API Network</Link>
              </div>
              <div className="grid gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Contact Sales</Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Sign In</Button>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsOpen(false)}>Sign Up for Free</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
