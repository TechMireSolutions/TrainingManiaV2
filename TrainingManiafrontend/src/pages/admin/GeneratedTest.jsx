import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Shuffle, Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';
// import { mcqPool, fibPool, shortAnswerPool } from '../../data/questionBank';

const GeneratedTest = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { config, title, contentType, videoType, videoUrl, settings } = location.state || {
    config: { mcq: 70, fib: 30 },
    title: 'Untitled Training',
    contentType: 'youtube',
    videoType: 'youtube',
    videoUrl: '',
    settings: {
      totalMarks: 100,
      passingMarks: 40,
      attempts: 3,
      testDuration: 20,
      negativeMarking: false,
      negativeMarkingValue: 0
    }
  };

  const [questions, setQuestions] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [notification, setNotification] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const generateQuestions = async () => {
    setIsLoading(true);
    setQuestions([]);

    try {
      const totalQuestions = config.totalQuestions || 20;
      const mcqCount = Math.round((totalQuestions * config.mcq) / 100);
      const fibCount = Math.round((totalQuestions * config.fib) / 100);
      const shortAnswerCount = Math.round((totalQuestions * config.shortAnswer) / 100);

      const formData = new FormData();
      if (location.state.pdfFile) {
        formData.append('pdf_file', location.state.pdfFile);
      }
      formData.append('mcq_count', mcqCount);
      formData.append('fib_count', fibCount);
      formData.append('short_count', shortAnswerCount);

      const response = await fetch('/api/generate-questions/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions from server');
      }

      const data = await response.json();

      // Ensure IDs are unique
      const questionsWithIds = data.questions.map((q, i) => ({
        ...q,
        id: `${q.type}-${Date.now()}-${i}`
      }));

      setQuestions(questionsWithIds);
      setIsSaved(false);
    } catch (error) {
      console.error("Error generating questions:", error);
      setNotification({ type: 'error', message: 'Failed to generate questions. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const shuffleQuestions = () => {
    setQuestions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  useEffect(() => {
    generateQuestions();
  }, []);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('title', title);

    // Files
    if (location.state.pdfFile) {
      formData.append('pdf_file', location.state.pdfFile);
    }

    formData.append('video_type', videoType || 'youtube');
    if (videoType === 'youtube' && videoUrl) {
      formData.append('video_url', videoUrl);
    } else if (videoType === 'upload' && location.state.videoFile) {
      formData.append('video_file', location.state.videoFile);
    }

    if (location.state.thumbnailFile) {
      formData.append('thumbnail', location.state.thumbnailFile);
    }

    // Test Configuration
    const testConfig = {
      total_questions: config.totalQuestions || questions.length,
      mcq_percentage: config.mcq,
      fib_percentage: config.fib,
      short_answer_percentage: config.shortAnswer || 0,
      total_marks: parseInt(settings.totalMarks) || 100,
      passing_marks: parseInt(settings.passingMarks) || 40,
      duration_minutes: parseInt(settings.testDuration) || 20,
      attempts_allowed: parseInt(settings.attempts) || 3,
      is_negative_marking: settings.negativeMarking,
      negative_marking_value: parseFloat(settings.negativeMarkingValue) || 0,
      no_copy_paste: settings.noCopyPaste || false,
      no_tab_switch: settings.noTabSwitch || false,
      no_screenshot: settings.noScreenshot || false
    };
    formData.append('test_configuration', JSON.stringify(testConfig));

    // Questions
    const mappedQuestions = questions.map(q => {
      let choices = [];
      if (q.type === 'mcq') {
        choices = q.options.map(opt => ({
          text: opt,
          is_correct: opt === q.correctAnswer
        }));
      } else if (q.type === 'fib') {
        // FIB
        choices = [{ text: q.answer, is_correct: true }];
      } else {
        // Short Answer
        choices = [{ text: q.answer, is_correct: true }];
      }
      return {
        text: q.question,
        question_type: q.type,
        choices: choices
      };
    });
    formData.append('questions', JSON.stringify(mappedQuestions));

    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const res = await fetch('/api/training/create/', {
        method: 'POST',
        headers: {
          'X-Admin-ID': adminInfo ? adminInfo.id : ''
        },
        body: formData
      });

      if (res.ok) {
        setIsSaved(true);
        setNotification({ type: 'success', message: 'Training module created successfully!' });
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        const errorData = await res.json();
        console.error("Save failed", errorData);
        if (errorData.error) {
          setNotification({ type: 'error', message: errorData.error });
        } else {
          setNotification({ type: 'error', message: "Failed to save training: " + JSON.stringify(errorData) });
        }
      }
    } catch (err) {
      console.error("Network error", err);
      setNotification({ type: 'error', message: "Network error occurred while saving." });
    }
  };

  // Auto-dismiss notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl flex items-center shadow-2xl transform transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3" /> : <AlertCircle className="w-5 h-5 mr-3" />}
          <span className="font-bold text-sm tracking-wide">{notification.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex gap-3">
            <button
              onClick={generateQuestions}
              className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </button>
            <button
              onClick={shuffleQuestions}
              className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm cursor-pointer"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Shuffle Order
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Generated Test Preview</h1>
              <p className="text-slate-500 mt-1">
                Based on configuration: {config.mcq}% MCQs, {config.fib}% Fill in the Blanks
              </p>
            </div>
            <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold">
              Total Questions: {questions.length}
            </div>
          </div>

          <div className="space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-lg font-medium text-slate-600">Generating questions with AI...</p>
                <p className="text-sm text-slate-400">This may take a few moments based on your PDF size.</p>
              </div>
            ) : (
              questions.map((q, index) => (
                <div key={index} className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-500 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-bold text-slate-500 flex-shrink-0 shadow-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${q.type === 'mcq' ? 'bg-blue-50 text-blue-600' :
                          q.type === 'fib' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-purple-50 text-purple-600'
                          }`}>
                          {q.type === 'mcq' ? 'Multiple Choice' : q.type === 'fib' ? 'Fill in Blank' : 'Short Answer'}
                        </span>
                      </div>
                      <p className="text-lg font-medium text-slate-900 mb-4">{q.question}</p>

                      {q.type === 'mcq' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {q.options.map((opt, i) => (
                            <div key={i} className="flex items-center p-3 bg-white rounded-lg border border-slate-200 text-slate-700">
                              <div className="w-5 h-5 rounded-full border-2 border-slate-300 mr-3"></div>
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'fib' && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 border-dashed text-slate-400 italic">
                          Answer will be input here...
                        </div>
                      )}

                      {q.type === 'short_answer' && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-400">
                          <textarea disabled className="w-full bg-transparent resize-none p-2" rows="2" placeholder="Candidate will type descriptive answer here..."></textarea>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end sticky bottom-8">
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:-translate-y-1 cursor-pointer ${isSaved
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
              }`}
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-6 h-6 mr-2" />
                Module Saved!
              </>
            ) : (
              <>
                <Save className="w-6 h-6 mr-2" />
                Approve & Save Module
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedTest;
