import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AgenticVerificationReport from '../components/AgenticVerificationReport';
import { articlesAPI, newsAPI, normalizeVerificationResponse, reportsAPI } from '../services/api';

const VerifyPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('claim');
  const [inputText, setInputText] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveNotes, setSaveNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [myReports, setMyReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchMyReports = async () => {
    try {
      const res = await reportsAPI.getAll();
      setMyReports(res.data?.data || res.data || []);
    } catch (err) {
      console.warn('Could not fetch user reports', err);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchMyReports();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const resetResult = () => {
    setResult(null);
    setError('');
  };

  const getErrorMessage = (err) => (
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    'An error occurred during verification.'
  );

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      let response;
      if (activeTab === 'claim') {
        if (inputText.trim().length < 10) {
          throw new Error('Please enter a claim text of at least 10 characters.');
        }
        response = await newsAPI.check(inputText.trim());
      } else if (activeTab === 'url') {
        if (!inputUrl.trim().startsWith('http')) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }
        response = await newsAPI.urlCheck(inputUrl.trim());
      } else {
        if (inputText.trim().length < 10) {
          throw new Error('Please enter a text block of at least 10 characters.');
        }
        response = await newsAPI.analyze(inputText.trim());
      }

      const normalized = normalizeVerificationResponse(response);
      setResult(normalized);
      sessionStorage.setItem('recent_scan', JSON.stringify(normalized));
      sessionStorage.setItem('recent_scan_raw', JSON.stringify(response.data || response));
      if (normalized.performance) {
        sessionStorage.setItem('recent_scan_performance', JSON.stringify(normalized.performance));
      }
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!result) return;

    try {
      await articlesAPI.save({
        title: result.claim || 'Verified claim',
        url: result.url || result.references?.[0]?.url || 'https://truthlens.verify.info/claim',
        verdict: result.verdict || 'unverified',
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

  const renderLoadingState = () => (
    <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div>
          <h3 className="font-headline-md text-[20px] font-bold text-on-surface">Agentic verification running</h3>
          <p className="text-sm text-on-surface-variant">Planner, evidence, credibility, reasoning, and report agents are executing.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {['Collecting evidence', 'Scoring sources', 'Generating report'].map((label) => (
          <div key={label} className="h-20 rounded-lg border border-outline-variant bg-surface-bright p-4 animate-pulse">
            <div className="h-3 w-2/3 bg-outline-variant rounded-full mb-3" />
            <div className="h-2 w-full bg-outline-variant/70 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-y-auto w-full">
        <Header title="Verify Information" />

        <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-gutter">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            <div className="lg:col-span-2 flex flex-col gap-gutter">
              <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm">
                <div className="flex border-b border-outline-variant mb-6 overflow-x-auto">
                  {[
                    ['claim', 'Verify Claim'],
                    ['url', 'Verify URL'],
                    ['analyze', 'Deep Analysis'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setActiveTab(key); resetResult(); }}
                      className={`pb-3 font-label-md text-label-md px-4 border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                        activeTab === key
                          ? 'border-primary text-primary font-bold'
                          : 'border-transparent text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
                        {activeTab === 'analyze' ? 'Text block to analyze' : 'Statement or claim to check'}
                      </label>
                      <textarea
                        id="claim"
                        rows={activeTab === 'analyze' ? 6 : 4}
                        placeholder={
                          activeTab === 'analyze'
                            ? 'Paste a full paragraph, article chunk, or statement here.'
                            : 'e.g., "COVID-19 vaccines contain microchips for tracking people."'
                        }
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface p-3 input-focus-ring transition-all resize-y"
                        required
                      />
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-error-container text-on-error-container rounded-lg font-label-sm text-label-sm border border-error-container flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      <span>{error}</span>
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

              {loading && renderLoadingState()}

              {!loading && result && (
                <AgenticVerificationReport
                  report={result}
                  performance={result.performance}
                  compact
                  onSave={() => setSaveModalOpen(true)}
                  onOpenDetails={result.id ? () => navigate(`/report/${result.id}`) : null}
                />
              )}
            </div>

            <aside className="flex flex-col gap-gutter">
              <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm">
                <h2 className="font-headline-md text-[20px] font-bold text-on-surface mb-2">
                  Submit Feedback
                </h2>
                <p className="font-body-md text-[14px] text-on-surface-variant mb-4">
                  Report an incorrect verdict or missing evidence to the administration team.
                </p>

                {reportSuccess && (
                  <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg font-label-sm text-label-sm border border-green-200">
                    Report submitted successfully.
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
                      placeholder="e.g. Inaccurate verdict"
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
                      placeholder="Explain what is incorrect or what information is missing."
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-body-md p-2 input-focus-ring text-sm resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reportLoading}
                    className="w-full bg-secondary hover:bg-secondary-container text-white py-2 rounded-lg font-label-md text-label-md cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </div>

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
                            {report.title || 'Untitled report'}
                          </p>
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full border ${
                            report.status === 'pending'
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : report.status === 'reviewed'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : 'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {report.status || 'unknown'}
                          </span>
                        </div>
                        <p className="font-body-md text-[12px] text-on-surface-variant line-clamp-2">
                          {report.description || 'No description provided.'}
                        </p>
                        <span className="text-[10px] text-outline self-end">
                          {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Not Available'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="font-body-md text-[13px] text-on-surface-variant italic">
                      You have not submitted any reports yet.
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        {saveModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-lg flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
                  Save Verification
                </h3>
                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  className="p-1 hover:text-error cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {saveSuccess ? (
                <div className="p-4 text-center text-green-800 font-label-md">
                  Saved successfully.
                </div>
              ) : (
                <form onSubmit={handleSaveArticle} className="flex flex-col gap-3">
                  <p className="font-body-md text-sm text-on-surface-variant">
                    Save this verification to review later or attach personal notes.
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-xs text-on-surface" htmlFor="notes">
                      Notes (Optional)
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      placeholder="Add context for later review."
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
