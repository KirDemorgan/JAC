export interface ClientDevice {
  id: string;
  clientId: string;
  hostname: string;
  username: string;
  os: string;
  osVersion: string;
  arch: string;
  appVersion: string;
  ip: string;
  connected: boolean;
  lastSeen: string;
  createdAt: string;
  tags?: string;
}

export interface ForbiddenProcess {
  id: number;
  pattern: string;
  matchType: "exact" | "contains" | "regex";
  enabled: boolean;
  severity: "low" | "medium" | "high";
  description: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ProcessEvent {
  id: string;
  clientId: string;
  processName: string;
  pid: number;
  status: string;
  matchesForbidden: boolean;
  startTime: string;
  endTime?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  clientId: string;
  eventId: string;
  severity: string;
  message: string;
  status: "open" | "closed";
  createdAt: string;
  resolvedAt?: string;
}

export interface TickerAlert {
  id: string;
  msg: string;
  time: string;
  severity: string;
}

export type ActiveTab = "dashboard" | "agents" | "rules" | "logs";

export type RealtimeStatus = "connected" | "connecting" | "disconnected";
