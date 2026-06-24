import React, { useState, useEffect } from 'react';

/**
 * Pipeline step definitions with icons, labels, and color themes.
 * Order matches the verification pipeline execution sequence.
 */
const STEPS = [
  { key: 'factCheckMs',  label: 'Fact Check',         icon: 'fact_check',    color: '#2563EB', bg: 'rgba(37,99,235,0.08)' },
  { key: 'newsSearchMs', label: 'News Search',        icon: 'newspaper',     color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
  { key: 'webSearchMs',  label: 'Web Search',         icon: 'travel_explore',color: '#0891B2', bg: 'rgba(8,145,178,0.08)' },
  { key: 'credibilityMs',label: 'Source Credibility',  icon: 'verified_user', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  { key: 'llmAnalysisMs',label: 'LLM Analysis',       icon: 'psychology',    color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
];

/**
 * Formats a millisecond value into a readable duration string.
 * - < 1000ms → "123.45 ms"
 * - ≥ 1000ms → "1.23 s"
 */
const formatDuration = (ms) => {
  if (ms === 0 || ms == null) return '—';
  if (ms < 1000) return `${Number(ms).toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
};

/**
 * PerformanceMetrics
 *
 * Renders a premium, animated card showing the timing breakdown
 * of each verification pipeline step with proportional bars.
 *
 * @param {{ performance: import('../../../Backend/FND_Backend/src/agents/AgentTypes').VerificationPerformance }} props
 */
const PerformanceMetrics = ({ performance }) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Trigger the bar width animation after mount
    const raf = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(raf);
  }, [performance]);

  if (!performance) return null;

  const totalMs = performance.totalMs || 0;

  // Compute the max step value (excluding totalMs) for bar scaling
  const stepValues = STEPS.map((s) => performance[s.key] || 0);
  const maxStep = Math.max(...stepValues, 1); // prevent division by zero

  // Count how many steps were actually executed (value > 0)
  const activeSteps = stepValues.filter((v) => v > 0).length;

  return (
    <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[18px]">speed</span>
          </div>
          <div>
            <h3 className="font-label-md text-label-md font-bold text-on-surface leading-none">
              Pipeline Performance
            </h3>
            <span className="font-label-sm text-[11px] text-on-surface-variant">
              {activeSteps} of {STEPS.length} steps executed
            </span>
          </div>
        </div>

        {/* Total duration badge */}
        <div className="flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/60 rounded-full px-3 py-1">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">timer</span>
          <span className="font-label-sm text-[12px] font-bold text-on-surface tabular-nums">
            {formatDuration(totalMs)}
          </span>
          <span className="font-label-sm text-[10px] text-on-surface-variant">total</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-outline-variant/60 mx-5" />

      {/* Steps list */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {STEPS.map((step) => {
          const value = performance[step.key] || 0;
          const pct = maxStep > 0 ? (value / maxStep) * 100 : 0;
          const isActive = value > 0;

          return (
            <div key={step.key} className="flex items-center gap-3 group">
              {/* Icon */}
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

              {/* Label + bar */}
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

                {/* Progress bar track */}
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
      </div>

      {/* Footer summary */}
      <div className="px-5 py-3 bg-surface-container-low border-t border-outline-variant/40 flex items-center justify-between">
        <span className="font-label-sm text-[11px] text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">info</span>
          Measured via high-resolution timers (process.hrtime)
        </span>
        <div className="flex items-center gap-2">
          {STEPS.map((step) => {
            const isActive = (performance[step.key] || 0) > 0;
            return (
              <div
                key={step.key}
                className="w-2 h-2 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: isActive ? step.color : 'var(--color-outline-variant)',
                }}
                title={`${step.label}: ${formatDuration(performance[step.key])}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
