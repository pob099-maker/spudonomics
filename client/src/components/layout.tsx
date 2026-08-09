import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { Calculator, Database, Sprout, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", label: "Calculator", icon: Calculator },
  { href: "/data", label: "Data Sources", icon: Database },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-3 py-4">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-home">
            <Logo className="h-7 w-7 text-sidebar-primary shrink-0" />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-semibold text-base text-sidebar-foreground">
                Spudonomics
              </span>
              <span className="text-[11px] text-sidebar-foreground/60 tracking-wide">
                Potato Gross Margin Analyzer
              </span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.href}
                      data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-3 py-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:text-sidebar-foreground"
            data-testid="button-toggle-theme"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span className="text-xs">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </Button>
          <div className="flex items-start gap-2 rounded-md bg-sidebar-accent/60 p-2.5 text-[11px] leading-snug text-sidebar-foreground/70">
            <Sprout className="h-3.5 w-3.5 mt-0.5 shrink-0 text-sidebar-primary" />
            <span>Built for PotatoLink &amp; the Lifecycles project. Every figure traces to a cited source.</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <SidebarTrigger data-testid="button-sidebar-toggle" />
          <span className="font-display font-semibold text-sm">Spudonomics</span>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
