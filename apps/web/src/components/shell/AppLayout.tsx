import { Outlet } from "react-router-dom"
import { TopBar } from "./TopBar"
import { BottomNav } from "./BottomNav"
import { CaptureModal } from "./CaptureModal"
import { Toaster } from "@/components/ui/sonner"

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[600px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <TopBar />
      <main className="relative flex-1 pb-28 pt-2 px-4">
        <Outlet />
      </main>
      <BottomNav />
      <CaptureModal />
      <Toaster position="top-center" />
    </div>
  )
}