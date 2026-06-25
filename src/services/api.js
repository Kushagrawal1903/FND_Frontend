import axios from 'axios';

const API = axios.create({
  baseURL: '', // Using Vite proxy configured in vite.config.js
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on the login page already, reload to trigger auth state reset
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (name, email, password) => API.post('/api/auth/register', { name, email, password }),
  login: (email, password) => API.post('/api/auth/login', { email, password }),
  logout: () => API.post('/api/auth/logout'),
  getMe: () => API.get('/api/auth/me'),
};

export const newsAPI = {
  check: (claim) => API.post('/api/news/check', { claim }),
  analyze: (newsText) => API.post('/api/v1/news-analysis/analyze', { newsText }),
  urlCheck: (url) => API.post('/api/news/url-check', { url }),
  getFactCheck: (id) => API.get(`/api/news/check/${id}`),
};

const PIPELINE_ORDER = ['planner', 'content', 'evidence', 'credibility', 'reasoning', 'verification', 'report'];
const NOT_AVAILABLE = 'Not Available';

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
};

const asObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const compact = (items) => items.filter((item) => item !== undefined && item !== null && item !== '');

const normalizeVerdict = (value) => {
  const verdict = String(value || '').toLowerCase().trim();
  if (['true', 'real', 'likely true'].includes(verdict)) return 'true';
  if (['false', 'fake', 'likely false'].includes(verdict)) return 'false';
  if (['mixed', 'mixture', 'misleading'].includes(verdict)) return 'mixture';
  return 'unverified';
};

const getHost = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return NOT_AVAILABLE;
  }
};

const getResponseBody = (response) => response?.data ?? response ?? {};

const getResponseData = (response) => {
  const body = getResponseBody(response);
  return body?.data ?? body;
};

const getWorkflow = (payload, verification) => {
  const agentDetails = asObject(verification.agentDetails || payload.agentDetails);
  return asObject(
    agentDetails.workflowState ||
    verification.workflowState ||
    payload.workflowState ||
    payload.report?.workflowState
  );
};

const getAgenticReport = (payload, verification, workflow) => {
  const agentDetails = asObject(verification.agentDetails || payload.agentDetails);
  return asObject(
    workflow.report ||
    payload.report ||
    agentDetails.report ||
    payload.agentReport
  );
};

