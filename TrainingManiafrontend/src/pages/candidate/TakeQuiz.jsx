import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle, AlertTriangle, Clock, HelpCircle, Shield, Lock } from 'lucide-react';

const TakeQuiz = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [training, setTraining] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const answersRef = useRef({});

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);
    const [timeLeft, setTimeLeft] = useState(1200);
    const [result, setResult] = useState(null);


    const [showTimeoutScreen, setShowTimeoutScreen] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const calculateResult = (currentTraining = training, currentAnswers = answersRef.current) => {
        if (!currentTraining) return null;

        let obtainedMarks = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        let attemptedCount = 0;

        const { questions } = currentTraining;
        // Use flattened props from mappedTraining or fallbacks
        const totalMarks = currentTraining.totalMarks || currentTraining.test_configuration?.total_marks || 100;
        const passingMarks = currentTraining.passingMarks || 40;
        const negativeMarking = currentTraining.negativeMarking;
        const negativeMarkingValue = currentTraining.negativeMarkingValue || 0;

        const marksPerQuestion = questions.length > 0 ? (totalMarks / questions.length) : 0;

        questions.forEach((q, index) => {
            const userAnswer = currentAnswers[index];
            if (userAnswer) {
                attemptedCount++;
                let isCorrect = false;

                const correctChoice = q.choices.find(c => c.is_correct);
                if (correctChoice) {
                    const u = userAnswer?.toString().toLowerCase().trim();
                    const c = correctChoice.text?.toString().toLowerCase().trim();
                    isCorrect = u === c;
                }

                if (isCorrect) {
                    obtainedMarks += marksPerQuestion;
                    correctCount++;
                } else {
                    incorrectCount++;
                    if (negativeMarking) {
                        obtainedMarks -= negativeMarkingValue;
                    }
                }
            }
        });

        // Ensure obtained marks doesn't go below 0
        const finalObtained = Math.max(0, obtainedMarks);
        const percentage = totalMarks > 0 ? (finalObtained / totalMarks) * 100 : 0;
        const isPassed = finalObtained >= passingMarks;

        return {
            obtainedMarks: finalObtained,
            totalMarks,
            percentage,
            isPassed,
            correctCount,
            incorrectCount,
            attemptedCount,
            totalQuestions: questions.length
        };
    };

    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const fetchTraining = async () => {
            try {
                const res = await fetch(`/api/training/${id}/`);
                if (!res.ok) {
                    throw new Error(`Failed to load training. Status: ${res.status}`);
                }
                const found = await res.json();

                if (!found.questions) {
                    console.error("Training module missing questions array:", found);
                    // Fallback to empty array to prevent crash
                    found.questions = [];
                }

                // Map Backend Structure to Frontend Structure
                const mappedQuestions = found.questions.map(q => ({
                    id: q.id,
                    question: q.text,
                    type: q.question_type, // 'mcq' or 'fib'
                    options: q.choices ? q.choices.map(c => c.text) : [],
                    correctAnswer: q.choices?.find(c => c.is_correct)?.text || '',
                    answer: q.choices?.find(c => c.is_correct)?.text || '', // helper for some checks
                    choices: q.choices // keep original just in case
                }));

                const mappedTraining = {
                    ...found,
                    questions: mappedQuestions,
                    testDuration: found.test_configuration?.duration_minutes || 20,
                    totalQuestions: found.test_configuration?.total_questions || mappedQuestions.length,
                    passingMarks: found.test_configuration?.passing_marks || 40,
                    totalMarks: found.test_configuration?.total_marks || 100,
                    negativeMarking: found.test_configuration?.is_negative_marking || false,
                    negativeMarkingValue: found.test_configuration?.negative_marking_value || 0,
                    noCopyPaste: found.test_configuration?.no_copy_paste || false,
                    noTabSwitch: found.test_configuration?.no_tab_switch || false,
                    noScreenshot: found.test_configuration?.no_screenshot || false,
                    attemptsAllowed: found.test_configuration?.attempts_allowed || 3
                };

                setTraining(mappedTraining);
                // Consolidate final training object
                let finalTraining = mappedTraining;

                // Shuffle Questions Layout (Fisher-Yates Shuffle)
                const shuffledQuestions = [...mappedQuestions];
                for (let i = shuffledQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
                }

                // Respect Total Questions Limit
                const limit = mappedTraining.totalQuestions || mappedQuestions.length;

                // If we have more questions than needed, take the first 'limit' from the SHUFFLED array
                if (limit < mappedQuestions.length) {
                    finalTraining = { ...mappedTraining, questions: shuffledQuestions.slice(0, limit) };
                } else {
                    // Otherwise just use the full shuffled list
                    finalTraining = { ...mappedTraining, questions: shuffledQuestions };
                }

                setTraining(finalTraining);
                setTimeLeft(finalTraining.testDuration * 60);

                if (location.state && location.state.mode === 'review' && location.state.answers) {
                    setAnswers(location.state.answers);
                    setIsReviewing(true);

                    // Generate REAL result based on history
                    const generatedResult = calculateResult(finalTraining, location.state.answers);
                    setResult(generatedResult);
                }

            } catch (err) {
                console.error(err);
                setError(err.message);
            }
        };

        fetchTraining();
    }, [id, navigate, location.state]);

    // Timer Logic (Keep existing)
    useEffect(() => {
        if (!training || result || !hasStarted) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [training, result, hasStarted]);

    // Security & Proctoring Logic
    useEffect(() => {
        if (!training || result || !hasStarted) return;

        const handleVisibilityChange = () => {
            if (document.hidden && training.noTabSwitch) {
                document.body.classList.add('blur-2xl');
                alert('Security Violation: Tab Switch Detected!\n\nYour test will now be submitted automatically.');
                handleSubmit(true);
            }
        };

        const preventDevTools = (e) => {
            if (training.noCopyPaste) {
                if (
                    e.keyCode === 123 || // F12
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || // Ctrl+Shift+I/J/C
                    (e.ctrlKey && e.key === 'U') // Ctrl+U (View Source)
                ) {
                    e.preventDefault();
                    return false;
                }
            }
        };

        const preventCopyPaste = (e) => {
            if (training.noCopyPaste) {
                e.preventDefault();
                return false;
            }
        };

        const preventContextMenu = (e) => {
            if (training.noCopyPaste) {
                e.preventDefault();
                return false;
            }
        };

        const handleScreenshotKey = (e) => {
            if (!training.noScreenshot) return;

            const isPrintScreen = e.key === 'PrintScreen' || e.keyCode === 44;
            const isSnippingCmd = (e.metaKey || e.ctrlKey) && e.shiftKey && ['s', 'S', '3', '4'].includes(e.key);

            if (isPrintScreen || isSnippingCmd) {
                // Aggressive blur
                document.body.style.filter = 'blur(20px)';
                e.preventDefault();
                try { navigator.clipboard.writeText(''); } catch (err) { }

                setTimeout(() => {
                    alert('Security Violation: Screenshot Detected!\n\nYour test will now be submitted automatically.');
                    handleSubmit(true);
                }, 100);
            }
        };

        const handleBlur = () => {
            // If user clicks away (e.g. to open Snipping Tool), blur content
            if (training.noScreenshot || training.noTabSwitch) {
                document.title = "⚠️ VIOLATION WARNING";
                document.body.style.filter = 'blur(15px)';
            }
        };

        const handleFocus = () => {
            if (training.noScreenshot || training.noTabSwitch) {
                document.title = "Training Mania";
                document.body.style.filter = 'none';
            }
        };

        // Attach Listeners
        if (training.noTabSwitch) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
        }

        if (training.noCopyPaste) {
            document.addEventListener('copy', preventCopyPaste);
            document.addEventListener('cut', preventCopyPaste);
            document.addEventListener('paste', preventCopyPaste);
            document.addEventListener('contextmenu', preventContextMenu);
            document.addEventListener('keydown', preventDevTools);
        }

        if (training.noScreenshot) {
            document.addEventListener('keydown', handleScreenshotKey);
            document.addEventListener('keyup', handleScreenshotKey);
        }

        // Always attach blur/focus if any security is on, but mainly for screenshot/tab
        if (training.noScreenshot || training.noTabSwitch) {
            window.addEventListener('blur', handleBlur);
            window.addEventListener('focus', handleFocus);
        }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('copy', preventCopyPaste);
            document.removeEventListener('cut', preventCopyPaste);
            document.removeEventListener('paste', preventCopyPaste);
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('keydown', preventDevTools);
            document.removeEventListener('keydown', handleScreenshotKey);
            document.removeEventListener('keyup', handleScreenshotKey);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.body.style.filter = 'none';
        };
    }, [training, result, hasStarted]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = (questionIndex, value) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    };

    const handleSubmit = async (auto = false) => {
        if (!auto && !window.confirm('Are you sure you want to submit the quiz?')) return;

        // Ensure Styles are Reset
        document.body.style.filter = 'none';
        document.body.style.visibility = 'visible';
        document.body.style.opacity = '1';

        const results = calculateResult();
        setResult(results);

        if (auto) {
            setShowTimeoutScreen(true);
        }

        // Submit to Backend
        try {
            let candidateInfo;
            try {
                const ci = localStorage.getItem('candidateInfo');
                const cc = localStorage.getItem('current_candidate');
                candidateInfo = (ci && ci !== 'undefined' ? JSON.parse(ci) : null) ||
                    (cc && cc !== 'undefined' ? JSON.parse(cc) : null);
            } catch (e) {
                console.error("Error parsing candidate info", e);
            }

            if (!candidateInfo) {
                alert("Error: Candidate session not found. Please re-login.");
                navigate('/candidate/login');
                return;
            }

            await fetch('/api/test/submit/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidate_id: candidateInfo.id,
                    training_id: training.id,
                    results: results,
                    user_answers: answersRef.current
                })
            });
        } catch (err) {
            console.error("Failed to submit results", err);
            alert("Warning: Failed to save results to server. Please contact admin.");
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Error Loading Test</h2>
                    <p className="text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/candidate/dashboard')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!training) return <div>Loading...</div>;

    // Safe JSON Parse Helper
    const safeParse = (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item || item === 'undefined') return null;
            return JSON.parse(item);
        } catch (e) {
            console.error(`Error parsing ${key}`, e);
            return null;
        }
    };

    // Watermark Component - Disabled by user request
    const Watermark = () => {
        return null;
        /*
        if (!training || !training.noScreenshot) return null;

        const candidateInfo = safeParse('candidateInfo') || {};
        const text = `${candidateInfo.email || 'USER'} - ${candidateInfo.id || 'ID'}`;

        return (
            <div className="fixed inset-0 pointer-events-none z-50 flex flex-wrap content-center justify-center overflow-hidden opacity-10 select-none">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="transform -rotate-45 text-slate-900 text-3xl font-bold p-12 whitespace-nowrap">
                        {text}
                    </div>
                ))}
            </div>
        );
        */
    };




    if (!training) return <div>Loading...</div>;

    if (!hasStarted && !result && !isReviewing) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Watermark />
                <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden relative z-10">
                    <div className="bg-indigo-600 p-8 text-white">
                        <h1 className="text-3xl font-bold mb-2">{training.title}</h1>
                        <p className="opacity-90">Please read the instructions carefully before starting.</p>
                    </div>

                    <div className="p-8">
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-slate-500 text-sm font-semibold mb-1">Duration</span>
                                <div className="flex items-center text-lg font-bold text-slate-800">
                                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                                    {training.testDuration} mins
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-slate-500 text-sm font-semibold mb-1">Questions</span>
                                <div className="flex items-center text-lg font-bold text-slate-800">
                                    <HelpCircle className="w-5 h-5 mr-2 text-indigo-600" />
                                    {training.totalQuestions} Questions
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-slate-500 text-sm font-semibold mb-1">Attempts</span>
                                <div className="flex items-center text-lg font-bold text-slate-800">
                                    <Clock className="w-5 h-5 mr-2 text-indigo-600" />
                                    {training.attemptsAllowed || 3}
                                </div>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                            <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                            Rules & Regulations
                        </h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 mr-3 flex-shrink-0"></div>
                                <p className="text-indigo-900 text-sm leading-relaxed">Ensure you have a stable internet connection.</p>
                            </div>

                            {training.noCopyPaste && (
                                <div className="flex items-start p-4 rounded-lg bg-amber-50 border border-amber-100">
                                    <Lock className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-sm">Copy/Paste Disabled</p>
                                        <p className="text-amber-700 text-sm mt-1">Right-click, copy, cut, and paste actions are restricted.</p>
                                    </div>
                                </div>
                            )}

                            {training.noTabSwitch && (
                                <div className="flex items-start p-4 rounded-lg bg-amber-50 border border-amber-100">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-sm">No Tab Switching</p>
                                        <p className="text-amber-700 text-sm mt-1">Switching tabs or minimizing the browser will automatically submit the test.</p>
                                    </div>
                                </div>
                            )}

                            {training.noScreenshot && (
                                <div className="flex items-start p-4 rounded-lg bg-amber-50 border border-amber-100">
                                    <Shield className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-amber-800 text-sm">No Screenshots</p>
                                        <p className="text-amber-700 text-sm mt-1">Screenshots are disabled. Activity is monitored.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setHasStarted(true)}
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center"
                        >
                            Start Assessment
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (showTimeoutScreen) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-fade-in-up">
                    <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Time's Up!</h2>
                    <p className="text-slate-500 mb-8">
                        The allotted time for this test has expired. Your progress has been automatically saved and submitted.
                    </p>
                    <button
                        onClick={() => setShowTimeoutScreen(false)}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-lg shadow-lg shadow-indigo-200"
                    >
                        View Results
                    </button>
                </div>
            </div>
        );
    }

    if (result) {
        // ... (Keep Result Logic - Simplified for this update, but assuming I shouldn't delete it? 
        // Wait, replace_file_content replaces the whole range. I must safeguard the Review/Result UI.)

        // RE-INCLUDE REVIEW LOGIC:
        if (isReviewing) {
            return (
                <div className="min-h-screen bg-slate-50 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-bold text-slate-900">Answer Review</h1>
                            <button
                                onClick={() => setIsReviewing(false)}
                                className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                            >
                                Back to Results
                            </button>
                        </div>

                        <div className="space-y-6">
                            {training.questions.map((q, index) => {
                                const userAnswer = answers[index];
                                const correctValue = q.correctAnswer || q.answer;
                                const isCorrect = userAnswer?.toString().toLowerCase().trim() === correctValue?.toString().toLowerCase().trim();

                                return (
                                    <div key={index} className={`p-6 rounded-xl border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex gap-4">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-medium text-slate-900 mb-4">{q.question}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Your Answer</span>
                                                        <div className={`p-3 rounded-lg font-medium ${isCorrect ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100'}`}>
                                                            {userAnswer || <span className="italic text-slate-400">Skipped</span>}
                                                        </div>
                                                    </div>
                                                    {!isCorrect && (
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Correct Answer</span>
                                                            <div className="p-3 rounded-lg font-medium text-emerald-700 bg-emerald-100">
                                                                {correctValue}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    {/* Simplified Result UI for brevity in this tool call, trying to match existing lines */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${result.isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {result.isPassed ? <CheckCircle className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {result.isPassed ? 'Congratulations! Passed' : 'Assessment Failed'}
                    </h2>
                    <div className="text-5xl font-bold text-indigo-600 mb-2">{result.obtainedMarks.toFixed(1)}</div>
                    <p className="text-slate-500 mb-8">out of {result.totalMarks} marks</p>

                    <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <span className="block text-slate-500">Correct</span>
                            <span className="font-bold text-emerald-600">{result.correctCount}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg">
                            <span className="block text-slate-500">Incorrect</span>
                            <span className="font-bold text-red-600">{result.incorrectCount}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {result.isPassed && (
                            <button onClick={() => navigate(`/candidate/certificate/${training.id}`)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 mr-2" /> Get Certificate
                            </button>
                        )}
                        <button onClick={() => setIsReviewing(true)} className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:border-indigo-600 hover:text-indigo-600 transition-all">Review Answers</button>
                        <button onClick={() => navigate('/candidate/dashboard')} className="w-full py-3 text-slate-400 hover:text-slate-600 font-medium transition-all">Return to Dashboard</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!training.questions || training.questions.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Unavailable</h2>
                    <p className="text-slate-500 mb-6">This training module has no questions configured.</p>
                    <button
                        onClick={() => navigate('/candidate/dashboard')}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = training.questions[currentQuestionIndex];
    if (!currentQ) return <div>Error: Question not found.</div>;

    const allQuestionsAnswered = Object.keys(answers).length === training.questions.length;

    return (
        <div
            className={`min-h-screen bg-slate-50 flex flex-col ${training.noCopyPaste ? 'select-none' : ''}`}
            onContextMenu={(e) => training.noCopyPaste && e.preventDefault()}
        >
            <Watermark />

            {/* Header */}
            <header className="bg-white px-8 py-4 border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 transition-all">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{training.title}</h1>
                    <p className="text-slate-500 text-sm">Question {currentQuestionIndex + 1} of {training.questions.length}</p>
                </div>
                <div className="flex items-center gap-4">
                    {(training.noCopyPaste || training.noTabSwitch || training.noScreenshot) && (
                        <div
                            className="flex items-center px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-sm font-bold border border-amber-100 hidden sm:flex cursor-help"
                            title={[
                                training.noCopyPaste && 'No Copy/Paste',
                                training.noTabSwitch && 'No Tab Switch',
                                training.noScreenshot && 'No Screenshots'
                            ].filter(Boolean).join(', ')}
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Proctored
                        </div>
                    )}
                    <div className={`flex items-center px-4 py-2 rounded-lg font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-700'}`}>
                        <Clock className="w-5 h-5 mr-2" />
                        {formatTime(timeLeft)}
                    </div>

                    {allQuestionsAnswered && (
                        <button
                            onClick={() => handleSubmit(false)}
                            className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 animate-fade-in"
                        >
                            Submit Test
                        </button>
                    )}
                </div>
            </header>

            {/* Question Area */}
            <div className="flex-1 max-w-4xl mx-auto w-full p-8 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[400px] flex flex-col">
                    <h2 className="text-xl font-medium text-slate-900 mb-8 leading-relaxed">
                        {currentQ.question}
                    </h2>

                    <div className="flex-1">
                        {currentQ.type === 'mcq' ? (
                            <div className="space-y-4">
                                {currentQ.options.map((opt, i) => (
                                    <label key={i} className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQuestionIndex] === opt ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                        <input
                                            type="radio"
                                            name={`q-${currentQuestionIndex}`}
                                            value={opt}
                                            checked={answers[currentQuestionIndex] === opt}
                                            onChange={() => handleAnswer(currentQuestionIndex, opt)}
                                            className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <span className={`ml-4 text-base ${answers[currentQuestionIndex] === opt ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    value={answers[currentQuestionIndex] || ''}
                                    onChange={(e) => handleAnswer(currentQuestionIndex, e.target.value)}
                                    className="w-full p-4 text-lg border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-0 outline-none"
                                    placeholder="Type your answer here..."
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                        >
                            Previous
                        </button>
                        {currentQuestionIndex === training.questions.length - 1 ? (
                            <button
                                onClick={() => handleSubmit(false)}
                                className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                            >
                                Submit
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(training.questions.length - 1, prev + 1))}
                                className="px-6 py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TakeQuiz;
// Force Reload V3
