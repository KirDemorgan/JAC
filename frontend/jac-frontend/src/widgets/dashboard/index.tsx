"use client";

import React from "react";
import {
  Monitor,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import type {
  ClientDevice,
  Alert,
  ForbiddenProcess,
  TickerAlert,
} from "../../shared/types";

interface DashboardTabProps {
  tickerAlerts: TickerAlert[];
  clients: ClientDevice[];
  alerts: Alert[];
  rules: ForbiddenProcess[];
  onResolveAlert: (id: string) => Promise<void>;
}

export function DashboardTab({
  tickerAlerts,
  clients,
  alerts,
  rules,
  onResolveAlert,
}: DashboardTabProps) {
  const connected = clients.filter((c) => c.connected).length;
  const openAlerts = alerts.filter((a) => a.status === "open");
  const resolved = alerts.filter((a) => a.status === "closed");
  const enabledRules = rules.filter((r) => r.enabled);
  const highOpen = openAlerts.filter((a) => a.severity === "high").length;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Connected"
          value={connected}
          sub={`of ${clients.length} agents`}
          Icon={Monitor}
          variant="emerald"
        />
        <StatCard
          label="Open Alerts"
          value={openAlerts.length}
          sub={highOpen > 0 ? `${highOpen} critical` : "all clear"}
          Icon={AlertTriangle}
          variant={highOpen > 0 ? "rose" : "amber"}
        />
        <StatCard
          label="Active Rules"
          value={enabledRules.length}
          sub={`of ${rules.length} total`}
          Icon={Ban}
          variant="blue"
        />
        <StatCard
          label="Resolved"
          value={resolved.length}
          sub="all time"
          Icon={CheckCircle2}
          variant="muted"
        />
      </div>

      {/* Live ticker */}
      {tickerAlerts.length > 0 && (
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Live feed
            </span>
          </div>
          <div className="space-y-2">
            {tickerAlerts.map((ta) => (
              <div key={ta.id} className="flex items-start gap-3 text-sm">
                <SeverityDot severity={ta.severity} className="mt-1.5" />
                <span className="flex-1 text-white/70 leading-snug">
                  {ta.msg}
                </span>
                <span className="text-white/30 text-xs flex-shrink-0">
                  {ta.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">
            Recent Alerts
          </span>
          <span className="text-xs text-white/25">{alerts.length} total</span>
        </div>

        {alerts.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/25">
            No alerts yet
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {alerts.slice(0, 10).map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onResolve={() => onResolveAlert(alert.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type Variant = "emerald" | "rose" | "amber" | "blue" | "muted";

const VARIANT_CLS: Record<Variant, string> = {
  emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  muted: "text-white/40 bg-white/5 border-white/10",
};

function StatCard({
  label,
  value,
  sub,
  Icon,
  variant,
}: {
  label: string;
  value: number;
  sub?: string;
  Icon: React.ElementType;
  variant: Variant;
}) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center border mb-3 ${VARIANT_CLS[variant]}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-white/30 mt-0.5">{sub}</div>}
      <div className="text-xs text-white/40 mt-1 font-medium">{label}</div>
    </div>
  );
}

function AlertRow({
  alert,
  onResolve,
}: {
  alert: Alert;
  onResolve: () => void;
}) {
  const sevColor =
    { high: "text-rose-400", medium: "text-amber-400", low: "text-blue-400" }[
      alert.severity
    ] ?? "text-white/40";

  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider w-14 flex-shrink-0 ${sevColor}`}
      >
        {alert.severity}
      </span>
      <span className="text-sm text-white/65 flex-1 truncate">
        {alert.message}
      </span>
      <span className="text-[11px] text-white/25 flex-shrink-0 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {new Date(alert.createdAt).toLocaleTimeString()}
      </span>
      {alert.status === "open" ? (
        <button
          onClick={onResolve}
          className="text-[11px] text-white/25 hover:text-emerald-400 transition-colors flex-shrink-0 ml-1"
        >
          Resolve
        </button>
      ) : (
        <span className="text-[11px] text-emerald-400/40 flex-shrink-0 ml-1">
          ✓
        </span>
      )}
    </div>
  );
}

function SeverityDot({
  severity,
  className = "",
}: {
  severity: string;
  className?: string;
}) {
  const cls =
    { high: "bg-rose-400", medium: "bg-amber-400", low: "bg-blue-400" }[
      severity
    ] ?? "bg-white/30";
  return (
    <span
      className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${cls} ${className}`}
    />
  );
}
