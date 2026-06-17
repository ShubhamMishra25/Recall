import { Home, PencilLine, Library, BookOpen } from "lucide-react";
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur">
      <div className="flex h-16 items-center justify-around px-2">
        {/* Regular navigation tabs */}
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
          </NavLink>
        ))}

        {/* Capture button – opens modal, no navigation */}
        <button
          onClick={open}
          className="flex flex-col items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <PencilLine className="h-5 w-5" />
          <span>Capture</span>
        </button>
      </div>
    </nav>
  );
}
