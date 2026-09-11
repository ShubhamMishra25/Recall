import { createContext } from "react";

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  verify: (token: string) => Promise<void>;
  loginDemo: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);