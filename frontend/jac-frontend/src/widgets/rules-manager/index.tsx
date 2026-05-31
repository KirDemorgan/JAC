"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ShieldAlert, Loader2, ChevronDown } from "lucide-react";
import type { ForbiddenProcess } from "../../shared/types";

interface RulesManagerTabProps {
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
  onAddRule: () => Promise<void>;
  onDeleteRule: (id: number) => Promise<void>;
}

const SEV_CLS: Record<string, string> = {
  high: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  low: "text-blue-400 bg-blue-400/10 border-blue-400/20",
};

// ─── Accessible custom select ────────────────────────────────────────────────

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SelectOption<T>[];
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 hover:border-white/20 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
      >
        <span>{current?.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/30 flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-white/10 bg-[#131316] shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                opt.value === value
                  ? "bg-white/8 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const MATCH_OPTS: SelectOption<"exact" | "contains" | "regex">[] = [
  { value: "contains", label: "Contains" },
  { value: "exact", label: "Exact match" },
  { value: "regex", label: "Regex" },
];

const SEV_OPTS: SelectOption<"low" | "medium" | "high">[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function RulesManagerTab({
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
  onAddRule,
  onDeleteRule,
}: RulesManagerTabProps) {
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !addingRule) onAddRule();
  };

  return (
    <div className="space-y-6">
      {/* Add rule form */}
      <div className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-medium text-white/70">
            Add Forbidden Rule
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
              Pattern
            </label>
            <input
              type="text"
              value={newPattern}
              onChange={(e) => setNewPattern(e.target.value)}
              onKeyDown={onKey}
              placeholder="e.g. cheatengine.exe"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
              Match type
            </label>
            <CustomSelect
              value={newMatchType}
              onChange={setNewMatchType}
              options={MATCH_OPTS}
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
              Severity
            </label>
            <CustomSelect
              value={newSeverity}
              onChange={setNewSeverity}
              options={SEV_OPTS}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">
            Description
            <span className="normal-case ml-1 text-white/20">(optional)</span>
          </label>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            onKeyDown={onKey}
            placeholder="Why is this process forbidden?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        <button
          onClick={onAddRule}
          disabled={addingRule || !newPattern.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {addingRule ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {addingRule ? "Adding…" : "Add Rule"}
        </button>
      </div>

      {/* Rules list */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-sm font-medium text-white/70">
            Active Rules
          </span>
          <span className="text-xs text-white/25">
            {rules.filter((r) => r.enabled).length} enabled /{" "}
            {rules.length} total
          </span>
        </div>

        {rules.length === 0 ? (
          <div className="py-12 text-center text-sm text-white/25">
            No rules defined — add one above
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} onDelete={onDeleteRule} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  onDelete,
}: {
  rule: ForbiddenProcess;
  onDelete: (id: number) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(rule.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border flex-shrink-0 ${
          SEV_CLS[rule.severity] ?? SEV_CLS.low
        }`}
      >
        {rule.severity}
      </span>

      <code className="text-sm text-white/80 font-mono flex-1 truncate">
        {rule.pattern}
      </code>

      <span className="text-[11px] text-white/30 flex-shrink-0 bg-white/5 px-2 py-0.5 rounded border border-white/8">
        {rule.matchType}
      </span>

      {rule.description && (
        <span className="text-xs text-white/25 flex-shrink-0 max-w-[160px] truncate hidden lg:block">
          {rule.description}
        </span>
      )}

      {!rule.enabled && (
        <span className="text-[10px] text-white/20 flex-shrink-0">
          disabled
        </span>
      )}

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex-shrink-0 p-1.5 rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-400/10 transition-all disabled:opacity-40"
        title="Delete rule"
      >
        <Trash2 className={`w-3.5 h-3.5 ${deleting ? "animate-pulse" : ""}`} />
      </button>
    </div>
  );
}
