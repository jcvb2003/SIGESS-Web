import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContextStore";
import { LoginCredentials } from "../types/auth.types";
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const success = await signIn(credentials);
      if (!success) {
        return;
      }
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };
  return {
    login,
    loading,
  };
}
