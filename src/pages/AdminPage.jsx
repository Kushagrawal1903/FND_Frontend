import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { adminAPI } from '../services/api';

const AdminPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totals: { users: 0, factChecks: 0, reports: 0, savedArticles: 0 },
    verdicts: { true: 0, false: 0, mixture: 0, unverified: 0 },
    reports: { pending: 0, reviewed: 0, resolved: 0 },
    averageConfidence: 0,
  });
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('reports'); // 'reports' | 'users'
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch analytics stats
      const statsRes = await adminAPI.getAnalytics();
      if (statsRes.data && statsRes.data.data) {
        setStats(statsRes.data.data.stats || statsRes.data.data);
      }

      // Fetch feedback reports
      const reportsRes = await adminAPI.getReports();
      setReports(reportsRes.data.data || reportsRes.data || []);

      // Fetch users list
      const usersRes = await adminAPI.getUsers();
      setUsers(usersRes.data.data || usersRes.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load administrative details.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (id, status) => {
    try {
      await adminAPI.updateReport(id, { status });
      setReports(reports.map((rep) => (rep._id === id ? { ...rep, status } : rep)));
      
      // Refetch analytics to update numbers
      const statsRes = await adminAPI.getAnalytics();
      if (statsRes.data && statsRes.data.data) {
        setStats(statsRes.data.data.stats || statsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update report status.');
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await adminAPI.deleteReport(id);
      setReports(reports.filter((rep) => rep._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete report.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Deleting this user will cascade delete all their bookmarks and reports. Proceed?')) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(users.filter((usr) => usr._id !== id));
      
      // Refetch statistics to reflect new counts
      const statsRes = await adminAPI.getAnalytics();
      if (statsRes.data && statsRes.data.data) {
        setStats(statsRes.data.data.stats || statsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  // Safe Math calculation for Verdict distributions
  const totalVerdicts = 
    (stats.verdicts?.true || 0) + 
    (stats.verdicts?.false || 0) + 
    (stats.verdicts?.mixture || 0) + 
    (stats.verdicts?.unverified || 0) || 1;

  const pctTrue = Math.round(((stats.verdicts?.true || 0) / totalVerdicts) * 100);
  const pctFalse = Math.round(((stats.verdicts?.false || 0) / totalVerdicts) * 100);
  const pctMixture = Math.round(((stats.verdicts?.mixture || 0) / totalVerdicts) * 100);

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-y-auto w-full">
        <Header title="Admin Dashboard" />

        <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-gutter">
          
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg border border-error-container">
              {error}
            </div>
          )}

          {/* KPI Dashboard Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Users */}
            <div className="bg-surface border border-outline-variant rounded-lg p-stack-md flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Users</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">group</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {stats.totals?.users || users.length}
              </div>
              <div className="text-tertiary font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Active Members</span>
              </div>
            </div>

            {/* Card 2: Checks */}
            <div className="bg-surface border border-outline-variant rounded-lg p-stack-md flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Total Fact Checks</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">fact_check</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {stats.totals?.factChecks || 0}
              </div>
              <div className="text-on-surface-variant font-label-sm text-label-sm">
                Avg Confidence: <strong>{stats.averageConfidence || 0}%</strong>
              </div>
            </div>

            {/* Card 3: Pending */}
            <div className="bg-surface border border-outline-variant rounded-lg p-stack-md flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Pending Feedback</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">pending_actions</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {stats.reports?.pending || reports.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-error font-label-sm text-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Requires attention</span>
              </div>
            </div>

            {/* Card 4: Bookmarks */}
            <div className="bg-surface border border-outline-variant rounded-lg p-stack-md flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Saved Bookmarks</span>
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">bookmark_added</span>
              </div>
              <div className="font-headline-lg text-headline-lg text-on-surface font-bold">
                {stats.totals?.savedArticles || 0}
              </div>
              <div className="text-on-surface-variant font-label-sm text-label-sm">
                Saved by community
              </div>
            </div>

          </section>

          {/* Bento Layout Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 font-body-md text-on-surface-variant">Gathering administrative data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
              
              {/* Left Column: Management Tables (Spans 2 columns) */}
              <div className="lg:col-span-2 flex flex-col gap-gutter">
                
                {/* Section Toggle Tabs */}
                <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm flex gap-4">
                  <button
                    onClick={() => setActiveSubTab('reports')}
                    className={`font-label-md text-label-md py-2 px-4 rounded-lg cursor-pointer transition-all ${
                      activeSubTab === 'reports'
                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    User Feedback Reports ({reports.length})
                  </button>
                  <button
                    onClick={() => setActiveSubTab('users')}
                    className={`font-label-md text-label-md py-2 px-4 rounded-lg cursor-pointer transition-all ${
                      activeSubTab === 'users'
                        ? 'bg-secondary-container text-on-secondary-container font-bold'
                        : 'text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    System User Accounts ({users.length})
                  </button>
                </div>

                {/* Sub Tab: Feedback Reports List */}
                {activeSubTab === 'reports' && (
                  <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-stack-md border-b border-outline-variant bg-surface-bright">
                      <h2 className="font-headline-md text-on-surface text-[18px]">Flagged Feedback Reports</h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low">
                            <th className="p-4 font-medium">Issue</th>
                            <th className="p-4 font-medium">Details</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="font-body-md text-sm">
                          {reports.length > 0 ? (
                            reports.map((report) => (
                              <tr key={report._id} className="border-b border-outline-variant/60 hover:bg-surface-bright transition-colors">
                                <td className="p-4 font-semibold text-on-surface">{report.title}</td>
                                <td className="p-4 text-on-surface-variant max-w-xs truncate">{report.description}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase ${
                                    report.status === 'pending'
                                      ? 'bg-gray-100 text-gray-700 border-gray-200'
                                      : report.status === 'reviewed'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-green-100 text-green-800 border-green-200'
                                  }`}>
                                    {report.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex gap-1.5 justify-end">
                                    <button 
                                      onClick={() => handleUpdateReportStatus(report._id, 'reviewed')}
                                      className="px-2 py-1 text-xs border border-outline-variant hover:border-on-surface rounded bg-surface cursor-pointer"
                                      title="Mark Reviewed"
                                      disabled={report.status === 'reviewed'}
                                    >
                                      Review
                                    </button>
                                    <button 
                                      onClick={() => handleUpdateReportStatus(report._id, 'resolved')}
                                      className="px-2 py-1 text-xs bg-green-700 text-white rounded cursor-pointer"
                                      title="Mark Resolved"
                                      disabled={report.status === 'resolved'}
                                    >
                                      Resolve
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteReport(report._id)}
                                      className="px-2 py-1 text-xs border border-error-container text-error hover:bg-error-container/20 rounded cursor-pointer"
                                      title="Delete Report"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-on-surface-variant italic">
                                No feedback reports submitted yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub Tab: Users Manager List */}
                {activeSubTab === 'users' && (
                  <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-stack-md border-b border-outline-variant bg-surface-bright">
                      <h2 className="font-headline-md text-on-surface text-[18px]">System Users Directory</h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low">
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Email</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="font-body-md text-sm">
                          {users.length > 0 ? (
                            users.map((usr) => (
                              <tr key={usr._id} className="border-b border-outline-variant/60 hover:bg-surface-bright transition-colors">
                                <td className="p-4 font-semibold text-on-surface">{usr.name}</td>
                                <td className="p-4 text-on-surface-variant">{usr.email}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                    usr.role === 'admin' 
                                      ? 'bg-purple-100 text-purple-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {usr.role}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteUser(usr._id)}
                                    className="px-2 py-1 text-xs border border-error-container text-error hover:bg-error-container/20 rounded cursor-pointer disabled:opacity-50"
                                    disabled={usr.email === 'admin@fakenewsdetection.com'} // Protect primary admin
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-on-surface-variant italic">
                                No user accounts registered.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Charts & Statistics Distribution (Spans 1 column) */}
              <div className="flex flex-col gap-gutter">
                
                {/* Donut Chart visualizer for Verdicts */}
                <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col h-72">
                  <h2 className="font-headline-md text-on-surface text-[18px] mb-3">Verdict Distribution</h2>
                  
                  <div className="flex-1 flex items-center justify-center relative">
                    <div 
                      className="w-32 h-32 rounded-full border-[16px] border-surface-container-high relative" 
                      style={{
                        background: `conic-gradient(#22C55E 0% ${pctTrue}%, #EF4444 ${pctTrue}% ${pctTrue + pctFalse}%, #F59E0B ${pctTrue + pctFalse}% 100%)`,
                        maskImage: 'radial-gradient(transparent 55%, black 55%)',
                        WebkitMaskImage: 'radial-gradient(transparent 55%, black 55%)',
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="font-headline-lg text-headline-lg text-on-surface text-[24px] font-bold">
                        {stats.totals?.factChecks || 0}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant text-[10px]">Total Scans</span>
                    </div>
                  </div>

                  <div className="flex justify-between mt-3 font-label-sm text-label-sm text-on-surface-variant">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> True ({pctTrue}%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> False ({pctFalse}%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Mix ({pctMixture}%)</div>
                  </div>
                </div>

                {/* Activity Feed mockup */}
                <div className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex-1 flex flex-col">
                  <h2 className="font-headline-md text-on-surface text-[18px] mb-4">Audit Logs / Feed</h2>
                  <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-outline-variant">
                    
                    <div className="flex gap-3 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface"><span className="font-semibold">Staff Analyst</span> reviewed feedback.</p>
                        <p className="font-body-md text-xs text-on-surface-variant mt-0.5">Report was marked as Reviewed.</p>
                        <span className="font-label-sm text-[10px] text-outline mt-1 block">Just now</span>
                      </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-surface border border-outline-variant flex items-center justify-center shrink-0 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      </div>
                      <div>
                        <p className="font-label-md text-label-md text-on-surface"><span className="font-semibold">Admin</span> deleted a user account.</p>
                        <p className="font-body-md text-xs text-on-surface-variant mt-0.5">Cascaded deletions applied to database.</p>
                        <span className="font-label-sm text-[10px] text-outline mt-1 block">1 hour ago</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminPage;