const collectEvidenceCards = (evidence = [], credibility = []) => {
  const credibilityByUrl = new Map();
  credibility.forEach((item) => {
    if (item?.url) credibilityByUrl.set(item.url, item);
  });

  const cards = [];
  evidence.forEach((item, evidenceIndex) => {
    const result = asObject(item?.result);
    const evidenceType = item?.toolName || result.provider || 'Evidence';

    asArray(result.claims).forEach((claim, claimIndex) => {
      asArray(claim?.reviews).forEach((review, reviewIndex) => {
        const url = review?.url || '';
        const sourceCredibility = credibilityByUrl.get(url);
        cards.push({
          id: `${evidenceIndex}-claim-${claimIndex}-${reviewIndex}`,
          title: review?.title || claim?.text || 'Fact-check review',
          url,
          source: review?.publisher || claim?.claimant || getHost(url),
          snippet: claim?.text || review?.rating || NOT_AVAILABLE,
          credibilityScore: sourceCredibility?.trustScore ?? sourceCredibility?.score ?? NOT_AVAILABLE,
          evidenceType,
          verdict: review?.rating || review?.verdict || NOT_AVAILABLE,
          raw: { claim, review, evidence: item },
        });
      });
    });

    asArray(result.credibility?.sources).forEach((source, sourceIndex) => {
      const url = source?.url || '';
      const sourceCredibility = credibilityByUrl.get(url);
      cards.push({
        id: `${evidenceIndex}-source-${sourceIndex}`,
        title: source?.publisher || getHost(url),
        url,
        source: source?.publisher || getHost(url),
        snippet: source?.verdict || NOT_AVAILABLE,
        credibilityScore: sourceCredibility?.trustScore ?? sourceCredibility?.score ?? NOT_AVAILABLE,
        evidenceType,
        verdict: source?.verdict || NOT_AVAILABLE,
        raw: { source, evidence: item },
      });
    });

    asArray(result.results).forEach((searchResult, resultIndex) => {
      const url = searchResult?.url || '';
      const sourceCredibility = credibilityByUrl.get(url);
      cards.push({
        id: `${evidenceIndex}-result-${resultIndex}`,
        title: searchResult?.title || getHost(url),
        url,
        source: searchResult?.publisher || getHost(url),
        snippet: searchResult?.snippet || searchResult?.content || NOT_AVAILABLE,
        credibilityScore: sourceCredibility?.trustScore ?? sourceCredibility?.score ?? NOT_AVAILABLE,
        evidenceType,
        verdict: searchResult?.verdict || NOT_AVAILABLE,
        raw: { searchResult, evidence: item },
      });
    });
  });

  const seen = new Set();
  return cards.filter((card) => {
    const key = compact([card.url, card.title, card.source]).join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const collectReferences = (report, verification, evidenceCards) => {
  const refs = [
    ...asArray(report.references),
    ...asArray(verification.sources),
    ...evidenceCards.map((card) => ({
      publisher: card.source,
      url: card.url,
      verdict: card.verdict,
    })),
  ];

  const seen = new Set();
  return refs
    .filter((ref) => ref?.url || ref?.publisher || ref?.name)
    .map((ref) => ({
      publisher: ref.publisher || ref.name || getHost(ref.url),
      url: ref.url || '',
      verdict: ref.verdict || ref.rating || NOT_AVAILABLE,
    }))
    .filter((ref) => {
      const key = `${ref.publisher}|${ref.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const normalizePipeline = (workflow, timings = {}) => {
  const history = asArray(workflow.executionHistory);
  const agentsFromHistory = history.filter((entry) => entry?.type === 'agent');
  const latestByAgent = new Map();

  agentsFromHistory.forEach((entry) => {
    latestByAgent.set(entry.agent, entry);
  });

  const agentTimings = asObject(timings.agents || workflow.timings?.agents);

  return PIPELINE_ORDER.map((agent) => {
    const entry = latestByAgent.get(agent);
    const durationMs = toNumber(entry?.durationMs ?? agentTimings[agent], 0);
    const hasErrors = asArray(entry?.errors).length > 0;
    const executed = Boolean(entry || durationMs > 0);

    return {
      agent,
      label: agent.charAt(0).toUpperCase() + agent.slice(1),
      status: !executed ? 'not_run' : hasErrors ? 'failed' : 'success',
      success: executed && !hasErrors,
      durationMs,
      startedAt: entry?.startedAt || NOT_AVAILABLE,
      endedAt: entry?.endedAt || NOT_AVAILABLE,
      retries: toNumber(entry?.retries, 0),
      output: entry?.output,
      errors: asArray(entry?.errors),
    };
  });
};

export const normalizeVerificationResponse = (response) => {
  const body = getResponseBody(response);
  const payload = getResponseData(response);
  const data = payload?.verification || payload;
  const verification = asObject(data);
  const workflow = getWorkflow(payload, verification);
  const report = getAgenticReport(payload, verification, workflow);
  const agentDetails = asObject(verification.agentDetails || payload.agentDetails);
  const executionMetadata = asObject(
    report.executionMetadata ||
    agentDetails.executionMetadata ||
    workflow.report?.executionMetadata
  );
  const performance = asObject(
    body.performance ||
    payload.performance ||
    verification.performance ||
    executionMetadata.timings ||
    workflow.timings
  );
  const credibility = asArray(report.credibility || workflow.credibility || agentDetails.credibility);
  const evidence = asArray(report.evidence || workflow.evidence || agentDetails.evidence);
  const evidenceCards = collectEvidenceCards(evidence, credibility);
  const references = collectReferences(report, verification, evidenceCards);
  const reasoning = asArray(
    report.reasoning ||
    workflow.reasoning?.reasoning ||
    agentDetails.reasoning ||
    verification.reasoning
  );
  const supportingEvidence = asArray(report.supportingEvidence || workflow.reasoning?.supportingEvidence);
  const conflictingEvidence = asArray(report.conflictingEvidence || workflow.reasoning?.conflictingEvidence);
  const normalizedVerdict = normalizeVerdict(verification.verdict || report.verdict || workflow.reasoning?.verdict);
  const confidence = toNumber(verification.confidence ?? report.confidence ?? workflow.confidence, 0);
  const pipeline = normalizePipeline(workflow, performance);
  const createdAt = verification.createdAt || workflow.endedAt || executionMetadata.timestamp || new Date().toISOString();

  return {
    id: verification._id || payload._id || '',
    claim: verification.claim || workflow.extractedClaim || executionMetadata.extractedClaim || payload.extractedTitle || payload.url || NOT_AVAILABLE,
    verdict: normalizedVerdict,
    rawVerdict: verification.verdict || report.verdict || NOT_AVAILABLE,
    confidence,
    explanation: report.explanation || workflow.reasoning?.explanation || verification.explanation || report.summary || NOT_AVAILABLE,
    summary: report.summary || verification.explanation || NOT_AVAILABLE,
    reasoning: reasoning.length > 0 ? reasoning : compact([verification.explanation]),
    supportingEvidence,
    conflictingEvidence,
    evidenceCards,
    references,
    sources: references,
    credibility,
    pipeline,
    workflow,
    report,
    agentDetails,
    performance,
    analysis: payload.analysis || null,
    url: payload.url || '',
    extractedTitle: payload.extractedTitle || '',
    createdAt,
    metadata: {
      evidenceRound: workflow.metadata?.evidenceRound ?? executionMetadata.evidenceRound ?? 0,
      sourceCount: references.length,
      searchCount: evidence.filter((item) => /search|factcheck/i.test(String(item?.toolName || ''))).length,
      retries: workflow.retries || executionMetadata.retries || {},
      confidenceThreshold: workflow.metadata?.confidenceThreshold ?? report.executionMetadata?.confidenceThreshold ?? 75,
      timestamp: createdAt,
      visitedTools: workflow.visitedTools || executionMetadata.visitedTools || [],
      errors: workflow.errors || executionMetadata.errors || [],
    },
    raw: body,
    originalPayload: payload,
    verificationRecord: verification,
  };
};

export const articlesAPI = {
  save: (article) => API.post('/api/users/saved-articles', article),
  getAll: () => API.get('/api/users/saved-articles'),
  delete: (id) => API.delete(`/api/users/saved-articles/${id}`),
};

export const reportsAPI = {
  submit: (title, description) => API.post('/api/reports', { title, description }),
  getAll: () => API.get('/api/reports'),
};

export const adminAPI = {
  getAnalytics: () => API.get('/api/admin/analytics'),
  getUsers: () => API.get('/api/admin/users'),
  deleteUser: (id) => API.delete(`/api/admin/users/${id}`),
  getReports: () => API.get('/api/admin/reports'),
  updateReport: (id, data) => API.put(`/api/admin/reports/${id}`, data),
  deleteReport: (id) => API.delete(`/api/admin/reports/${id}`),
  getFactChecks: () => API.get('/api/admin/factchecks'),
  deleteFactCheck: (id) => API.delete(`/api/admin/factchecks/${id}`),
};

export default API;
