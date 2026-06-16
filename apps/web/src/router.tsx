import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/shell/AppLayout";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { Review } from "@/features/review/Review";
import { Library } from "@/features/library/Library";
import { Capture } from "@/features/capture/Capture";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/review", element: <Review /> },
      { path: "/library", element: <Library /> },
      { path: "/capture", element: <Capture /> },
    ],
  },
]);
