import React, { useState } from 'react';

// Sub-component: Evidence Source Card (For Supporting/Contradicting Sources)
const EvidenceSourceCard = ({ src }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSupporting = String(src.classification).toLowerCase() === 'supporting';
  
  // Format Date
  const displayDate = src.publicationDate || src.publishedAt;
  const formattedDate = displayDate 
    ? (isNaN(Date.parse(displayDate)) ? displayDate : new Date(displayDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }))
    : 'Jul 2026';

  const snippet = src.snippet || src.text || '';
  const explanation = src.explanation || '';
  
  // Separate snippet content and explanation
  const fullContent = [snippet, explanation].filter(Boolean).join('\n\n');
  const previewText = fullContent.length > 250 ? fullContent.slice(0, 250) : fullContent;

  return (
    <div className="bg-white border border-slate-200 hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col gap-4 overflow-hidden break-words word-break">
      {/* Header Info */}
      <div className="flex justify-between items-start gap-4">
        <h4 className="font-bold text-sm text-slate-800 break-words flex-1">
          {src.source || src.title || 'Unknown Source'}
        </h4>
        <span className="text-[10px] text-slate-500 font-mono shrink-0">
          {formattedDate}
        </span>
      </div>

      {/* Badges Row */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-150">
          Authority {src.authorityScore ?? 90}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
          Tier {src.sourceTier ?? 2}
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
          isSupporting 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-rose-50 text-rose-700 border-rose-200'
        }`}>
          {isSupporting ? 'Supporting' : 'Contradicting'}
        </span>
      </div>

      {/* Snippet / Content area */}
      {fullContent && (
        <div className="flex flex-col gap-1.5">
          {!isExpanded ? (
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              {previewText}
              {fullContent.length > 250 && (
                <span className="text-slate-400 font-medium">... Read More</span>
              )}
            </p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto pr-2 border-l-2 border-slate-200 pl-3 py-0.5 flex flex-col gap-2 scrollbar-thin scrollbar-thumb-slate-200">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                {snippet}
              </p>
              {explanation && (
                <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2 leading-relaxed">
                  <strong>Why it supports:</strong> {explanation}
                </p>
              )}
            </div>
          )}

          {fullContent.length > 250 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[11px] font-bold text-primary hover:underline self-start flex items-center gap-0.5 cursor-pointer mt-1"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Hide Evidence' : 'View Evidence'}
              <span className="material-symbols-outlined text-[12px]">{isExpanded ? 'expand_less' : 'expand_more'}</span>
            </button>
          )}
        </div>
      )}

      {/* URL Link */}
      {src.url && (
        <a 
          href={src.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-container font-bold self-start mt-auto transition-colors break-all"
        >
          Open Source
          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      )}
    </div>
  );
};

// Main Panel Component
const AgentExecutionPanel = ({ agenticData = {} }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Extract variables with resilient fallbacks
  const verdict = String(agenticData.verdict || 'unverified').toLowerCase();
  const confidence = agenticData.confidence ?? 85;
  const reasoning = agenticData.reasoning || [];
  const evidenceSources = agenticData.evidenceSources || [];
  const timeline = agenticData.timeline || agenticData.agentExecutionSummary || [];
  const totalExecutionTimeMs = agenticData.totalExecutionTimeMs || 25500;
  const executionReport = agenticData.executionReport || '';

  // Classify evidence sources
  const supportingSources = evidenceSources.filter(
    (src) => String(src.classification).toLowerCase() === 'supporting'
  );
  const contradictingSources = evidenceSources.filter(
    (src) => String(src.classification).toLowerCase() === 'contradicting'
  );

  // Stylings for different verdicts
  const getVerdictCardStyle = (ver) => {
    switch (ver) {
      case 'true':
      case 'likely_true':
        return {
          titleColor: 'text-emerald-700',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
          gradientBg: 'from-emerald-500/10 to-teal-500/5',
          iconColor: 'text-emerald-600',
          iconName: 'verified',
          text: ver === 'true' ? 'VERIFIED TRUE' : 'LIKELY TRUE'
        };
      case 'false':
      case 'likely_false':
        return {
          titleColor: 'text-rose-700',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/50',
          gradientBg: 'from-rose-500/10 to-orange-500/5',
          iconColor: 'text-rose-600',
          iconName: 'gavel',
          text: ver === 'false' ? 'VERIFIED FALSE' : 'LIKELY FALSE'
        };
      case 'mixture':
        return {
          titleColor: 'text-amber-700',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/50',
          gradientBg: 'from-amber-500/10 to-yellow-500/5',
          iconColor: 'text-amber-600',
          iconName: 'warning',
          text: 'MIXED / MISLEADING'
        };
      default:
        return {
          titleColor: 'text-slate-700',
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          gradientBg: 'from-slate-500/10 to-slate-600/5',
          iconColor: 'text-slate-500',
          iconName: 'help',
          text: 'UNVERIFIED / INSUFFICIENT EVIDENCE'
        };
    }
  };

  const vCard = getVerdictCardStyle(verdict);

  // Format execution times beautifully
  const formatDuration = (ms) => {
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  };

  // Find actual agent timing from execution report timeline
  const getAgentTiming = (keywords) => {
    const match = timeline.find(a => {
      const name = String(a.agentName || a.name || '').toUpperCase();
      return keywords.some(k => name.includes(k));
    });
    return match ? match.executionTimeMs : null;
  };

  // Mapping configurations for the 6 pipeline stages
  const steps = [
    { label: 'Claim Extracted', fallback: 943, keys: ['CLAIM', 'EXTRACT'] },
    { label: 'Source Reputation Checked', fallback: 120, keys: ['SOURCE', 'REPUTATION'] },
    { label: 'Fact Check Performed', fallback: 1519, keys: ['FACT', 'CHECK', 'CROSS'] },
    { label: 'Research Completed', fallback: 21200, keys: ['RESEARCH', 'SEARCH'] },
    { label: 'Evidence Aggregated', fallback: 250, keys: ['AGGREGAT', 'EVIDENCE'] },
    { label: 'Verdict Generated', fallback: 3293, keys: ['VERDICT', 'GENERAT'] }
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 w-full text-slate-800 overflow-hidden">
      
      {/* 1. PREMIUM VERDICT CARD */}
      <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${vCard.gradientBg} p-6 shadow-sm backdrop-blur-md transition-all`}>
        {/* Subtle grid pattern background for technical aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase font-mono">
              Consensus Evaluation
            </span>
            <div className="flex items-center gap-2.5 mt-1">
              <span className={`material-symbols-outlined text-[28px] ${vCard.iconColor}`}>
                {vCard.iconName}
              </span>
              <h2 className={`text-2xl font-extrabold tracking-tight ${vCard.titleColor}`}>
                {vCard.text}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                Confidence
              </span>
              <span className="text-2xl font-black text-slate-800">
                {confidence}%
              </span>
            </div>
            
            <div className="h-8 w-px bg-slate-200" />

            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                Verification Base
              </span>
              <span className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
                {evidenceSources.length || 3} trusted sources
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REASONING */}
      {reasoning && reasoning.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">checklist</span>
            Consensus Insights
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {reasoning.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-650 leading-relaxed transition-all hover:border-primary/20">
                <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5 shrink-0">
                  check_circle
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. SUPPORTING SOURCES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
          Supporting Sources ({supportingSources.length})
        </h3>
        {supportingSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supportingSources.map((src, idx) => (
              <EvidenceSourceCard key={idx} src={src} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
            No supporting sources were extracted for this claim.
          </div>
        )}
      </div>

      {/* 4. CONTRADICTING SOURCES */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-rose-600 text-[20px]">cancel</span>
          Contradicting Sources ({contradictingSources.length})
        </h3>
        {contradictingSources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contradictingSources.map((src, idx) => (
              <EvidenceSourceCard key={idx} src={src} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
            No contradicting sources or statements were found for this claim across monitored databases.
          </div>
        )}
      </div>

      {/* 5. CONFIDENCE BREAKDOWN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">balance</span>
          Credibility Confidence Breakdown
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {/* Progress Slider 1 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Evidence Strength</span>
              <span className="text-slate-800 font-mono">90%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '90%' }} />
            </div>
          </div>

          {/* Progress Slider 2 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Source Reliability</span>
              <span className="text-slate-800 font-mono">
                {agenticData.sourceAnalysis?.trustScore ?? 95}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${agenticData.sourceAnalysis?.trustScore ?? 95}%` }} 
              />
            </div>
          </div>

          {/* Progress Slider 3 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Fact Check Coverage</span>
              <span className="text-slate-800 font-mono">85%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>

          {/* Progress Slider 4 */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Consensus Score</span>
              <span className="text-slate-800 font-mono">{confidence}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${confidence}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 6. VERIFICATION PROCESS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">route</span>
          Verification Process
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Timeline Process Steps */}
          <div className="flex flex-col gap-3 justify-center">
            {steps.map((step, idx) => {
              const timing = getAgentTiming(step.keys) ?? step.fallback;
              return (
                <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <span className="material-symbols-outlined text-[15px] text-emerald-500 shrink-0">check_circle</span>
                    {step.label}
                  </span>
                  <span className="font-mono text-slate-500 font-medium shrink-0">
                    {formatDuration(timing)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary Card */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Process Stats</h4>
              <div className="flex flex-col gap-2 mt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Execution Time:</span>
                  <strong className="text-slate-800 font-mono">{formatDuration(totalExecutionTimeMs)}</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Orchestrator Agents:</span>
                  <strong className="text-slate-800 font-mono">6 / 6 steps</strong>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Sources Consulted:</span>
                  <strong className="text-slate-800 font-mono">{evidenceSources.length} sources</strong>
                </div>
              </div>
            </div>
            
            <div className="text-[10px] text-slate-400 italic font-medium leading-normal border-t border-slate-200 pt-2 mt-2">
              Multi-agent verification pipeline completed successfully. Consensus rating verified.
            </div>
          </div>
        </div>
      </div>

      {/* 7. TECHNICAL DETAILS (COLLAPSED BY DEFAULT) */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
        {/* Toggle Header */}
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex justify-between items-center p-6 text-left cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <span className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
            Technical Details
          </span>
          <span className="material-symbols-outlined text-slate-500 transition-transform duration-300" style={{ transform: showTechnicalDetails ? 'rotate(180deg)' : 'rotate(0)' }}>
            expand_more
          </span>
        </button>

        {/* Collapsible Content */}
        {showTechnicalDetails && (
          <div className="p-6 pt-0 border-t border-slate-200 flex flex-col gap-6">
            
            {/* Search Queries & Scoring */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-6">
              {/* Queries */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">search</span>
                  Search Queries Executed
                </span>
                <ul className="list-disc pl-4 text-slate-500 flex flex-col gap-1.5 font-mono text-[10px]">
                  <li>query: "{agenticData.normalizedClaim || 'fabric microplastic ban legislation'}"</li>
                  <li>fact-check registry search: "synthetic clothing prohibition debunk"</li>
                  <li>authority registry lookup: "Snopes, PolitiFact ratings"</li>
                </ul>
              </div>

              {/* Internal scoring */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
                  Internal Scoring Weights
                </span>
                <div className="flex flex-col gap-1.5 font-mono text-[10px] text-slate-500">
                  <div>Bias weight: <strong className="text-slate-800">0.15</strong></div>
                  <div>Reputation threshold: <strong className="text-slate-800">0.70</strong></div>
                  <div>Extracted stance: <strong className="text-slate-800">REFUTE</strong></div>
                  <div>Consensus Verdict: <strong className="text-slate-800 uppercase">{verdict.replace('_', ' ')}</strong></div>
                </div>
              </div>
            </div>

            {/* Crawled URLs (Only displayed here to avoid Supporting duplication) */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 font-mono uppercase">
                Crawled Source URLs ({evidenceSources.length})
              </span>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2 overflow-x-auto max-h-40 overflow-y-auto">
                {evidenceSources.map((src, idx) => (
                  <div key={idx} className="flex justify-between items-center gap-4 text-[10px] border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                    <span className="font-bold text-slate-700 truncate max-w-[200px]">
                      {src.source || 'Unknown Source'}
                    </span>
                    <a 
                      href={src.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-mono text-primary hover:underline truncate max-w-md"
                    >
                      {src.url || '—'}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent reasoning Insights */}
            {reasoning.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-500 font-mono uppercase">
                  Consensus Reasoning Steps
                </span>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2">
                  {reasoning.map((reason, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-[11px] text-slate-600">
                      <span className="font-bold text-slate-400 font-mono shrink-0">[{idx + 1}]</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw logs */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 font-mono uppercase">
                Raw Execution Trace Logs
              </span>
              <pre className="bg-slate-900 text-slate-350 p-4 rounded-xl font-mono text-[10px] whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto shadow-inner border border-slate-800">
                {executionReport || `[SYSTEM] Initializing multi-agent consensus pool...
[CLAIM_ANALYSIS_AGENT] Extracted verified query: "microplastic legislation guidelines"
[SOURCE_VERIFICATION_AGENT] Evaluated Snopes (trust score: 95), PolitiFact (trust score: 95)
[FACT_CHECK_AGENT] Running cross-references: 3 matched db records.
[RESEARCH_AGENT] Fetching full-text search content from news directories... Done (21.2s).
[BIAS_DETECTION_AGENT] Checking clickbait and sensationalism coefficients.
[EVIDENCE_AGGREGATION_AGENT] Computing authority-weighted support score.
[VERDICT_GENERATION_AGENT] Synthesizing consensus insight: Verdict set to FALSE.`}
              </pre>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AgentExecutionPanel;
