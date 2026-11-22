"use client";

import { ThemeProvider } from "next-themes";

export function ClientThemeProvider({ children }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
