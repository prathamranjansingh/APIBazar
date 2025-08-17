"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";

export default function RootProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <Toaster closeButton className="pointer-events-auto" />
      {children}
    </>
  );
}
