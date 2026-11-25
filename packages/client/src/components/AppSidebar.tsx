import type { LucideIcon } from "lucide-react";

import { Link } from "@tanstack/react-router";
import { Home, List } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_PAGES } from "@/lib/pages";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

/** Sidebar navigation entries: Home plus the main pages (add a top-level page to `APP_PAGES`). */
const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Home",
    icon: Home,
  },
  ...APP_PAGES,
  {
    to: "/items",
    label: "Items",
    icon: List,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3 text-lg font-semibold">Budget Buddy</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map(item => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton asChild>
                  <Link
                    to={item.to}
                    activeOptions={{
                      exact: item.to === "/",
                    }}
                    activeProps={{
                      "data-active": true,
                    }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
