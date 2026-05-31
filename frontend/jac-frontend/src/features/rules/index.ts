"use client";

import { useState, useCallback } from "react";
import { apiRequest } from "../../shared/api/client";
import type { ForbiddenProcess } from "../../shared/types";

export interface RulesState {
  rules: ForbiddenProcess[];
  newPattern: string;
  setNewPattern: (v: string) => void;
  newMatchType: "exact" | "contains" | "regex";
  setNewMatchType: (v: "exact" | "contains" | "regex") => void;
  newSeverity: "low" | "medium" | "high";
  setNewSeverity: (v: "low" | "medium" | "high") => void;
  newDescription: string;
  setNewDescription: (v: string) => void;
  addingRule: boolean;
  fetchRules: () => Promise<void>;
  addRule: () => Promise<void>;
  deleteRule: (id: number) => Promise<void>;
  clearRules: () => void;
}

export function useRules(): RulesState {
  const [rules, setRules] = useState<ForbiddenProcess[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [newMatchType, setNewMatchType] = useState<
    "exact" | "contains" | "regex"
  >("contains");
  const [newSeverity, setNewSeverity] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [newDescription, setNewDescription] = useState("");
  const [addingRule, setAddingRule] = useState(false);

  const fetchRules = useCallback(async () => {
    const data = await apiRequest<ForbiddenProcess[]>("/api/forbidden-processes");
    if (Array.isArray(data)) setRules(data);
  }, []);

  const addRule = useCallback(async () => {
    if (!newPattern.trim()) return;
    setAddingRule(true);
    try {
      const created = await apiRequest<ForbiddenProcess>(
        "/api/forbidden-processes",
        {
          method: "POST",
          body: JSON.stringify({
            pattern: newPattern.trim(),
            matchType: newMatchType,
            severity: newSeverity,
            description: newDescription,
            enabled: true,
          }),
        }
      );
      if (created) {
        setRules((prev) => [...prev, created]);
        setNewPattern("");
        setNewDescription("");
      }
    } finally {
      setAddingRule(false);
    }
  }, [newPattern, newMatchType, newSeverity, newDescription]);

  const deleteRule = useCallback(async (id: number) => {
    await apiRequest(`/api/forbidden-processes/${id}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clearRules = useCallback(() => {
    setRules([]);
  }, []);

  return {
    rules,
    newPattern,
    setNewPattern,
    newMatchType,
    setNewMatchType,
    newSeverity,
    setNewSeverity,
    newDescription,
    setNewDescription,
    addingRule,
    fetchRules,
    addRule,
    deleteRule,
    clearRules,
  };
}
