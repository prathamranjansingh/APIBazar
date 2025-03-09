// src/components/sidebar/sidebar-nav-item.jsx
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

const SidebarNavItem = memo(({ icon: Icon, name, path, isActive }) => {
  const navigate = useNavigate();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} className="transition-colors">
        <button
          onClick={() => navigate(path)}
          className="flex items-center w-full"
        >
          <Icon className="h-4 w-4 mr-2" />
          <span>{name}</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

SidebarNavItem.displayName = "SidebarNavItem";
export default SidebarNavItem;