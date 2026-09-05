import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, LayoutDashboard, BookOpen, PlayCircle, CheckCircle, Clock, FileText, HelpCircle, ArrowRight, MessageSquare, Award, AlertTriangle } from 'lucide-react';

const CandidateDashboard = () => {
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('my-courses');
  const [myCourses, setMyCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [hasAttempts, setHasAttempts] = useState(false);
  const [nameError, setNameError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  // AI Agent State
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI learning assistant. As you watch the video, feel free to ask me anything about the content. I am here to help you understand!' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isPdfDownloaded, setIsPdfDownloaded] = useState(false);

  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userText = inputMessage;
    const newMsg = { role: 'user', text: userText };
    setMessages(prev => [...prev, newMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          training_id: currentCourse.trainingId || currentCourse.id,
          candidate_id: candidate.id,
          message: userText
        })
      });

      const data = await res.json();
      const aiResponse = data.response || "I'm having trouble connecting right now.";

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: aiResponse
      }]);

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Sorry, I lost my connection. Please check your internet."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    // 1. Get logged in candidate info
    let candidateData = null;
    try {
      // Try reading from the key set by correct login flow
      const authInfo = localStorage.getItem('candidateInfo');
      if (authInfo) {
        candidateData = JSON.parse(authInfo);
      } else {
        // Fallback to legacy key if exists
        const stored = localStorage.getItem('current_candidate');
        if (stored) candidateData = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error parsing candidate info", e);
    }

    if (!candidateData || !candidateData.id) {
      navigate('/candidate/login');
      return;
    }

    setCandidate(candidateData);
    setCandidateName(candidateData.name || candidateData.email.split('@')[0]);

    // 2. Fetch Dashboard Data from Backend
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`/api/candidate/${candidateData.id}/dashboard/`);
        if (res.ok) {
          const data = await res.json();
          setMyCourses(data);

          // Check attempts
          const attempts = data.some(c => c.status === 'Completed' || c.status === 'Failed');
          setHasAttempts(attempts);
        } else if (res.status === 401) {
          const data = await res.json();
          if (data.error === 'Please register yourself first') {
            alert(data.error);
            localStorage.removeItem('candidateInfo');
            localStorage.removeItem('current_candidate');
            navigate('/');
          }
        } else {
          console.error("Failed to fetch dashboard");
        }
      } catch (err) {
        console.error("Network error fetching dashboard", err);
      }
    };

    fetchDashboard();

  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('current_candidate');
    localStorage.removeItem('candidateInfo');
    navigate('/');
  };

  const handleStartLearning = (course) => {
    setCurrentCourse(course);
    setActiveTab('player');
    setIsPdfDownloaded(false); // Reset for new session

    // Fetch Chat History
    const fetchChatHistory = async () => {
      try {
        const id = course.trainingId || course.id;
        const res = await fetch(`/api/chat/?candidate_id=${candidate.id}&training_id=${id}`);
        if (res.ok) {
          const history = await res.json();
          // Prepend default message if history is empty or append to it?
          // We will use history if available, else default.
          if (history.length > 0) {
            setMessages(history);
          } else {
            setMessages([{ role: 'assistant', text: 'Hello! I am your AI learning assistant. As you watch the video, feel free to ask me anything about the content. I am here to help you understand!' }]);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };
    fetchChatHistory();
  };

  const handleDownloadPdf = () => {
    // Simulate real download with Blob
    const dummyContent = `Training Manual for ${currentCourse.training}\n\nThis is a dummy PDF file generated for demonstration purposes.`;
    const blob = new Blob([dummyContent], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', currentCourse.pdfFile || 'Manual.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsPdfDownloaded(true);
  };

  const handleNameChange = (e) => {
    setCandidateName(e.target.value);
    if (e.target.value.trim()) {
      setNameError('');
    }
    setSaveStatus('');
  };

  const handleSaveName = () => {
    if (!candidateName.trim()) {
      setNameError('Name is required');
      return;
    }

    const updatedCandidate = { ...candidate, name: candidateName.trim() };
    setCandidate(updatedCandidate);
    localStorage.setItem('current_candidate', JSON.stringify(updatedCandidate));
    setSaveStatus('Saved successfully!');

    setTimeout(() => setSaveStatus(''), 3000);
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : '';
    return `https://www.youtube.com/embed/${id}`;
  };

  if (!candidate) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-none">Training</h1>
              <span className="text-indigo-600 font-semibold text-xs">Mania</span>
            </div>
          </div>

          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                {candidate.email.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{candidate.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        {hasAttempts && activeTab !== 'player' && (
          <div className="flex border-b border-slate-200 mb-8">
            <button
              onClick={() => setActiveTab('my-courses')}
              className={`px-6 py-3 font-bold text-sm transition-all border-b-2 cursor-pointer ${activeTab === 'my-courses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-6 py-3 font-bold text-sm transition-all border-b-2 cursor-pointer ${activeTab === 'certificates' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Certificates
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-6 py-3 font-bold text-sm transition-all border-b-2 cursor-pointer ${activeTab === 'results' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Results
            </button>
          </div>
        )}

        {activeTab === 'my-courses' && (
          <div>
            {!hasAttempts && (
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
                <p className="text-slate-500">Access your assigned training modules.</p>
              </div>
            )}

            {/* Candidate Name Input Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  Your Profile Name <span className="text-red-500">*</span>
                </h2>
                <p className="text-sm text-slate-500">This name will appear on your certificates. Please ensure it is correct.</p>
              </div>
              <div className="w-full md:w-auto min-w-[300px]">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                      type="text"
                      value={candidateName}
                      onChange={handleNameChange}
                      placeholder="Enter full name for certificate"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border ${nameError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'} focus:ring-2 outline-none font-medium text-slate-900 transition-all`}
                    />
                  </div>
                  <button
                    onClick={handleSaveName}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
                {nameError && <p className="text-red-500 text-xs mt-2 font-medium ml-1">{nameError}</p>}
                {saveStatus && <p className="text-emerald-600 text-xs mt-2 font-medium ml-1">{saveStatus}</p>}
              </div>
            </div>

            {myCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map((course) => (
                  <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all group">
                    <div className="h-40 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.training} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors" />
                      )}
                      <PlayCircle className="w-12 h-12 text-indigo-600 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 absolute" />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wide">
                          {course.status}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {course.date}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{course.training}</h3>
                      <button
                        onClick={() => handleStartLearning(course)}
                        className="w-full mt-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                      >
                        Start Learning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Courses Assigned</h3>
                <p className="text-slate-500 max-w-sm mx-auto">
                  You haven't been enrolled in any training modules yet. Please contact your administrator.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'certificates' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.filter(c => c.status === 'Completed').map(course => (
                <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{course.training}</h3>
                  <p className="text-sm text-slate-500 mb-6">Completed on {course.lastAttemptDate || course.date}</p>
                  <button
                    onClick={() => navigate(`/candidate/certificate/${course.trainingId}`)}
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 cursor-pointer"
                  >
                    View Certificate
                  </button>
                </div>
              ))}
              {myCourses.filter(c => c.status === 'Completed').length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <p className="text-slate-500">No certificates available yet. Complete a course to earn one!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700">Training Module</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700">Score</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myCourses.filter(c => c.status !== 'Enrolled').map(course => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{course.training}</td>
                    <td className="px-6 py-4 text-slate-500">{course.lastAttemptDate || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${course.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {course.status === 'Completed' ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{course.score ? parseFloat(course.score).toFixed(1) : '0'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/candidate/take-test/${course.trainingId || course.id}`, { state: { mode: 'review', answers: course.userAnswers, course: course } })}
                        disabled={!course.userAnswers}
                        className={`text-sm font-bold transition-colors ${course.userAnswers ? 'text-indigo-600 hover:text-indigo-800 cursor-pointer' : 'text-slate-300 cursor-not-allowed'}`}
                        title={!course.userAnswers ? "Review not available for older tests" : "Review your answers"}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {myCourses.filter(c => c.status !== 'Enrolled').length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      No results found. Attempt a quiz to see results here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'player' && currentCourse && (
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => setActiveTab('my-courses')}
              className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors mb-6 font-medium cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 mr-2 rotate-180" />
              Back to Courses
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Video Player Column */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                  <div className="aspect-video w-full bg-black">
                    {currentCourse.videoType === 'upload' ? (
                      <video
                        width="100%"
                        height="100%"
                        controls
                        className="w-full h-full object-contain bg-black"
                        src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      currentCourse.videoUrl ? (
                        <iframe
                          width="100%"
                          height="100%"
                          src={getYoutubeEmbedUrl(currentCourse.videoUrl)}
                          title={currentCourse.training}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <p>No video available for this course.</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                  <h1 className="text-2xl font-bold text-slate-900 mb-2">{currentCourse.training}</h1>
                  <p className="text-slate-500 mb-6">
                    Watch the video and download the training manual. You must download the manual to unlock the quiz.
                  </p>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                      <FileText className="w-8 h-8 text-indigo-600 flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 truncate">Training Manual</h4>
                        <p className="text-sm text-slate-500 truncate w-full" title={currentCourse.pdfFile || 'Manual.pdf'}>
                          {currentCourse.pdfFile || 'Manual.pdf'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadPdf}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border flex-shrink-0 whitespace-nowrap cursor-pointer ${isPdfDownloaded
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                    >
                      {isPdfDownloaded ? 'Downloaded' : 'Download PDF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                    <div className="text-sm font-medium text-slate-500">
                      Attempts: <span className={currentCourse.attemptsTaken >= currentCourse.attemptsAllowed ? 'text-red-600 font-bold' : 'text-slate-900 font-bold'}>{currentCourse.attemptsTaken}</span> / {currentCourse.attemptsAllowed}
                    </div>

                    <button
                      onClick={() => navigate(`/candidate/take-test/${currentCourse.trainingId || currentCourse.id}`, { state: { course: currentCourse } })}
                      disabled={!isPdfDownloaded || currentCourse.attemptsTaken >= currentCourse.attemptsAllowed}
                      className={`flex items-center px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${isPdfDownloaded && currentCourse.attemptsTaken < currentCourse.attemptsAllowed
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                    >
                      {currentCourse.attemptsTaken >= currentCourse.attemptsAllowed ? (
                        <AlertTriangle className="w-5 h-5 mr-2" />
                      ) : (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      {currentCourse.attemptsTaken >= currentCourse.attemptsAllowed ? 'Max Attempts Reached' : 'Attempt Quiz'}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Agent Column */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100 border-2 border-indigo-100 flex flex-col h-[600px] sticky top-24 ring-1 ring-indigo-50 overflow-hidden transform transition-all hover:shadow-2xl hover:shadow-indigo-200/50">

                  {/* AI Header */}
                  <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner border border-white/20">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 relative z-10">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-lg">AI Assistant</h3>
                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold text-white border border-white/10">PRO</span>
                      </div>
                      <p className="text-xs text-indigo-100 font-medium opacity-90">Ask doubts while watching</p>
                    </div>
                  </div>

                  {/* Chat Area */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth"
                  >
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 p-3.5 rounded-2xl rounded-tl-none text-sm text-slate-500 shadow-sm flex items-center gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask a question..."
                        className="flex-1 px-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl text-sm transition-all outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 cursor-pointer"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidateDashboard;

