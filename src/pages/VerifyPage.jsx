import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { newsAPI, articlesAPI, reportsAPI } from '../services/api';
import AgentExecutionPanel from '../components/AgentExecutionPanel';

const VerifyPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('claim'); // 'claim' | 'url' | 'analyze'
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
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
      setMyReports(res.data.data || res.data || []);
    } catch (err) {
      console.warn('Could not fetch user reports', err);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      let response;
      console.log('[FRONTEND] Analysis request started');
      if (activeTab === 'claim') {
        if (inputText.trim().length < 10) {
          throw new Error('Please enter a claim text of at least 10 characters.');
        }
        console.log('[FRONTEND] Calling: /api/news/check');
        response = await newsAPI.check(inputText);
      } else if (activeTab === 'url') {
        if (!inputUrl.trim().startsWith('http')) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }
        console.log('[FRONTEND] Calling: /api/news/url-check');
        response = await newsAPI.urlCheck(inputUrl);
      } else if (activeTab === 'analyze') {
        if (inputText.trim().length < 10) {
          throw new Error('Please enter a text block of at least 10 characters.');
        }
        console.log('[FRONTEND] Calling: /api/v1/news-analysis/analyze');
        response = await newsAPI.analyze(inputText);
      }

      console.log('[FRONTEND] Response received');
      const data = response.data.data || response.data;
      setResult(data);
      
      // Save verification data to sessionStorage so the Detailed Report page can fetch it
      if (data) {
        sessionStorage.setItem('recent_scan', JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
      setError(err.message || err.response?.data?.message || 'An error occurred during verification.');
    } finally {
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

      await articlesAPI.save({
        title,
        url,
        verdict,
        notes: saveNotes,
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
      return { bg: 'bg-green-100 text-green-800 border-green-200', dot: 'bg-green-500', text: 'VERIFIED TRUE' };
    } else if (v === 'likely_true') {
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500', text: 'LIKELY TRUE' };
    } else if (v === 'false') {
      return { bg: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500', text: 'VERIFIED FALSE' };
    } else if (v === 'likely_false') {
      return { bg: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', text: 'LIKELY FALSE' };
    } else if (v === 'mixture') {
      return { bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500', text: 'MIXED / MISLEADING' };
    } else if (v === 'insufficient_evidence') {
      return { bg: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500', text: 'INSUFFICIENT EVIDENCE' };
    } else {
      return { bg: 'bg-gray-100 text-gray-800 border-gray-200', dot: 'bg-gray-500', text: 'UNVERIFIED' };
    }
  };

  const getTierBadge = (tier) => {
    if (tier === 1) return { bg: 'bg-purple-100 text-purple-800 border-purple-200', text: 'Tier 1 · Official' };
    if (tier === 2) return { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Tier 2 · Media' };
    return { bg: 'bg-gray-100 text-gray-700 border-gray-200', text: 'Tier 3 · Other' };
  };

  // Extract variables for verification record display
  const verificationData = result?.verification || result;

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

              {/* Verification Result Display */}
              {verificationData && (
                <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col gap-6">
                  
                  {result.agenticAnalysis ? (
                    <AgentExecutionPanel agenticData={result.agenticAnalysis} />
                  ) : (
                    <>
                      {/* Verdict Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-outline-variant">
                        <div className="flex flex-col gap-3">
                          <div>
                            <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wide block mb-1">
                              Original Claim
                            </span>
                            <h2 className="font-headline-sm text-base text-on-surface leading-snug font-medium italic">
                              "{result?.originalClaim || verificationData.claim || inputText}"
                            </h2>
                          </div>
                          <div>
                            <span className="font-label-sm text-xs font-bold text-on-surface-variant uppercase tracking-wide block mb-1">
                              Verified Claim
                            </span>
                            <h2 className="font-headline-md text-lg text-on-surface leading-snug font-bold">
                              "{result?.originalClaim || verificationData.claim || inputText}"
                            </h2>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[13px] font-bold ${getVerdictStyle(verificationData.verdict).bg}`}>
                            <span className={`w-2 h-2 rounded-full ${getVerdictStyle(verificationData.verdict).dot}`}></span>
                            {getVerdictStyle(verificationData.verdict).text}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                            Confidence: <strong className="text-on-surface">{verificationData.confidence}%</strong>
                          </span>
                        </div>
                      </div>

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

                      {/* Sources List (existing fact-check sources) */}
                      {verificationData.sources && verificationData.sources.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          <h3 className="font-label-md text-label-md font-bold text-on-surface">
                            Referenced Fact-Checks ({verificationData.sources.length})
                          </h3>
                          
                          <div className="flex flex-col gap-2">
                            {verificationData.sources.map((source, index) => (
                              <div 
                                key={index} 
                                className="flex justify-between items-center p-3 border border-outline-variant/60 rounded-lg hover:border-on-surface transition-all bg-surface-bright"
                              >
                                <div>
                                  <p className="font-label-md text-label-md font-bold text-on-surface">
                                    {source.publisher}
                                  </p>
                                  <a 
                                    href={source.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="font-label-sm text-[12px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                                  >
                                    View Source <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                  </a>
                                </div>

                                <span className="font-label-sm text-label-sm text-on-surface-variant italic">
                                  Verdict: <strong className="text-on-surface capitalize">{source.verdict}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="font-body-md text-body-md text-on-surface-variant italic">
                          No Google Fact-Check tools matched this claim query. This is treated as neutral — not negative evidence.
                        </p>
                      )}
                    </>
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
