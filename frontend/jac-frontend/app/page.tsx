"use client";

import React, { useState, useEffect, useCallback } from "react";

import { useAuth } from "../src/features/auth";
import { useAlerts } from "../src/features/alerts";
import { useClients } from "../src/features/clients";
import { useRules } from "../src/features/rules";
import { useLogs } from "../src/features/logs";
import { useRealtime } from "../src/features/realtime";

import { LoginPage } from "../src/features/auth";
import { Sidebar } from "../src/widgets/sidebar";
import { Header } from "../src/widgets/header";
import { DashboardTab } from "../src/widgets/dashboard";
import { AgentsMonitorTab } from "../src/widgets/agents-monitor";
import { RulesManagerTab } from "../src/widgets/rules-manager";
import { EventsLogTab } from "../src/widgets/events-log";
import { AgentDrawer } from "../src/widgets/agent-drawer";

import type { ActiveTab, TickerAlert } from "../src/shared/types";

export default function JACConsole() {
  const auth = useAuth();
  const alertsFeature = useAlerts();
  const clientsFeature = useClients();
  const rulesFeature = useRules();
  const logsFeature = useLogs();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [tickerAlerts, setTickerAlerts] = useState<TickerAlert[]>([]);

  const handleLogout = useCallback(() => {
    auth.handleLogout();
    alertsFeature.clearAlerts();
    clientsFeature.clearClients();
    rulesFeature.clearRules();
    logsFeature.clearLogs();
    setTickerAlerts([]);
  }, [auth, alertsFeature, clientsFeature, rulesFeature, logsFeature]);

  const { realtimeStatus, connect, disconnect } = useRealtime({
    token: auth.token,
    onAlert: alertsFeature.addAlert,
    onTickerAlert: (ticker) =>
      setTickerAlerts((prev) => [ticker, ...prev.slice(0, 4)]),
    onHeartbeat: (clientId, timestamp) =>
      clientsFeature.updateClientStatus(clientId, true, timestamp),
    onDisconnect: (clientId) =>
      clientsFeature.updateClientStatus(clientId, false),
    refreshClients: clientsFeature.fetchClients,
    refreshLogs: logsFeature.fetchLogs,
  });

  useEffect(() => {
    if (!auth.token) return;
    clientsFeature.fetchClients();
    alertsFeature.fetchAlerts();
    rulesFeature.fetchRules();
    logsFeature.fetchLogs();
    connect();
    return () => disconnect();
  }, [auth.token]);

  const handleRefresh = useCallback(() => {
    clientsFeature.fetchClients();
    alertsFeature.fetchAlerts();
    rulesFeature.fetchRules();
    logsFeature.fetchLogs();
  }, [clientsFeature, alertsFeature, rulesFeature, logsFeature]);

  if (!auth.token) {
    return (
      <LoginPage
        username={auth.username}
        setUsername={auth.setUsername}
        password={auth.password}
        setPassword={auth.setPassword}
        loginError={auth.loginError}
        loadingLogin={auth.loadingLogin}
        rememberMe={auth.rememberMe}
        setRememberMe={auth.setRememberMe}
        handleLogin={auth.handleLogin}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-[#070709] text-white relative font-sans select-none overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] -top-80 -left-60 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] -bottom-40 left-1/3 pointer-events-none animate-pulse" />
      <div className="absolute w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px] -bottom-80 -right-40 pointer-events-none" />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        realtimeStatus={realtimeStatus}
        clientsCount={clientsFeature.clients.length}
        rulesCount={rulesFeature.rules.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col relative overflow-y-auto z-10">
        <Header
          activeTab={activeTab}
          realtimeStatus={realtimeStatus}
          onRefresh={handleRefresh}
        />

        <div className="flex-1 p-8 fade-in">
          {activeTab === "dashboard" && (
            <DashboardTab
              tickerAlerts={tickerAlerts}
              clients={clientsFeature.clients}
              alerts={alertsFeature.alerts}
              rules={rulesFeature.rules}
              onResolveAlert={alertsFeature.resolveAlert}
            />
          )}

          {activeTab === "agents" && (
            <AgentsMonitorTab
              clients={clientsFeature.clients}
              onSelectClient={clientsFeature.viewClientDetails}
            />
          )}

          {activeTab === "rules" && (
            <RulesManagerTab
              rules={rulesFeature.rules}
              newPattern={rulesFeature.newPattern}
              setNewPattern={rulesFeature.setNewPattern}
              newMatchType={rulesFeature.newMatchType}
              setNewMatchType={rulesFeature.setNewMatchType}
              newSeverity={rulesFeature.newSeverity}
              setNewSeverity={rulesFeature.setNewSeverity}
              newDescription={rulesFeature.newDescription}
              setNewDescription={rulesFeature.setNewDescription}
              addingRule={rulesFeature.addingRule}
              onAddRule={rulesFeature.addRule}
              onDeleteRule={rulesFeature.deleteRule}
            />
          )}

          {activeTab === "logs" && (
            <EventsLogTab logs={logsFeature.logs} />
          )}
        </div>
      </main>

      {clientsFeature.selectedClient && (
        <AgentDrawer
          client={clientsFeature.selectedClient}
          events={clientsFeature.selectedClientEvents}
          onClose={clientsFeature.closeClientDetails}
          onRotateKey={clientsFeature.rotateKey}
        />
      )}
    </div>
  );
}
