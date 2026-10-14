"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

/** The coloured edge of each toast type lives in globals.css (search for "data-sonner-toast"). */
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
          border: "1px solid var(--ink)",
          borderRadius: "0px",
          fontFamily: "var(--font-bricolage), system-ui, sans-serif",
          fontWeight: 500,
        },
      }}
    />
  );
}
