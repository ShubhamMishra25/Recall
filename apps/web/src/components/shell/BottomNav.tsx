import { Home, BookOpen, Library, PencilLine } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCaptureStore } from "@/stores/captureStore";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/review", icon: BookOpen, label: "Review" },
  { to: "/library", icon: Library, label: "Library" },
];

export function BottomNav() {
  const { open } = useCaptureStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe px-4 pb-4">
      <div className="flex items-center gap-1 h-14 px-3 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-xl shadow-black/30">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={`h-4 w-4 shrink-0 ${isActive ? "" : ""}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="w-px h-6 bg-border/60 mx-1" />

        {/* Capture FAB */}
        <button
          onClick={open}
          className="flex items-center gap-2 px-3 h-9 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
        >
          <PencilLine className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Capture</span>
        </button>
      </div>
    </nav>
  );
}
