"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "nuit" ? "dark" : "light"}
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--ink)",
          border: "2px solid var(--ink)",
          borderRadius: "10px",
          fontFamily: "var(--font-instrument), system-ui, sans-serif",
        },
      }}
    />
  );
}