"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarDropdown, SidebarLink } from "./sidebar/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@apibazar/ui";

export function SidebarDemo() {
  const links = [
    {
      label: "Dashboard",
      href: "#",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-white" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-white" />
      ),
    },
    {
      label: "Settings",
      href: "#",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-white" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-white" />
      ),
    },
  ];

const accountDropdownLink = {
  label: "Account",
  icon: <img
  src="https://media.licdn.com/dms/image/v2/D4E03AQHKfxUJW4wXaQ/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1722264770993?e=1758153600&v=beta&t=Bf7mp1mpuN72vDlnCjCGG8suYXhD1foR_Eli3q6rtxg"
  className="h-7 w-7 shrink-0 rounded-full"
  width={50}
  height={50}
  alt="Avatar"
/>,
  dropdownItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Billing",
      href: "/billing",
    },
    {
      label: "Team",
      href: "/team",
    },
    {
      label: "Subscription",
      href: "/subscription",
    },
    {
      label: "OpenAI",
      href: "https://openai.com",
      external: true,
    },
  ],
};

  const [open, setOpen] = useState(false);
  return (
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
          <SidebarDropdown link={accountDropdownLink} />;
          </div>
        </SidebarBody>
      </Sidebar>
  );
}
export const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-white"
      >
        ApiBazar
      </motion.span>
    </a>
  );
};
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-white"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-white" />
    </a>
  );
};

