import { Outlet } from "react-router-dom"
import { TopBar } from "./TopBar"
import { BottomNav } from "./BottomNav"
import { CaptureModal } from "./CaptureModal"
import { Toaster } from "@/components/ui/sonner"   // shadcn sonner export

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <TopBar />
      <main className="flex-1 pb-20 pt-4 px-4">
        <Outlet />
      </main>
      <BottomNav />
      <CaptureModal />
      <Toaster position="top-center" />
    </div>
  )
}