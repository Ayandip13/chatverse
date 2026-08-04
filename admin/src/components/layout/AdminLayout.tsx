import { useEffect } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { useThemeStore } from "../../store/themeStore";

export const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div
      className={`flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden`}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
