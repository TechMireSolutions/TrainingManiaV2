import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterTraining, setFilterTraining] = useState('All');
  const [filterDate, setFilterDate] = useState('Any date');
  const [notification, setNotification] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    // Fetch real data from Backend
    const fetchReports = async () => {
      try {
        const res = await fetch('/api/admin/reports/');
        if (res.ok) {
          const data = await res.json();
          setReports(data);
        }
      } catch (error) {
        console.error("Failed to load reports:", error);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (reports.length === 0) {
      showNotification("No data to export", 'error');
      return;
    }

    const headers = ["Candidate", "Training Module", "Score", "Total Marks", "Correct", "Wrong", "Skipped", "Status", "Date"];
    const csvRows = [
      headers.join(','), // Header row
      ...reports.map(row => [
        row.candidate,
        `"${row.training}"`, // Quote training name to handle commas
        row.score,
        row.totalMarks,
        row.correct,
        row.wrong,
        row.skipped,
        row.status,
        `"${row.date}"`
      ].join(','))
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "performance_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL reports? This action cannot be undone.")) return;

    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const res = await fetch('/api/admin/reports/?delete_all=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-ID': adminInfo ? adminInfo.id : ''
        }
      });

      if (res.ok) {
        setReports([]);
        showNotification("All reports deleted successfully", 'success');
      } else {
        showNotification("Failed to delete reports", 'error');
      }
    } catch (err) {
      showNotification("Network error", 'error');
    }
  };

  // Reset pagination on search or filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTraining, filterDate]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.candidate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.training.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || report.status === filterStatus;
    const matchesTraining = filterTraining === 'All' || report.training === filterTraining;

    let matchesDate = true;
    if (filterDate !== 'Any date' && report.dateTime) {
      const reportDate = new Date(report.dateTime);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (filterDate === 'Today') {
        matchesDate = reportDate >= startOfToday;
      } else if (filterDate === 'Past 7 days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = reportDate >= sevenDaysAgo;
      } else if (filterDate === 'This month') {
        matchesDate = reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
      } else if (filterDate === 'This year') {
        matchesDate = reportDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesTraining && matchesDate;
  });

  const uniqueTrainings = ['All', ...new Set(reports.map(r => r.training))];

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

  const formatName = (email) => {
    if (!email) return 'Unknown';
    // If it's already a full name (has space, no @), return as is
    if (!email.includes('@')) return email;
    return email.split('@')[0]
      .replace(/[0-9]/g, '')
      .replace(/[\._]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || 'Candidate';
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Reports</h2>
          <p className="text-slate-500">View detailed test results and candidate performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center px-4 py-2 border rounded-xl transition-colors font-medium cursor-pointer ${showFilter ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
              {(filterStatus !== 'All' || filterTraining !== 'All' || filterDate !== 'Any date') && (
                <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full"></span>
              )}
            </button>

            {showFilter && (
              <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-200 h-fit max-h-96 overflow-y-auto">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  By Status
                </div>
                {['All', 'Passed', 'Failed'].map(status => (
                  <button
                    key={status}
                    onClick={() => { setFilterStatus(status); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${filterStatus === status ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-700'}`}
                  >
                    {status}
                    {filterStatus === status && <CheckCircle className="w-4 h-4" />}
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1"></div>

                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  By Training
                </div>
                {uniqueTrainings.map(training => (
                  <button
                    key={training}
                    onClick={() => { setFilterTraining(training); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${filterTraining === training ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-700'}`}
                  >
                    <span className="truncate mr-2">{training}</span>
                    {filterTraining === training && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))}

                <div className="border-t border-slate-100 my-1"></div>

                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  By Date
                </div>
                {['Any date', 'Today', 'Past 7 days', 'This month', 'This year'].map(dateOption => (
                  <button
                    key={dateOption}
                    onClick={() => { setFilterDate(dateOption); setShowFilter(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${filterDate === dateOption ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-slate-700'}`}
                  >
                    {dateOption}
                    {filterDate === dateOption && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200 cursor-pointer"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl flex items-center shadow-2xl transform transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          <span className="font-bold text-sm tracking-wide">{notification.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">All Test Results</h3>
          <div className="flex items-center gap-4">
            {reports.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-bold cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </button>
            )}
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search candidate or training..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/50 w-full sm:w-64 text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Training Module</th>
                <th className="px-6 py-4 text-center">Score</th>
                <th className="px-6 py-4 text-center">Performance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Certificate</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length > 0 ? (
                currentItems.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{formatName(report.candidate)}</span>
                        {/* Only show email subtext if it differs significantly or is an email */}
                        {report.candidate.includes('@') && (
                          <span className="text-xs text-slate-500">{report.candidate}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{report.training}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${report.score >= 40 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {report.score}/{report.totalMarks}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-4 text-xs">
                        <div className="flex items-center text-emerald-600" title="Correct">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {report.correct}
                        </div>
                        <div className="flex items-center text-red-600" title="Wrong">
                          <XCircle className="w-3 h-3 mr-1" />
                          {report.wrong}
                        </div>
                        <div className="flex items-center text-slate-500" title="Skipped">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {report.skipped}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.status === 'Passed'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                        }`}>
                        {report.status === 'Passed' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {report.status === 'Passed' ? (
                        report.certificate_downloaded ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            <Download className="w-3 h-3 mr-1" />
                            Downloaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            Not Downloaded
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{report.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    No test results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


        {/* Pagination Placeholder */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
