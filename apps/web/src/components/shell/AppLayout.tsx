import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 pb-20 pt-4 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}