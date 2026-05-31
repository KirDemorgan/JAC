"use client";

import React from "react";
import { Monitor, Wifi, WifiOff, ChevronRight } from "lucide-react";
import type { ClientDevice } from "../../shared/types";

interface AgentsMonitorTabProps {
  clients: ClientDevice[];
  onSelectClient: (client: ClientDevice) => void;
}

export function AgentsMonitorTab({
  clients,
  onSelectClient,
}: AgentsMonitorTabProps) {
  if (clients.length === 0) {
    return (
      <div className="glass-panel rounded-xl py-20 text-center">
        <Monitor className="w-10 h-10 text-white/15 mx-auto mb-3" />
        <p className="text-sm text-white/30">No agents connected yet</p>
        <p className="text-xs text-white/20 mt-1">
          Agents register automatically on first contact
        </p>
      </div>
    );
  }

  const online = clients.filter((c) => c.connected).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <span className="text-white font-medium">{clients.length}</span> agents
        registered
        <span className="mx-2 text-white/15">·</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        <span>{online} online</span>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Status", "Hostname", "OS", "Last seen", "IP", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {clients.map((c) => (
              <ClientRow key={c.id} client={c} onSelect={onSelectClient} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClientRow({
  client,
  onSelect,
}: {
  client: ClientDevice;
  onSelect: (c: ClientDevice) => void;
}) {
  const ago = formatAgo(client.lastSeen);

  return (
    <tr
      onClick={() => onSelect(client)}
      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
    >
      <td className="px-4 py-3">
        {client.connected ? (
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-xs">Online</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-white/30">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="text-xs">Offline</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-white/80">{client.hostname}</div>
        <div className="text-[11px] text-white/30 mt-0.5">{client.username}</div>
      </td>
      <td className="px-4 py-3 text-white/50">
        <div>{client.os}</div>
        <div className="text-[11px] text-white/25">{client.osVersion}</div>
      </td>
      <td className="px-4 py-3 text-xs text-white/35">{ago}</td>
      <td className="px-4 py-3 text-xs text-white/30 font-mono">{client.ip}</td>
      <td className="px-4 py-3">
        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
      </td>
    </tr>
  );
}

function formatAgo(iso: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
