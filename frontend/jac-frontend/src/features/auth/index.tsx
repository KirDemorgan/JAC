"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Shield, Eye, EyeOff, Lock, User } from "lucide-react";
import {
  apiRequest,
  setApiToken,
  setUnauthorizedHandler,
} from "../../shared/api/client";

// ─── LoginPage ───────────────────────────────────────────────────────────────

export interface LoginPageProps {
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loginError: string | null;
  loadingLogin: boolean;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  handleLogin: () => Promise<void>;
}

export function LoginPage({
  username,
  setUsername,
  password,
  setPassword,
  loginError,
  loadingLogin,
  rememberMe,
  setRememberMe,
  handleLogin,
}: LoginPageProps) {
  const [showPw, setShowPw] = useState(false);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen bg-[#070709] flex items-center justify-center relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] -bottom-20 right-0 pointer-events-none" />

      <div className="w-full max-w-sm mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-white">JAC Admin Console</h1>
          <p className="text-sm text-white/40 mt-1">Joint Agent Control</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={onKey}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKey}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <label
              htmlFor="remember"
              className="text-xs text-white/40 cursor-pointer select-none"
            >
              Remember session
            </label>
          </div>

          {loginError && (
            <div className="text-xs text-rose-400 bg-rose-400/10 border border-rose-400/20 rounded-lg px-3 py-2">
              {loginError}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loadingLogin}
            className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingLogin ? "Authenticating…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── useAuth ─────────────────────────────────────────────────────────────────

const TOKEN_KEY = "jac_token";

export interface AuthState {
  token: string | null;
  username: string;
  setUsername: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  loginError: string | null;
  loadingLogin: boolean;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  handleLogin: () => Promise<void>;
  handleLogout: () => void;
}

export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  });
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setApiToken(token);
    setUnauthorizedHandler(() => {
      setToken(null);
      localStorage.removeItem(TOKEN_KEY);
    });
  }, [token]);

  const handleLogin = useCallback(async () => {
    setLoadingLogin(true);
    setLoginError(null);
    try {
      const data = await apiRequest<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (data?.token) {
        setToken(data.token);
        if (rememberMe) localStorage.setItem(TOKEN_KEY, data.token);
      } else {
        setLoginError("Invalid credentials");
      }
    } catch (e: unknown) {
      setLoginError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoadingLogin(false);
    }
  }, [username, password, rememberMe]);

  const handleLogout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    setApiToken(null);
    setUsername("admin");
    setPassword("");
    setLoginError(null);
  }, []);

  return {
    token,
    username,
    setUsername,
    password,
    setPassword,
    loginError,
    loadingLogin,
    rememberMe,
    setRememberMe,
    handleLogin,
    handleLogout,
  };
}
