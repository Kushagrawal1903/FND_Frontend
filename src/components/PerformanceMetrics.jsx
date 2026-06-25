import { useEffect, useState } from 'react';

const LEGACY_STEPS = [
  { key: 'factCheckMs', label: 'Fact Check', icon: 'fact_check', color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  { key: 'newsSearchMs', label: 'News Search', icon: 'newspaper', color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  { key: 'webSearchMs', label: 'Web Search', icon: 'travel_explore', color: '#0891B2', bg: 'rgba(8,145,178,0.08)' },
  { key: 'credibilityMs', label: 'Source Credibility', icon: 'verified_user', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  { key: 'llmAnalysisMs', label: 'LLM Analysis', icon: 'psychology', color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
];

const formatDuration = (ms) => {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return 'Not Available';
  if (value < 1000) return `${value.toFixed(2)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
};

const toEntries = (value) => Object.entries(value || {})
  .filter(([, duration]) => Number(duration) > 0)
  .sort((a, b) => Number(b[1]) - Number(a[1]));

const TimingRows = ({ title, entries, icon }) => {
  if (!entries.length) return null;

  const max = Math.max(...entries.map(([, duration]) => Number(duration)), 1);

  return (
    <details className="rounded-lg border border-outline-variant/60 bg-surface-bright" open>
      <summary className="cursor-pointer px-4 py-3 font-semibold text-sm text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-[17px]">{icon}</span>
        {title}
      </summary>
      <div className="px-4 pb-4 flex flex-col gap-3">
        {entries.map(([name, duration]) => {
          const pct = Math.max((Number(duration) / max) * 100, 3);
          return (
            <div key={name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="font-semibold text-on-surface capitalize">{name.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-on-surface-variant tabular-nums">{formatDuration(duration)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-outline-variant/40 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
};

const PerformanceMetrics = ({ performance }) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(raf);
  }, [performance]);

  if (!performance) return null;

  const totalMs = Number(performance.totalMs || 0);
  const stepValues = LEGACY_STEPS.map((step) => Number(performance[step.key] || 0));
  const maxStep = Math.max(...stepValues, 1);
  const activeSteps = stepValues.filter((value) => value > 0).length;
  const agentEntries = toEntries(performance.agents);
  const toolEntries = toEntries(performance.tools);

  return (
    <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[18px]">speed</span>
          </div>
          <div>
            <h3 className="font-label-md text-label-md font-bold text-on-surface leading-none">
              Workflow Timing
            </h3>
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              {activeSteps} legacy steps, {agentEntries.length} agents, {toolEntries.length} tools
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/60 rounded-full px-3 py-1 self-start sm:self-auto">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">timer</span>
          <span className="font-label-sm text-[12px] font-bold text-on-surface tabular-nums">
            {formatDuration(totalMs)}
          </span>
          <span className="font-label-sm text-[10px] text-on-surface-variant">total</span>
        </div>
      </div>

      <div className="h-px bg-outline-variant/60 mx-5" />

      <div className="px-5 py-4 flex flex-col gap-3">
        {LEGACY_STEPS.map((step) => {
          const value = Number(performance[step.key] || 0);
          const pct = maxStep > 0 ? (value / maxStep) * 100 : 0;
          const isActive = value > 0;

          return (
            <div key={step.key} className="flex items-center gap-3 group">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-300"
                style={{
                  backgroundColor: isActive ? step.bg : 'transparent',
                  border: isActive ? 'none' : '1px solid var(--color-outline-variant)',
                }}
              >
                <span
                  className="material-symbols-outlined text-[16px] transition-colors duration-300"
                  style={{ color: isActive ? step.color : 'var(--color-outline)' }}
                >
                  {step.icon}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="font-label-sm text-[12px] transition-colors duration-300 truncate"
                    style={{ color: isActive ? 'var(--color-on-surface)' : 'var(--color-outline)' }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="font-label-sm text-[11px] tabular-nums font-semibold ml-2 shrink-0 transition-colors duration-300"
                    style={{ color: isActive ? step.color : 'var(--color-outline)' }}
                  >
                    {formatDuration(value)}
                  </span>
                </div>

                <div className="h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: animateIn ? `${Math.max(pct, isActive ? 2 : 0)}%` : '0%',
                      backgroundColor: isActive ? step.color : 'transparent',
                      opacity: isActive ? 1 : 0,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <TimingRows title="Every Agent Time" entries={agentEntries} icon="account_tree" />
        <TimingRows title="Every Tool Time" entries={toolEntries} icon="construction" />
      </div>

      <div className="px-5 py-3 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between gap-3">
        <span className="font-label-sm text-[11px] text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">info</span>
          Timings are reported by the backend in milliseconds.
        </span>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
