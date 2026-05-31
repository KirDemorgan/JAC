"use client";

import React from "react";
import { Zap, LayoutDashboard, Monitor, Ban, ScrollText, LogOut } from "lucide-react";
import type { ActiveTab, RealtimeStatus } from "../../shared/types";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  realtimeStatus: RealtimeStatus;
  clientsCount: number;
  rulesCount: number;
  onLogout: () => void;
}

const NAV: { tab: ActiveTab; label: string; Icon: React.ElementType }[] = [
  { tab: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { tab: "agents", label: "Agents", Icon: Monitor },
  { tab: "rules", label: "Rules", Icon: Ban },
  { tab: "logs", label: "Events", Icon: ScrollText },
];

const STATUS_DOT: Record<RealtimeStatus, string> = {
  connected: "bg-emerald-400",
  connecting: "bg-amber-400",
  disconnected: "bg-rose-500",
};

export function Sidebar({
  activeTab,
  setActiveTab,
  realtimeStatus,
  clientsCount,
  rulesCount,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="w-52 flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-white/[0.02]">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">JAC</div>
            <div className="text-[10px] text-white/30 leading-tight">Control Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ tab, label, Icon }) => {
          const active = activeTab === tab;
          const badge =
            tab === "agents" && clientsCount > 0
              ? { value: clientsCount, cls: "bg-white/10 text-white/50" }
              : tab === "rules" && rulesCount > 0
              ? { value: rulesCount, cls: "bg-rose-500/10 text-rose-400" }
              : null;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-white/8 text-white"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${badge.cls}`}
                >
                  {badge.value}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06] space-y-3">
        <div className="flex items-center gap-2">
          <span
            className={`dot-pulse ${STATUS_DOT[realtimeStatus]}`}
            aria-hidden
          />
          <span className="text-[11px] text-white/40 capitalize">
            {realtimeStatus}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-[11px] text-white/30 hover:text-rose-400 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
