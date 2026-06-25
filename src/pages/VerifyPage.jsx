import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { newsAPI, articlesAPI, reportsAPI } from '../services/api';

const VerifyPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('claim'); // 'claim' | 'url' | 'analyze'
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [performanceExpanded, setPerformanceExpanded] = useState(false);
  const [animateWidths, setAnimateWidths] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Save Modal States
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User Reports (Feedback) States
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [myReports, setMyReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const res = await reportsAPI.getAll();
      setMyReports(res.data.data?.reports || res.data.reports || res.data || []);
    } catch (err) {
      console.warn('Could not fetch user reports', err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    const steps = [
      'Extracting Claim...',
      'Checking Sources...',
      'AI Reasoning...',
      'Generating Verdict...'
    ];

    let stepIndex = 0;
    setLoadingStep(steps[0]);
    const intervalId = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setLoadingStep(steps[stepIndex]);
      }
    }, 900);

    try {
      let response;
      if (activeTab === 'claim') {
        if (inputText.trim().length < 10) {
          throw new Error('Please enter a claim text of at least 10 characters.');
        }
        response = await newsAPI.check(inputText);
      } else if (activeTab === 'url') {
        if (!inputUrl.trim().startsWith('http')) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }
        response = await newsAPI.urlCheck(inputUrl);
      } else if (activeTab === 'analyze') {
        if (inputText.trim().length < 10) {
          throw new Error('Please enter a text block of at least 10 characters.');
        }
        response = await newsAPI.analyze(inputText);
      }

      setResult(response.data.data || response.data);
    } catch (err) {
      console.error(err);
      setError(err.message || err.response?.data?.message || 'An error occurred during verification.');
    } finally {
      clearInterval(intervalId);
      setLoading(false);
    }
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!result) return;

    try {
      // Determine format based on response shape
      let title = '';
      let url = '';
      let verdict = '';

      if (result.verification) {
        title = result.extractedTitle || result.verification.claim;
        url = result.url || 'https://truthlens.verify.info/claim';
        verdict = result.verification.verdict;
      } else {
        title = result.claim;
        url = 'https://truthlens.verify.info/claim';
        verdict = result.verdict;
      }

      const metadata = result.verification?.metadata || result.metadata || {};
      const modelUsed = metadata.modelUsed || 'Legacy Fallback (Rule-Based)';
      const sourcesCount = result.verification?.sources?.length || result.sources?.length || 0;

      await articlesAPI.save({
        title,
        url,
        verdict,
        notes: saveNotes,
        modelUsed,
        sourcesCount,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveModalOpen(false);
        setSaveNotes('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save article.');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportTitle || !reportDesc) return;
    setReportLoading(true);
    try {
      await reportsAPI.submit(reportTitle, reportDesc);
      setReportSuccess(true);
      setReportTitle('');
      setReportDesc('');
      fetchMyReports();
      setTimeout(() => setReportSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setReportLoading(false);
    }
  };

  // Helper to format Verdict text and styles
  const getVerdictStyle = (verdict) => {
    const v = String(verdict).toLowerCase();
    if (v === 'true') {
      return {
        bg: 'bg-green-100 text-green-800 border-green-200',
        dot: 'bg-green-500',
        text: 'VERIFIED TRUE',
      };
    } else if (v === 'false') {
      return {
        bg: 'bg-red-100 text-red-800 border-red-200',
        dot: 'bg-red-500',
        text: 'VERIFIED FALSE',
      };
    } else if (v === 'mixture') {
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        text: 'MIXED / MISLEADING',
      };
    } else {
      return {
        bg: 'bg-gray-100 text-gray-800 border-gray-200',
        dot: 'bg-gray-500',
        text: 'UNVERIFIED',
      };
    }
  };

  // Extract variables for verification record display
  const verificationData = result?.verification || result;

  useEffect(() => {
    if (verificationData?.metadata?.timings) {
      setAnimateWidths(false);
      const timer = setTimeout(() => {
        setAnimateWidths(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setAnimateWidths(false);
    }
  }, [verificationData]);

  const timings = verificationData?.metadata?.timings;
  
  const stepsList = timings ? [
    { name: 'Claim Extraction', val: timings.claimExtraction, icon: 'description' },
    { name: 'Google Fact Check', val: timings.googleFactCheck, icon: 'verified' },
    { name: 'NewsAPI', val: timings.newsApi, icon: 'newspaper' },
    { name: 'Tavily Search', val: timings.tavily, icon: 'travel_explore' },
    { name: 'MongoDB History', val: timings.mongoHistory, icon: 'database' },
    { name: 'Evidence Aggregation', val: timings.aggregation, icon: 'hub' },
    { name: 'AI Reasoning', val: timings.llmReasoning, icon: 'psychology' },
    { name: 'Database Save', val: timings.databaseSave, icon: 'save' }
  ].filter(step => step.val !== undefined && step.val !== null) : [];

  let slowestStep = null;
  let fastestStep = null;
  let maxStepTime = 1;

  if (stepsList.length > 0) {
    // Find slowest step
    slowestStep = stepsList.reduce((prev, current) => (prev.val > current.val) ? prev : current);
    // Find fastest step
    fastestStep = stepsList.reduce((prev, current) => (prev.val < current.val) ? prev : current);
    maxStepTime = slowestStep.val || 1;
  }

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-y-auto w-full">
        <Header title="Verify Information" />

        <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-gutter">
          
          {/* Main Grid: Forms left, Info feed right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            
            {/* Input and Results Panel (Spans 2 columns) */}
            <div className="lg:col-span-2 flex flex-col gap-gutter">
              
              {/* Form card */}
              <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm">
                
                {/* Tabs */}
                <div className="flex border-b border-outline-variant mb-6">
                  <button
                    onClick={() => { setActiveTab('claim'); setResult(null); setError(''); }}
                    className={`pb-3 font-label-md text-label-md px-4 border-b-2 cursor-pointer transition-all ${
                      activeTab === 'claim'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Verify Claim
                  </button>
                  <button
                    onClick={() => { setActiveTab('url'); setResult(null); setError(''); }}
                    className={`pb-3 font-label-md text-label-md px-4 border-b-2 cursor-pointer transition-all ${
                      activeTab === 'url'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Verify URL
                  </button>
                  <button
                    onClick={() => { setActiveTab('analyze'); setResult(null); setError(''); }}
                    className={`pb-3 font-label-md text-label-md px-4 border-b-2 cursor-pointer transition-all ${
                      activeTab === 'analyze'
                        ? 'border-primary text-primary font-bold'
                        : 'border-transparent text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Deep Analysis
                  </button>
                </div>

                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  {activeTab === 'url' ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-on-surface" htmlFor="url">
                        URL to Fact-Check
                      </label>
                      <input
                        id="url"
                        type="url"
                        placeholder="https://example.com/news-article-headline"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface p-3 input-focus-ring transition-all"
                        required
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="font-label-sm text-label-sm text-on-surface" htmlFor="claim">
                        {activeTab === 'analyze' ? 'Text block to analyze' : 'Statement/Claim to check'}
                      </label>
                      <textarea
                        id="claim"
                        rows={activeTab === 'analyze' ? 6 : 4}
                        placeholder={
                          activeTab === 'analyze'
                            ? 'Paste a full paragraph, article chunk or statement here. The system will filter stop words, extract keywords and verify the core sentence...'
                            : 'e.g., "The local water reservoir contains toxic levels of arsenic according to a leaked email."'
                        }
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface p-3 input-focus-ring transition-all resize-y"
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-error-container text-on-error-container rounded-lg font-label-sm text-label-sm border border-error-container">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-3 rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                  >
                    {loading ? 'Evaluating...' : 'Initiate Verification'}
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </button>
                </form>
              </div>

              {/* Loading progress card */}
              {loading && (
                <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col justify-center items-center py-10 gap-4">
                  <div className="relative w-12 h-12 flex justify-center items-center">
                    <span className="material-symbols-outlined text-primary text-[40px] animate-spin">sync</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="font-label-md text-label-md font-bold text-on-surface animate-pulse">
                      {loadingStep}
                    </p>
                    <p className="text-[12px] text-on-surface-variant">
                      Querying parallel search engines and running AI logic...
                    </p>
                  </div>
                </div>
              )}

              {/* Verification Result Display */}
              {verificationData && (
                <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col gap-6">
                  
                  {/* Verdict Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-outline-variant">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide block mb-1">
                        Verified Claim
                      </span>
                      <h2 className="font-headline-md text-headline-md text-on-surface leading-snug">
                        "{verificationData.claim}"
                      </h2>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[13px] font-bold ${getVerdictStyle(verificationData.verdict).bg}`}>
                        <span className={`w-2 h-2 rounded-full ${getVerdictStyle(verificationData.verdict).dot}`}></span>
                        {getVerdictStyle(verificationData.verdict).text}
                      </span>
                      {verificationData.metadata?.successfulSources?.length > 1 && (
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-[11px] font-bold mt-1.5 shadow-sm">
                          <span className="material-symbols-outlined text-[12px] font-bold">verified_user</span>
                          Verified using Multiple Trusted Sources
                        </span>
                      )}
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                        Confidence: <strong className="text-on-surface">{verificationData.confidence}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Modern Performance Dashboard Card */}
                  {timings?.totalVerification !== undefined && (
                    <div className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-on-surface flex items-center gap-1.5 text-sm uppercase tracking-wider text-on-surface-variant">
                          <span className="text-amber-500">⚡</span>
                          <span>Total Response Time</span>
                        </span>
                        <span className="font-mono font-bold text-primary text-xl">
                          {timings.totalVerification} ms
                        </span>
                      </div>

                      {/* Animated Highlighted Progress Bar */}
                      <div className="relative w-full h-3.5 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/30">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: animateWidths ? `${Math.min(100, (timings.totalVerification / 10000) * 100)}%` : '0%' }}
                        />
                      </div>

                      {/* Sub-stats for Fastest and Slowest steps */}
                      {fastestStep && slowestStep && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                          {/* Fastest Step */}
                          <div className="bg-green-50/60 border border-green-200/50 rounded-lg p-3.5 flex items-center gap-3">
                            <span className="material-symbols-outlined text-green-600 text-[20px] bg-green-100/80 p-1.5 rounded-full shrink-0 flex items-center justify-center">
                              bolt
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] text-green-700 uppercase font-bold tracking-wider">Fastest Step</span>
                              <span className="font-bold text-on-surface text-sm truncate">{fastestStep.name}</span>
                              <span className="font-mono text-[12px] text-green-600 font-bold">{fastestStep.val} ms</span>
                            </div>
                          </div>

                          {/* Slowest Step */}
                          <div className="bg-red-50/60 border border-red-200/50 rounded-lg p-3.5 flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-600 text-[20px] bg-red-100/80 p-1.5 rounded-full shrink-0 flex items-center justify-center">
                              hourglass_empty
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] text-red-700 uppercase font-bold tracking-wider">Slowest Step</span>
                              <span className="font-bold text-on-surface text-sm truncate">{slowestStep.name}</span>
                              <span className="font-mono text-[12px] text-red-600 font-bold">{slowestStep.val} ms</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verdict explanation */}
                  <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/50">
                    <h3 className="font-label-md text-label-md font-bold text-on-surface mb-1.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">info</span>
                      System Explanation
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                      {verificationData.explanation}
                    </p>
                  </div>

                  {/* Collapsible AI Verification Details */}
                  {verificationData.metadata && (
                    <div className="border border-outline-variant rounded-lg bg-surface-container-low overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setDetailsExpanded(!detailsExpanded)}
                        className="w-full flex justify-between items-center p-4 font-label-md text-label-md font-bold text-on-surface hover:bg-surface-variant/10 transition-all cursor-pointer border-none bg-transparent text-left"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">settings_suggest</span>
                          AI Verification Details
                        </span>
                        <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: detailsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          expand_more
                        </span>
                      </button>
                      
                      {detailsExpanded && (
                        <div className="p-4 border-t border-outline-variant/50 bg-surface flex flex-col gap-3 font-body-md text-body-md text-on-surface-variant">
                          <div className="flex justify-between items-center py-1 border-b border-outline-variant/30">
                            <span>AI Model Used:</span>
                            <span className="font-bold text-on-surface">{verificationData.metadata.modelUsed || 'Legacy Fallback'}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-outline-variant/30">
                            <span>Cache Status:</span>
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${verificationData.metadata.cached ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {verificationData.metadata.cached ? 'Cached' : 'Fresh'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5 py-1">
                            <span className="font-semibold text-on-surface text-[13px]">Successful Sources ({verificationData.metadata.successfulSources?.length || 0}):</span>
                            <div className="flex flex-wrap gap-1">
                              {verificationData.metadata.successfulSources?.length > 0 ? (
                                verificationData.metadata.successfulSources.map((src, i) => (
                                  <span key={i} className="bg-green-50 text-green-700 border border-green-200 rounded px-2 py-0.5 text-[11px] font-medium">
                                    {src}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs italic text-on-surface-variant/70">None</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 py-1">
                            <span className="font-semibold text-on-surface text-[13px]">Failed / Skipped Sources ({verificationData.metadata.failedSources?.length || 0}):</span>
                            <div className="flex flex-wrap gap-1">
                              {verificationData.metadata.failedSources?.length > 0 ? (
                                verificationData.metadata.failedSources.map((src, i) => (
                                  <span key={i} className="bg-red-50 text-red-700 border border-red-200 rounded px-2 py-0.5 text-[11px] font-medium">
                                    {src}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs italic text-on-surface-variant/70">None</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsible Verification Performance */}
                  {timings && (
                    <div className="border border-outline-variant rounded-lg bg-surface-container-low overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPerformanceExpanded(!performanceExpanded)}
                        className="w-full flex justify-between items-center p-4 font-label-md text-label-md font-bold text-on-surface hover:bg-surface-variant/10 transition-all cursor-pointer border-none bg-transparent text-left"
                      >
                        <span className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-[18px]">speed</span>
                          Verification Performance
                        </span>
                        <span className="material-symbols-outlined transition-transform duration-200" style={{ transform: performanceExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          expand_more
                        </span>
                      </button>

                      {performanceExpanded && (
                        <div className="p-4 border-t border-outline-variant/50 bg-surface flex flex-col gap-4">
                          {stepsList.map((step, idx) => {
                            const val = step.val;
                            const pct = maxStepTime > 0 ? (val / maxStepTime) * 100 : 0;
                            
                            // Colors: Green (<500ms), Orange (500–1500ms), Red (>1500ms)
                            let barColor = 'bg-green-500';
                            let textColor = 'text-green-600';
                            let iconColor = 'text-green-600 bg-green-50 border-green-100';

                            if (val >= 1500) {
                              barColor = 'bg-red-500';
                              textColor = 'text-red-600';
                              iconColor = 'text-red-600 bg-red-50 border-red-100';
                            } else if (val >= 500) {
                              barColor = 'bg-orange-500';
                              textColor = 'text-orange-600';
                              iconColor = 'text-orange-600 bg-orange-50 border-orange-100';
                            }

                            return (
                              <div key={idx} className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between font-body-md text-sm">
                                  <div className="flex items-center gap-2 text-on-surface font-semibold min-w-0">
                                    <span className={`material-symbols-outlined text-[16px] p-1.5 border rounded-md shrink-0 flex items-center justify-center ${iconColor}`}>
                                      {step.icon}
                                    </span>
                                    <span className="truncate">{step.name}</span>
                                  </div>
                                  <span className={`font-mono font-bold shrink-0 text-right ${textColor}`}>
                                    {val} ms
                                  </span>
                                </div>
                                <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${barColor} rounded-full transition-all duration-1000 ease-out`}
                                    style={{ width: animateWidths ? `${pct}%` : '0%' }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Keywords (Deep Analysis specific) */}
                  {result.analysis && (
                    <div className="flex flex-col gap-2">
                      <h3 className="font-label-md text-label-md font-bold text-on-surface">Extracted Keywords & Stats</h3>
                      <div className="flex flex-wrap gap-2 items-center">
                        {result.analysis.keywords?.map((word, idx) => (
                          <span key={idx} className="bg-secondary-container text-on-secondary-container rounded-sm px-2 py-0.5 text-xs font-semibold uppercase">
                            {word}
                          </span>
                        ))}
                        <span className="text-on-surface-variant font-label-sm text-label-sm ml-2">
                          Total Word Count: {result.analysis.wordCount}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sources List */}
                  {verificationData.sources && verificationData.sources.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <h3 className="font-label-md text-label-md font-bold text-on-surface">
                        Referenced Fact-Checks ({verificationData.sources.length})
                      </h3>
                      
                      <div className="flex flex-col gap-2">
                        {verificationData.sources.map((source, index) => (
                          <div 
                            key={index} 
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3.5 border border-outline-variant/60 rounded-lg hover:border-on-surface transition-all bg-surface-bright gap-2.5"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[12px] uppercase text-on-surface-variant font-medium tracking-wide">Publisher</span>
                              <p className="font-label-md text-label-md font-bold text-on-surface">
                                {source.publisher}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 justify-between sm:justify-end">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] uppercase text-on-surface-variant/80 font-medium tracking-wide">Verdict</span>
                                <span className="font-bold text-on-surface text-[13px] capitalize bg-surface-container-low border border-outline-variant/30 rounded px-2 py-0.5">
                                  {source.verdict}
                                </span>
                              </div>

                              <div className="flex flex-col gap-0.5 text-right">
                                <span className="text-[11px] uppercase text-on-surface-variant/80 font-medium tracking-wide">Source</span>
                                <a 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="font-label-sm text-[12px] text-primary hover:underline flex items-center gap-1 font-semibold"
                                >
                                  Open Link <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="font-body-md text-body-md text-on-surface-variant italic">
                      No Google Fact-Check tools matched this claim query. Verdict is simulated credibility.
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => setSaveModalOpen(true)}
                      className="flex-1 bg-surface border border-outline-variant hover:border-on-surface text-on-surface font-label-md text-label-md py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                      Save & Bookmarks
                    </button>
                    {verificationData._id && (
                      <button
                        onClick={() => navigate(`/report/${verificationData._id}`)}
                        className="flex-1 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">summarize</span>
                        View Detailed Report
                      </button>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Reports Sidebar (Spans 1 column) */}
            <div className="flex flex-col gap-gutter">
              
              {/* Submit report form */}
              <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm">
                <h2 className="font-headline-md text-[20px] font-bold text-on-surface mb-2">
                  Submit Feedback
                </h2>
                <p className="font-body-md text-[14px] text-on-surface-variant mb-4">
                  Did the model fail or produce an incorrect verdict? Report it to the administration team.
                </p>

                {reportSuccess && (
                  <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg font-label-sm text-label-sm border border-green-200">
                    Report submitted successfully!
                  </div>
                )}

                <form onSubmit={handleReportSubmit} className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-[12px] text-on-surface" htmlFor="rep-title">
                      Title
                    </label>
                    <input
                      id="rep-title"
                      type="text"
                      placeholder="e.g. Inaccurate verdict on fabric ban"
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-body-md p-2 input-focus-ring text-sm"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-[12px] text-on-surface" htmlFor="rep-desc">
                      Detailed Explanation
                    </label>
                    <textarea
                      id="rep-desc"
                      rows={4}
                      placeholder="Explain what is incorrect or what information is missing..."
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-body-md p-2 input-focus-ring text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reportLoading}
                    className="w-full bg-secondary hover:bg-secondary-container text-white py-2 rounded-lg font-label-md text-label-md cursor-pointer transition-colors"
                  >
                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </div>

              {/* My Submitted Reports Feed */}
              <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col gap-4">
                <h3 className="font-label-md text-label-md font-bold text-on-surface">
                  My Feedback Feed ({myReports.length})
                </h3>

                <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1">
                  {myReports.length > 0 ? (
                    myReports.map((report) => (
                      <div key={report._id} className="p-3 border border-outline-variant/60 rounded-lg bg-surface-bright flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-label-md text-label-md font-bold text-on-surface truncate">
                            {report.title}
                          </p>
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${
                            report.status === 'pending'
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : report.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="font-body-md text-[12px] text-on-surface-variant line-clamp-2">
                          {report.description}
                        </p>
                        <span className="text-[10px] text-outline self-end">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="font-body-md text-[13px] text-on-surface-variant italic">
                      You haven't submitted any reports yet.
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Modal: Save to Bookmarks */}
        {saveModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-lg flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
                  Save Article to Bookmarks
                </h3>
                <button 
                  onClick={() => setSaveModalOpen(false)}
                  className="p-1 hover:text-error cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {saveSuccess ? (
                <div className="p-4 text-center text-green-800 font-label-md">
                  Article saved successfully!
                </div>
              ) : (
                <form onSubmit={handleSaveArticle} className="flex flex-col gap-3">
                  <p className="font-body-md text-sm text-on-surface-variant">
                    Save this fact-check to review later or attach personal verification notes.
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-xs text-on-surface" htmlFor="notes">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="e.g. Shared in family group chat. Debunked with PolitiFact link."
                      value={saveNotes}
                      onChange={(e) => setSaveNotes(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-sm p-2 input-focus-ring resize-none"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setSaveModalOpen(false)}
                      className="px-4 py-2 border border-outline-variant text-on-surface hover:border-on-surface rounded-lg font-label-md text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md text-sm cursor-pointer"
                    >
                      Confirm Save
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default VerifyPage;
