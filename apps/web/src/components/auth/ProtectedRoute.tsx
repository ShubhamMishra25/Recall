import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loading } from "../ui/loading";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  
  if (!user) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}
