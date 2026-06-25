import PerformanceMetrics from './PerformanceMetrics';

const NOT_AVAILABLE = 'Not Available';

const formatDuration = (ms) => {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) return NOT_AVAILABLE;
  if (value < 1000) return `${value.toFixed(2)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
};

const formatDate = (value) => {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return date.toLocaleString();
};

const getVerdictStyle = (verdict) => {
  const normalized = String(verdict || '').toLowerCase();
  if (normalized === 'true') {
    return {
      bg: 'bg-green-100 text-green-800 border-green-200',
      bar: 'bg-green-500',
      text: 'TRUE',
      icon: 'verified',
    };
  }
  if (normalized === 'false') {
    return {
      bg: 'bg-red-100 text-red-800 border-red-200',
      bar: 'bg-red-500',
      text: 'FALSE',
      icon: 'dangerous',
    };
  }
  if (normalized === 'mixture') {
    return {
      bg: 'bg-amber-100 text-amber-800 border-amber-200',
      bar: 'bg-amber-500',
      text: 'MIXED',
      icon: 'contrast',
    };
  }
  return {
    bg: 'bg-gray-100 text-gray-800 border-gray-200',
    bar: 'bg-gray-500',
    text: 'UNVERIFIED',
    icon: 'help',
  };
};

const getReliabilityStyle = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized.includes('very_high') || normalized.includes('high')) return 'bg-green-100 text-green-800 border-green-200';
  if (normalized.includes('medium')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (normalized.includes('low')) return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

const safeText = (value) => {
  if (value === 0) return '0';
  if (value === false) return 'No';
  if (value === true) return 'Yes';
  if (value == null || value === '') return NOT_AVAILABLE;
  return String(value);
};

const SectionCard = ({ title, icon, children, action }) => (
  <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm">
    <div className="flex items-start justify-between gap-4 mb-4">
      <h3 className="font-headline-md text-[20px] font-bold text-on-surface flex items-center gap-2">
        {icon && <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>}
        {title}
      </h3>
      {action}
    </div>
    {children}
  </section>
);

const EmptyState = ({ text = 'Not Available' }) => (
  <div className="border border-dashed border-outline-variant rounded-lg p-4 text-on-surface-variant text-sm bg-surface-bright">
    {text}
  </div>
);

const VerdictBadge = ({ verdict }) => {
  const style = getVerdictStyle(verdict);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[13px] font-bold ${style.bg}`}>
      <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
      {style.text}
    </span>
  );
};

