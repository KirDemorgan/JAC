"use client";

import React from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import type { ActiveTab, RealtimeStatus } from "../../shared/types";

const TAB_META: Record<ActiveTab, { label: string; desc: string }> = {
  dashboard: { label: "Dashboard", desc: "System overview & live alerts" },
  agents: { label: "Agent Monitor", desc: "Connected client workstations" },
  rules: { label: "Blacklist Rules", desc: "Forbidden process management" },
  logs: { label: "Process Events", desc: "Termination event timeline" },
};

interface HeaderProps {
  activeTab: ActiveTab;
  realtimeStatus: RealtimeStatus;
  onRefresh: () => void;
}

export function Header({ activeTab, realtimeStatus, onRefresh }: HeaderProps) {
  const { label, desc } = TAB_META[activeTab];

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.06]">
      <div>
        <h2 className="text-base font-semibold text-white leading-tight">
          {label}
        </h2>
        <p className="text-xs text-white/35 mt-0.5">{desc}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Realtime indicator */}
        {realtimeStatus === "connected" ? (
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <Wifi className="w-3 h-3" />
            Live
          </span>
        ) : realtimeStatus === "connecting" ? (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
            <Wifi className="w-3 h-3 animate-pulse" />
            Connecting
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] text-white/30">
            <WifiOff className="w-3 h-3" />
            Offline
          </span>
        )}

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 bg-white/5 hover:bg-white/8 border border-white/10 px-3 py-1.5 rounded-lg transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>
    </header>
  );
}
