import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AgenticVerificationReport from '../components/AgenticVerificationReport';
import { articlesAPI, newsAPI, normalizeVerificationResponse } from '../services/api';

const ReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const normalizeSavedArticle = (article) => normalizeVerificationResponse({
    data: {
      status: 'success',
      data: {
        _id: article._id,
        claim: article.title,
        verdict: article.verdict,
        confidence: article.verdict === 'true' ? 95 : article.verdict === 'false' ? 85 : article.verdict === 'mixture' ? 60 : 25,
        explanation: article.notes || `This saved item was previously marked as ${String(article.verdict || 'unverified').toUpperCase()}.`,
        sources: [
          { publisher: 'Saved Article', url: article.url, verdict: article.verdict },
        ],
        createdAt: article.createdAt,
      },
    },
  });

  const fetchReportDetails = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      try {
        const dbRes = await newsAPI.getFactCheck(id);
        const normalized = normalizeVerificationResponse(dbRes);
        if (normalized.claim && normalized.claim !== 'Not Available') {
          setReport(normalized);
          setLoading(false);
          return;
        }
      } catch (dbErr) {
        console.warn('Could not fetch report from backend, trying client storage.', dbErr);
      }

      const recentScan = sessionStorage.getItem('recent_scan');
      if (recentScan) {
        try {
          const parsed = JSON.parse(recentScan);
          if (parsed.id === id || parsed.claim === id || parsed.verificationRecord?._id === id) {
            setReport(parsed);
            setLoading(false);
            return;
          }
        } catch (storageErr) {
          console.warn('Could not parse recent scan from session storage.', storageErr);
        }
      }

      const res = await articlesAPI.getAll();
      const articles = res.data?.data?.articles ?? res.data?.data ?? res.data ?? [];
      if (Array.isArray(articles)) {
        const matched = articles.find((article) => article._id === id);
        if (matched) {
          setReport(normalizeSavedArticle(matched));
          setLoading(false);
          return;
        }
      }

      setError('Could not find this verification report.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not fetch report details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchReportDetails();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchReportDetails]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-0 md:ml-64 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 font-body-md text-on-surface-variant">Loading verification report...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-y-auto w-full">
        <Header title="Verification Report" />

        <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-gutter">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Verification
            </button>
          </div>

          {error ? (
            <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg text-center shadow-sm">
              <span className="material-symbols-outlined text-error text-[34px] mb-2">error</span>
              <p className="text-error font-semibold">{error}</p>
            </div>
          ) : (
            <AgenticVerificationReport
              report={report}
              performance={report?.performance}
              onSave={null}
              onOpenDetails={null}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportPage;
