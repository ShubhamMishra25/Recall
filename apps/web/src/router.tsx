import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/shell/AppLayout";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { Review } from "@/features/review/Review";
import { Library } from "@/features/library/Library";
import { Capture } from "@/features/capture/Capture";
import { Verify } from "@/features/auth/Verify";
import { Login } from "@/features/auth/Login";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function createRouter() {
  return createBrowserRouter([
    { path: "/auth/login", element: <Login /> },
    { path: "/auth/verify", element: <Verify /> },
    {
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: "/", element: <Dashboard /> },
        { path: "/review", element: <Review /> },
        { path: "/library", element: <Library /> },
        { path: "/capture", element: <Capture /> },
      ],
    },
  ]);
}

export const router = createRouter();