const ConfidenceBar = ({ confidence, verdict }) => {
  const style = getVerdictStyle(verdict);
  const value = Math.max(0, Math.min(100, Number(confidence) || 0));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between">
        <div>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Confidence Score</span>
          <p className="font-headline-lg text-[34px] font-bold text-on-surface leading-none">{value}%</p>
        </div>
      </div>
      <div className="h-3 rounded-full bg-outline-variant/40 overflow-hidden">
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

const EvidenceCard = ({ evidence }) => (
  <article className="border border-outline-variant/70 rounded-lg p-4 bg-surface-bright flex flex-col gap-3">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div className="min-w-0">
        <p className="font-label-md text-label-md font-bold text-on-surface break-words">
          {safeText(evidence.title)}
        </p>
        <p className="text-[12px] text-on-surface-variant mt-1">
          Source: <strong className="text-on-surface">{safeText(evidence.source)}</strong>
        </p>
      </div>
      <span className="self-start rounded-full border border-outline-variant bg-surface px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">
        {safeText(evidence.evidenceType)}
      </span>
    </div>

    <p className="text-sm text-on-surface-variant leading-relaxed">
      {safeText(evidence.snippet)}
    </p>

    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-outline-variant/50">
      <div className="flex flex-wrap gap-2 text-[12px]">
        <span className="rounded-full bg-surface border border-outline-variant px-2 py-1">
          Credibility: <strong>{safeText(evidence.credibilityScore)}</strong>
        </span>
        <span className="rounded-full bg-surface border border-outline-variant px-2 py-1">
          Verdict: <strong>{safeText(evidence.verdict)}</strong>
        </span>
      </div>
      {evidence.url ? (
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-semibold"
        >
          Open Source <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      ) : (
        <span className="text-sm text-on-surface-variant">{NOT_AVAILABLE}</span>
      )}
    </div>
  </article>
);

const SourceCredibilityCard = ({ source }) => (
  <article className="border border-outline-variant/70 rounded-lg p-4 bg-surface-bright flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-label-md text-label-md font-bold text-on-surface">
          {safeText(source.domain || source.sourceName || source.publisher || source.url)}
        </p>
        <p className="text-[12px] text-on-surface-variant break-all">{safeText(source.url)}</p>
      </div>
      {source.officialSource && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[13px]">assured_workload</span>
          Official
        </span>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
      <div className="rounded-lg bg-surface border border-outline-variant p-3">
        <span className="block text-on-surface-variant text-[11px] uppercase">Trust Score</span>
        <strong className="text-on-surface">{safeText(source.trustScore ?? source.score)}</strong>
      </div>
      <div className="rounded-lg bg-surface border border-outline-variant p-3">
        <span className="block text-on-surface-variant text-[11px] uppercase">Reliability</span>
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getReliabilityStyle(source.reliability)}`}>
          {safeText(source.reliability)}
        </span>
      </div>
      <div className="rounded-lg bg-surface border border-outline-variant p-3">
        <span className="block text-on-surface-variant text-[11px] uppercase">Historical Confidence</span>
        <strong className="text-on-surface">{safeText(source.historicalConfidence)}</strong>
      </div>
    </div>
    <p className="text-sm text-on-surface-variant leading-relaxed">{safeText(source.reason)}</p>
  </article>
);

const AgentTimeline = ({ pipeline }) => (
  <div className="flex flex-col gap-0">
    {pipeline.map((step, index) => {
      const isSuccess = step.status === 'success';
      const isFailed = step.status === 'failed';
      return (
        <div key={step.agent} className="grid grid-cols-[32px_1fr] gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              isSuccess
                ? 'bg-green-100 text-green-700 border-green-200'
                : isFailed
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}>
              <span className="material-symbols-outlined text-[17px]">
                {isSuccess ? 'check' : isFailed ? 'close' : 'radio_button_unchecked'}
              </span>
            </div>
            {index < pipeline.length - 1 && <div className="w-px h-9 bg-outline-variant" />}
          </div>
          <div className="pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <p className="font-label-md font-bold text-on-surface">{step.label}</p>
              <span className="text-[12px] text-on-surface-variant tabular-nums">
                {formatDuration(step.durationMs)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-[11px]">
              <span className="rounded-full border border-outline-variant bg-surface px-2 py-0.5 capitalize">
                Status: {safeText(step.status).replace('_', ' ')}
              </span>
              <span className="rounded-full border border-outline-variant bg-surface px-2 py-0.5">
                Success: {step.success ? 'Yes' : 'No'}
              </span>
              <span className="rounded-full border border-outline-variant bg-surface px-2 py-0.5">
                Retries: {safeText(step.retries)}
              </span>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

const MetadataGrid = ({ metadata }) => {
  const rows = [
    ['Evidence Round', metadata.evidenceRound],
    ['Number of Sources', metadata.sourceCount],
    ['Number of Searches', metadata.searchCount],
    ['Confidence Threshold', `${metadata.confidenceThreshold}%`],
    ['Execution Timestamp', formatDate(metadata.timestamp)],
    ['Visited Tools', Array.isArray(metadata.visitedTools) && metadata.visitedTools.length ? metadata.visitedTools.join(', ') : NOT_AVAILABLE],
    ['Retries', Object.keys(metadata.retries || {}).length ? JSON.stringify(metadata.retries) : '0'],
    ['Errors', Array.isArray(metadata.errors) ? metadata.errors.length : 0],
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-outline-variant bg-surface-bright p-3">
          <span className="block text-[11px] uppercase text-on-surface-variant font-semibold">{label}</span>
          <span className="text-sm text-on-surface break-words">{safeText(value)}</span>
        </div>
      ))}
    </div>
  );
};

const JsonDetails = ({ data }) => (
  <details className="bg-inverse-surface text-inverse-on-surface rounded-xl overflow-hidden">
    <summary className="cursor-pointer px-4 py-3 font-semibold flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px]">data_object</span>
      Raw JSON
    </summary>
    <pre className="max-h-[520px] overflow-auto p-4 text-[12px] leading-relaxed border-t border-white/10">
      {JSON.stringify(data || {}, null, 2)}
    </pre>
  </details>
);

const AgenticVerificationReport = ({ report, performance, compact = false, onSave, onOpenDetails }) => {
  if (!report) return null;

  const verdictStyle = getVerdictStyle(report.verdict);
  const reasoning = Array.isArray(report.reasoning) && report.reasoning.length > 0 ? report.reasoning : [report.explanation];
  const evidenceCards = Array.isArray(report.evidenceCards) ? report.evidenceCards : [];
  const supportingEvidence = Array.isArray(report.supportingEvidence) ? report.supportingEvidence : [];
  const conflictingEvidence = Array.isArray(report.conflictingEvidence) ? report.conflictingEvidence : [];
  const credibility = Array.isArray(report.credibility) ? report.credibility : [];
  const pipeline = Array.isArray(report.pipeline) ? report.pipeline : [];

  return (
    <div className="flex flex-col gap-gutter">
      <section className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide block mb-1">
              Claim
            </span>
            <h2 className={`${compact ? 'text-[24px]' : 'text-headline-lg'} font-headline-lg text-on-surface leading-tight break-words`}>
              {safeText(report.claim)}
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              Analyzed: {formatDate(report.createdAt)}
            </p>
          </div>
          <div className="flex flex-col gap-3 min-w-[220px]">
            <VerdictBadge verdict={report.verdict} />
            <ConfidenceBar confidence={report.confidence} verdict={report.verdict} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {onSave && (
            <button
              onClick={onSave}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface hover:border-on-surface transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark</span>
              Save
            </button>
          )}
          {onOpenDetails && (
            <button
              onClick={onOpenDetails}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">summarize</span>
              Detailed Report
            </button>
          )}
        </div>
      </section>

      <SectionCard title="Reasoning" icon="psychology">
        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-4 mb-4">
          <p className="text-on-surface-variant leading-relaxed">{safeText(report.explanation)}</p>
        </div>
        <div className="flex flex-col gap-2">
          {reasoning.filter(Boolean).map((item, index) => (
            <div key={index} className="flex gap-3 rounded-lg bg-surface-bright border border-outline-variant/60 p-3">
              <span className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold ${verdictStyle.bg}`}>
                {index + 1}
              </span>
              <p className="text-sm text-on-surface-variant leading-relaxed">{safeText(item)}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`Supporting Evidence (${Math.max(supportingEvidence.length, evidenceCards.length)})`} icon="fact_check">
        {evidenceCards.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {evidenceCards.map((evidence) => <EvidenceCard key={evidence.id} evidence={evidence} />)}
          </div>
        ) : supportingEvidence.length > 0 ? (
          <pre className="whitespace-pre-wrap text-sm bg-surface-bright border border-outline-variant rounded-lg p-4 overflow-auto">
            {JSON.stringify(supportingEvidence, null, 2)}
          </pre>
        ) : (
          <EmptyState text="No supporting evidence returned." />
        )}
      </SectionCard>

      <SectionCard title={`Conflicting Evidence (${conflictingEvidence.length})`} icon="compare_arrows">
        {conflictingEvidence.length > 0 ? (
          <pre className="whitespace-pre-wrap text-sm bg-surface-bright border border-outline-variant rounded-lg p-4 overflow-auto">
            {JSON.stringify(conflictingEvidence, null, 2)}
          </pre>
        ) : (
          <EmptyState text="No conflicting evidence returned." />
        )}
      </SectionCard>

      <SectionCard title={`Source Credibility (${credibility.length})`} icon="verified_user">
        {credibility.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {credibility.map((source, index) => <SourceCredibilityCard key={`${source.domain || source.url || index}-${index}`} source={source} />)}
          </div>
        ) : (
          <EmptyState text="No source credibility details returned." />
        )}
      </SectionCard>

      <SectionCard title="Execution Pipeline" icon="account_tree">
        {pipeline.length > 0 ? <AgentTimeline pipeline={pipeline} /> : <EmptyState text="No agent execution history returned." />}
      </SectionCard>

      <SectionCard title="Workflow Timing" icon="timer">
        <PerformanceMetrics performance={performance || report.performance} />
      </SectionCard>

      <SectionCard title="Execution Metadata" icon="manage_search">
        <MetadataGrid metadata={report.metadata || {}} />
      </SectionCard>

      <JsonDetails data={report.raw || report} />
    </div>
  );
};

export default AgenticVerificationReport;
