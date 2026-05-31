"use client";

import React, { useState } from "react";
import { X, RotateCcw, Monitor, Clock, Wifi, WifiOff, Copy, CheckCheck } from "lucide-react";
import type { ClientDevice, ProcessEvent } from "../../shared/types";

interface AgentDrawerProps {
  client: ClientDevice;
  events: ProcessEvent[];
  onClose: () => void;
  onRotateKey: (clientId: string) => Promise<void>;
}

export function AgentDrawer({
  client,
  events,
  onClose,
  onRotateKey,
}: AgentDrawerProps) {
  const [rotating, setRotating] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRotate = async () => {
    setRotating(true);
    try {
      await onRotateKey(client.id);
      setRotated(true);
      setTimeout(() => setRotated(false), 3000);
    } finally {
      setRotating(false);
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(client.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const forbiddenEvents = events.filter((e) => e.matchesForbidden);

  return (
    <aside className="w-80 flex-shrink-0 border-l border-white/[0.06] bg-white/[0.02] flex flex-col h-screen overflow-y-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-white/40" />
          <span className="text-sm font-medium text-white/70">
            Agent Details
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto">
        {/* Status banner */}
        <div
          className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
            client.connected
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-white/3 border-white/10"
          }`}
        >
          {client.connected ? (
            <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-white/30 flex-shrink-0" />
          )}
          <div>
            <div
              className={`text-sm font-medium ${
                client.connected ? "text-emerald-400" : "text-white/40"
              }`}
            >
              {client.connected ? "Online" : "Offline"}
            </div>
            <div className="text-[11px] text-white/30 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Last seen {formatAgo(client.lastSeen)}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-3">
          <InfoRow label="Hostname" value={client.hostname} />
          <InfoRow label="Username" value={client.username} />
          <InfoRow label="OS" value={`${client.os} ${client.osVersion}`} />
          <InfoRow label="Architecture" value={client.arch} />
          <InfoRow label="App version" value={client.appVersion} />
          <InfoRow label="IP Address" value={client.ip} mono />
          <div>
            <span className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">
              Client ID
            </span>
            <div className="flex items-center gap-2">
              <code className="text-[11px] text-white/40 font-mono break-all flex-1">
                {client.id}
              </code>
              <button
                onClick={copyId}
                className="flex-shrink-0 p-1 rounded text-white/20 hover:text-white/50 transition-colors"
              >
                {copied ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Incidents */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              Recent incidents
            </span>
            <span className="text-[11px] text-white/25">
              {forbiddenEvents.length} total
            </span>
          </div>

          {forbiddenEvents.length === 0 ? (
            <div className="text-xs text-white/25 py-4 text-center">
              No incidents recorded
            </div>
          ) : (
            <div className="space-y-2">
              {forbiddenEvents.slice(0, 8).map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between py-2 border-b border-white/[0.04]"
                >
                  <code className="text-xs text-rose-300 font-mono truncate flex-1">
                    {ev.processName}
                  </code>
                  <span className="text-[10px] text-white/25 flex-shrink-0 ml-2">
                    {new Date(ev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <button
          onClick={handleRotate}
          disabled={rotating}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-xs text-white/40 hover:text-white/70 transition-all disabled:opacity-40"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${rotating ? "animate-spin" : ""}`}
          />
          {rotated ? "Key rotated!" : rotating ? "Rotating…" : "Rotate API Key"}
        </button>
      </div>
    </aside>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <span className="block text-[10px] font-medium text-white/30 uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className={`text-sm text-white/65 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </span>
    </div>
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
