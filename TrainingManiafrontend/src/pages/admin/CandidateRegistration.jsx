import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UploadCloud,
  FileText,
  Mail,
  CheckCircle,
  X,
  Trash2,
  AlertCircle,
  Search
} from 'lucide-react';

const CandidateRegistration = () => {
  const [email, setEmail] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Safety check for pagination
  useEffect(() => {
    const maxPage = Math.ceil(recentCandidates.length / itemsPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    }
  }, [recentCandidates.length, currentPage]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchCandidates = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const adminId = adminInfo ? adminInfo.id : null;

      const res = await fetch('/api/admin/candidates/', {
        headers: {
          'X-Admin-ID': adminId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRecentCandidates(data);
      }
    } catch (err) {
      console.error("Failed to load candidates:", err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (email) {
      setLoading(true);
      try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
        const res = await fetch('/api/admin/candidates/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-ID': adminInfo ? adminInfo.id : ''
          },
          body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (res.ok) {
          setRecentCandidates([data.candidate, ...recentCandidates]);
          setEmail('');
          setCurrentPage(1);
          showNotification(data.message || `Candidate ${data.candidate.email} added! Access Code: ${data.candidate.code}`, 'success');
        } else {
          showNotification(data.error || 'Failed to add candidate', 'error');
        }
      } catch (err) {
        console.error("Error adding candidate:", err);
        showNotification("Network error occurred.", 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type === "text/csv" || file.name.endsWith('.csv')) {
      setCsvFile(file);
    } else {
      showNotification("Please upload a CSV file.", 'error');
    }
  };

  const handleBulkUpload = () => {
    if (csvFile) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
        const emails = [];

        const lines = text.split(/\r?\n/);
        lines.forEach(line => {
          const matches = line.match(emailRegex);
          if (matches) {
            matches.forEach(m => {
              if (m.toLowerCase() !== 'email' && !emails.includes(m)) {
                emails.push(m);
              }
            });
          }
        });

        // Process sequentially to avoid overwhelming server or handle rate limits
        let count = 0;
        for (const mail of emails) {
          try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            await fetch('/api/admin/candidates/', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Admin-ID': adminInfo ? adminInfo.id : ''
              },
              body: JSON.stringify({ email: mail })
            });
            count++;
          } catch (err) {
            console.error(`Failed to upload ${mail}`, err);
          }
        }

        fetchCandidates(); // Refresh list
        setCsvFile(null);
        setLoading(false);
        setCurrentPage(1);
        showNotification(`Processed ${count} candidates from CSV!`, 'success');
      };
      reader.readAsText(csvFile);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete ALL candidates? This action cannot be undone.")) return;

    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const res = await fetch('/api/admin/candidates/?delete_all=true', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-ID': adminInfo ? adminInfo.id : ''
        }
      });

      if (res.ok) {
        setRecentCandidates([]);
        setCurrentPage(1);
        showNotification("All candidates deleted successfully", 'success');
      } else {
        showNotification("Failed to delete candidates", 'error');
      }
    } catch (err) {
      showNotification("Network error", 'error');
    }
  };

  const handleDelete = async (id, emailToDelete) => {
    // Direct delete without confirmation popup
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const res = await fetch(`/api/admin/candidates/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-ID': adminInfo ? adminInfo.id : ''
        }
      });
      if (res.ok) {
        setRecentCandidates(prev => prev.filter(c => c.id !== id));
        showNotification(`Deleted ${emailToDelete}`, 'success');
      } else {
        const err = await res.json();
        showNotification(err.error || "Failed to delete candidate.", 'error');
      }
    } catch (err) {
      showNotification("Network error while deleting.", 'error');
    }
  };

  const formatName = (email) => {
    if (!email) return 'Unknown';
    return email.split('@')[0]
      .replace(/[0-9]/g, '')
      .replace(/[\._]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || 'Candidate';
  };

  // Pagination Logic
  const filteredCandidates = recentCandidates.filter(candidate => {
    const term = searchTerm.toLowerCase();
    const name = formatName(candidate.email).toLowerCase();
    const emailMatch = (candidate.email || '').toLowerCase().includes(term);
    const codeMatch = (candidate.code || candidate.access_code || '').toLowerCase().includes(term);
    const matchesSearch = name.includes(term) || emailMatch || codeMatch;

    const matchesFilter = filterStatus === 'all'
      ? true
      : (candidate.method || '').toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);

  // Safety check for pagination (updated to use filteredCandidates)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredCandidates.length, totalPages, currentPage]);



  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Candidate Registration</h2>
        <p className="text-slate-500">Add new candidates to the system manually or via bulk upload.</p>
      </div>

      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl flex items-center shadow-2xl transform transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          <span className="font-bold text-sm tracking-wide">{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Manual Registration */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mr-4">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Manual Entry</h3>
              <p className="text-sm text-slate-500">Add a single candidate</p>
            </div>
          </div>

          <form onSubmit={handleManualAdd}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Candidate Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@company.com"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Processing...' : 'Add Candidate'}
            </button>
          </form>
        </div>

        {/* Bulk Upload */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 mr-4">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bulk Upload</h3>
              <p className="text-sm text-slate-500">Import from CSV file</p>
            </div>
          </div>

          {!csvFile ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-900 font-semibold mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-500">CSV files only (max 5MB)</p>
              </label>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-emerald-500 mr-3" />
                  <div>
                    <p className="font-semibold text-slate-900">{csvFile.name}</p>
                    <p className="text-xs text-slate-500">{(csvFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button onClick={() => setCsvFile(null)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleBulkUpload}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Uploading...' : 'Process Import'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Registrations</h3>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
              {filteredCandidates.length} Candidates
            </span>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-0 outline-none w-full md:w-64"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['all', 'manual', 'bulk'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterStatus(type)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize cursor-pointer ${filterStatus === type
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {recentCandidates.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors text-sm font-bold whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Candidate</th>
                <th className="px-6 py-4">Access Code</th>
                <th className="px-6 py-4">Date Added</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentCandidates.map((candidate, index) => {
                if (!candidate || !candidate.email) return null;
                return (
                  <tr key={candidate.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{formatName(candidate.email)}</span>
                        <span className="text-xs text-slate-500">{candidate.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold border border-indigo-100">
                        {candidate.code || candidate.access_code || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{candidate.date || new Date(candidate.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm capitalize">{candidate.method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${candidate.is_active !== false
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-500'
                        }`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {candidate.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(candidate.id, candidate.email)}
                        className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium ml-auto cursor-pointer"
                        title="Delete Candidate"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    {recentCandidates.length === 0 ? "No candidates registered yet." : "No candidates match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

export default CandidateRegistration;
