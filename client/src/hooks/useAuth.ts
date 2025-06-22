import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, LoginRequest, TokenResponse } from "@shared/schema";

interface AuthUser {
  id: number;
  email: string;
  companyName: string;
  isActive: boolean;
  createdAt: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem("access_token")
  );
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/v1/me"],
    enabled: !!token,
    retry: false,
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const response = await fetch("/api/v1/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("access_token");
            setToken(null);
            return null;
          }
          throw new Error("Failed to fetch user");
        }

        return response.json();
      } catch (error) {
        localStorage.removeItem("access_token");
        setToken(null);
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<TokenResponse> => {
      const response = await fetch("/api/v1/login/access-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.access_token);
      setToken(data.access_token);
      queryClient.invalidateQueries({ queryKey: ["/api/v1/me"] });
    },
  });

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    queryClient.clear();
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken && !token) {
      setToken(storedToken);
    }
  }, [token]);

  return {
    user,
    isLoading: isLoading && !!token,
    login: loginMutation.mutate,
    loginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    logout,
    token,
  };
}
