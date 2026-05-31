"use client";

import React from "react";
import { ScrollText, Skull, Activity } from "lucide-react";
import type { ProcessEvent } from "../../shared/types";

interface EventsLogTabProps {
  logs: ProcessEvent[];
}

export function EventsLogTab({ logs }: EventsLogTabProps) {
  if (logs.length === 0) {
    return (
      <div className="glass-panel rounded-xl py-20 text-center">
        <ScrollText className="w-10 h-10 text-white/15 mx-auto mb-3" />
        <p className="text-sm text-white/30">No process events recorded yet</p>
        <p className="text-xs text-white/20 mt-1">
          Events appear when agents report forbidden processes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-white/35">
        <span className="text-white font-medium">{logs.length}</span> events
        recorded
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {[
                "Time",
                "Process",
                "PID",
                "Status",
                "Client",
                "Forbidden",
              ].map((h) => (
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
            {logs.map((ev) => (
              <EventRow key={ev.id} event={ev} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ProcessEvent }) {
  const isForbidden = event.matchesForbidden;
  const isKilled = event.status === "KILLED";

  return (
    <tr className="hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3 text-xs text-white/35 font-mono whitespace-nowrap">
        {new Date(event.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isForbidden ? (
            <Skull className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
          ) : (
            <Activity className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          )}
          <code
            className={`text-sm font-mono ${
              isForbidden ? "text-rose-300" : "text-white/70"
            }`}
          >
            {event.processName}
          </code>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-white/30 font-mono">
        {event.pid || "—"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
            isKilled
              ? "text-rose-400 bg-rose-400/10 border-rose-400/20"
              : "text-white/40 bg-white/5 border-white/10"
          }`}
        >
          {event.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-white/35 font-mono max-w-[120px] truncate">
        {event.clientId?.slice(0, 8)}…
      </td>
      <td className="px-4 py-3">
        {isForbidden ? (
          <span className="text-[11px] text-rose-400 font-medium">Yes</span>
        ) : (
          <span className="text-[11px] text-white/25">No</span>
        )}
      </td>
    </tr>
  );
}
