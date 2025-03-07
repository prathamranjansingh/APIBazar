import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function SiteFooter() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#" },
        { name: "Enterprise", href: "#" },
        { name: "Security", href: "#" },
        { name: "Pricing", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "#" },
        { name: "API Network", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Support", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#" },
        { name: "Careers", href: "#" },
        { name: "Contact", href: "#" },
        { name: "Press", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy", href: "#" },
        { name: "Terms", href: "#" },
        { name: "Cookie Policy", href: "#" },
        { name: "Licenses", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t py-12 md:py-16 lg:py-24">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
              <span className="font-bold text-xl">APIBazar</span>
            </Link>
            <p className="text-muted-foreground max-w-[400px]">
              The most powerful platform for building and testing APIs. Join millions of developers worldwide.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
            <Button variant="outline">Contact Sales</Button>
            <Button className="bg-orange-500 hover:bg-orange-600">Get Started Free</Button>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:gap-12">
          {footerLinks.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-lg font-semibold">{group.title}</h3>
              <ul className="space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} APIBazar. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">
                Privacy Policy
              </Link>
              <Link to="#" className="text-sm text-muted-foreground hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
