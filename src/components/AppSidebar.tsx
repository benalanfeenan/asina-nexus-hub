import {
  LayoutDashboard,
  Users,
  UserCog,
  Home,
  CalendarDays,
  Clock,
  FileText,
  Receipt,
  AlertTriangle,
  MessageSquareWarning,
  ShieldAlert,
  HardHat,
  Ban,
  TrendingUp,
  ClipboardCheck,
  FolderOpen,
  Settings,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import asinaLogo from "@/assets/asina-logo.png";
import asinaFavicon from "/favicon.png";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Participants", url: "/participants", icon: Users },
      { title: "Staff", url: "/staff", icon: UserCog, roles: ["admin", "house_manager"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "SIL Houses", url: "/sil-houses", icon: Home },
      { title: "Rostering", url: "/rostering", icon: CalendarDays, roles: ["admin", "house_manager"] },
      { title: "Timesheets", url: "/timesheets", icon: Clock },
      { title: "Progress Notes", url: "/progress-notes", icon: FileText },
      { title: "Invoicing", url: "/invoicing", icon: Receipt, roles: ["admin"] },
    ],
  },
  {
    label: "Compliance",
    items: [
      { title: "Incidents", url: "/incidents", icon: AlertTriangle },
      { title: "Complaints", url: "/complaints", icon: MessageSquareWarning },
      { title: "Risk Register", url: "/risk-register", icon: ShieldAlert, roles: ["admin", "house_manager"] },
      { title: "Hazards", url: "/hazards", icon: HardHat },
      { title: "Restrictive Practices", url: "/restrictive-practices", icon: Ban },
      { title: "Quality Improvement", url: "/quality-improvement", icon: TrendingUp, roles: ["admin", "house_manager"] },
      { title: "Compliance Dashboard", url: "/compliance-dashboard", icon: ClipboardCheck, roles: ["admin"] },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Documents", url: "/documents", icon: FolderOpen },
      { title: "NDIS Price List", url: "/ndis-price-list", icon: Receipt, roles: ["admin"] },
      { title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const canSee = (item: NavItem) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed ? (
          <img src={asinaLogo} alt="Asina" className="h-10 w-auto object-contain" />
        ) : (
          <img src={asinaFavicon} alt="Asina" className="h-8 w-8 mx-auto object-contain" />
        )}
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto overflow-x-hidden scrollbar-hidden">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(canSee);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase text-[10px] tracking-wider">{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)}>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="hover:bg-sidebar-accent/60 rounded-lg transition-colors"
                          activeClassName="bg-sidebar-primary/20 text-sidebar-primary font-medium"
                        >
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
