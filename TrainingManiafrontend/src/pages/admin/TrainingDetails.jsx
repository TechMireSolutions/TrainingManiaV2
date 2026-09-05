import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, CheckCircle, Lock, Shield, AlertTriangle } from 'lucide-react';

const TrainingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [training, setTraining] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Fetch Data
    useEffect(() => {
        const fetchTraining = async () => {
            try {
                const res = await fetch(`/api/training/${id}/`);
                if (res.ok) {
                    const data = await res.json();

                    // Adapter: API -> Component State
                    const mapped = {
                        id: data.id,
                        title: data.title,
                        videoUrl: data.video_url,
                        enrollmentCount: data.enrollment_count,
                        // Flatten Settings
                        totalMarks: data.test_configuration?.total_marks,
                        passingMarks: data.test_configuration?.passing_marks,
                        attempts: data.test_configuration?.attempts_allowed,
                        testDuration: data.test_configuration?.duration_minutes,
                        totalQuestions: data.test_configuration?.total_questions || data.questions?.length || 20,
                        negativeMarking: data.test_configuration?.is_negative_marking,
                        negativeMarkingValue: data.test_configuration?.negative_marking_value,
                        noCopyPaste: data.test_configuration?.no_copy_paste,
                        noTabSwitch: data.test_configuration?.no_tab_switch,
                        noScreenshot: data.test_configuration?.no_screenshot,

                        // Map Questions
                        questions: data.questions.map(q => {
                            const options = q.choices ? q.choices.map(c => c.text) : [];
                            const correctChoice = q.choices ? q.choices.find(c => c.is_correct) : null;
                            return {
                                type: q.question_type,
                                question: q.text,
                                options: options,
                                answer: correctChoice ? correctChoice.text : '', // For FIB or reference
                                correctAnswer: correctChoice ? correctChoice.text : '' // Keep track of correct answer
                            };
                        })
                    };
                    setTraining(mapped);
                } else {
                    alert('Training module not found');
                    navigate('/admin/dashboard');
                }
            } catch (err) {
                console.error(err);
                alert('Error loading training');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTraining();
    }, [id, navigate]);

    const handleSave = async () => {
        setIsSaving(true);

        // Adapter: Component State -> API
        const payload = {
            title: training.title,
            video_url: training.videoUrl,
            test_configuration: {
                total_marks: parseInt(training.totalMarks),
                passing_marks: parseInt(training.passingMarks),
                attempts_allowed: parseInt(training.attempts),
                duration_minutes: parseInt(training.testDuration),
                total_questions: parseInt(training.totalQuestions) || training.questions.length,
                is_negative_marking: training.negativeMarking,
                negative_marking_value: parseFloat(training.negativeMarkingValue),
                no_copy_paste: training.noCopyPaste,
                no_tab_switch: training.noTabSwitch,
                no_screenshot: training.noScreenshot
            },
            questions: training.questions.map(q => {
                let choices = [];
                if (q.type === 'mcq') {
                    // Reconstruct choices with correct answer preserved
                    choices = q.options.map(optText => ({
                        text: optText,
                        is_correct: optText === q.correctAnswer // Match by text
                    }));
                } else {
                    // FIB
                    choices = [{ text: q.answer, is_correct: true }];
                }

                return {
                    text: q.question,
                    question_type: q.type,
                    choices: choices
                };
            })
        };

        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            const res = await fetch(`/api/training/${id}/`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-ID': adminInfo ? adminInfo.id : ''
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 2000);
            } else {
                const err = await res.json();
                console.error(err);
                alert('Failed to save changes.');
            }
        } catch (e) {
            console.error(e);
            alert('Network error saving changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...training.questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };

        // If updating an option text that is the correct answer, update correctAnswer too?
        // This is tricky without detailed tracking (id). 
        // For now, if simple text edit, we might lose sync if we don't track index.
        // But the current UI is simple strings. 
        // Improvement: If options changes, we try to preserve correct answer logic?
        // Let's just update the options array. 
        // IMPORTANT: If user edits the text of the *correct* answer, `q.correctAnswer` (which is a string) will no longer match!
        // We should really store `correctAnswerIndex`.

        if (field === 'options') {
            // value is new options array
            // We need to know WHICH index changed to update correctAnswer string if needed.
            // But here we are bulk updating via the input. 
            // In the render loop:
            /*
            onChange={(e) => {
                const newOptions = [...q.options];
                newOptions[optIndex] = e.target.value;
                handleQuestionChange(index, 'options', newOptions);
            }}
            */
            // We are not passing the index of the changed option to this handler.
            // This is a limitation of the current structure I inherited.
            // To fix this robustly, I would need to refactor the mapped render to pass the index and update `correctAnswer` if that index matches.
            // But I don't have the index here.
            // I will implement a smarter handler inside the render map in the JSX.
        }

        setTraining({ ...training, questions: updatedQuestions });
    };

    if (isLoading) return <div className="p-8 flex justify-center"><div className="loader">Loading...</div></div>;
    if (!training) return null;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                {training.enrollmentCount > 0 && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center text-amber-800">
                        <Lock className="w-5 h-5 mr-3 flex-shrink-0" />
                        <div>
                            <p className="font-bold">Read Only Mode</p>
                            <p className="text-sm opacity-90">This module has {training.enrollmentCount} enrolled candidate(s) and cannot be edited to preserve integrity.</p>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate('/admin/dashboard')}
                        className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Dashboard
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || training.enrollmentCount > 0}
                        className={`flex items-center px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer ${isSuccess
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 cursor-default'
                            : (training.enrollmentCount > 0 ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200')
                            }`}
                        title={training.enrollmentCount > 0 ? "Cannot save changes while candidates are enrolled" : "Save Changes"}
                    >
                        {isSaving ? 'Saving...' : isSuccess ? (
                            <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Saved!
                            </>
                        ) : (
                            <>
                                {training.enrollmentCount > 0 ? <Lock className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                {training.enrollmentCount > 0 ? 'Locked' : 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>

                {/* content */}
                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Training Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={training.title}
                                    onChange={(e) => setTraining({ ...training, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Video URL
                                </label>
                                <input
                                    type="text"
                                    value={training.videoUrl || ''}
                                    onChange={(e) => setTraining({ ...training, videoUrl: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Rules & Scoring Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Total Marks</label>
                                <input
                                    type="number"
                                    value={training.totalMarks || ''}
                                    onChange={(e) => setTraining({ ...training, totalMarks: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Passing Marks</label>
                                <input
                                    type="number"
                                    value={training.passingMarks || ''}
                                    onChange={(e) => setTraining({ ...training, passingMarks: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Allowed Attempts</label>
                                <input
                                    type="number"
                                    value={training.attempts || 1}
                                    onChange={(e) => setTraining({ ...training, attempts: parseInt(e.target.value) || 1 })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Test Duration (Mins)</label>
                                <input
                                    type="number"
                                    value={training.testDuration || 20}
                                    onChange={(e) => setTraining({ ...training, testDuration: parseInt(e.target.value) || 20 })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Total Questions to Show</label>
                                <input
                                    type="number"
                                    value={training.totalQuestions}
                                    onChange={(e) => setTraining({ ...training, totalQuestions: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={training.negativeMarking || false}
                                    onChange={(e) => setTraining({ ...training, negativeMarking: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300 cursor-pointer"
                                />
                                <span className="ml-3 text-sm font-bold text-slate-900">Enable Negative Marking</span>
                            </div>

                            {training.negativeMarking && (
                                <div className="flex items-center">
                                    <span className="text-sm text-slate-500 mr-3">Deduct per wrong answer:</span>
                                    <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200 w-24">
                                        <input
                                            type="number"
                                            step="0.25"
                                            value={training.negativeMarkingValue || 0}
                                            onChange={(e) => setTraining({ ...training, negativeMarkingValue: parseFloat(e.target.value) })}
                                            className="w-full outline-none font-bold text-red-500 bg-transparent"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Security Settings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100">
                            {/* No Copy Paste */}
                            <div
                                onClick={() => setTraining({ ...training, noCopyPaste: !training.noCopyPaste })}
                                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${training.noCopyPaste ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${training.noCopyPaste ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <span className={`block text-sm font-bold ${training.noCopyPaste ? 'text-indigo-900' : 'text-slate-700'}`}>No Copy Paste</span>
                                </div>
                                {training.noCopyPaste && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                            </div>

                            {/* No Tab Switching */}
                            <div
                                onClick={() => setTraining({ ...training, noTabSwitch: !training.noTabSwitch })}
                                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${training.noTabSwitch ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${training.noTabSwitch ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                                    <Lock className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <span className={`block text-sm font-bold ${training.noTabSwitch ? 'text-indigo-900' : 'text-slate-700'}`}>No Tab Switch</span>
                                </div>
                                {training.noTabSwitch && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                            </div>

                            {/* No Screenshots */}
                            <div
                                onClick={() => setTraining({ ...training, noScreenshot: !training.noScreenshot })}
                                className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${training.noScreenshot ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${training.noScreenshot ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <span className={`block text-sm font-bold ${training.noScreenshot ? 'text-indigo-900' : 'text-slate-700'}`}>No Screenshot</span>
                                </div>
                                {training.noScreenshot && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                            </div>
                        </div>
                    </div>

                    {/* Assessment Questions */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center justify-between">
                            <span>Assessment Questions</span>
                            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                {training.questions?.length || 0} Questions
                            </span>
                        </h2>

                        <div className="space-y-6">
                            {training.questions && training.questions.map((q, index) => (
                                <div key={index} className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${q.type === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {q.type === 'mcq' ? 'Multiple Choice' : 'Fill in Blank'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                const newQuestions = training.questions.filter((_, i) => i !== index);
                                                setTraining({ ...training, questions: newQuestions });
                                            }}
                                            className="text-slate-400 hover:text-red-500 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={q.question}
                                            onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-medium"
                                        />

                                        {q.type === 'mcq' && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-slate-200">
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={optIndex} className="flex items-center">
                                                        <div className={`w-3 h-3 rounded-full mr-2 ${q.correctAnswer === opt ? 'bg-green-500 ring-2 ring-green-200' : 'bg-slate-300'}`}></div>
                                                        <input
                                                            type="text"
                                                            value={opt}
                                                            onChange={(e) => {
                                                                const newOptions = [...q.options];
                                                                const oldVal = newOptions[optIndex];
                                                                newOptions[optIndex] = e.target.value;

                                                                // Also update correctAnswer if it matched the old value
                                                                // This handles the text sync issue.
                                                                let newCorrectAnswer = q.correctAnswer;
                                                                if (q.correctAnswer === oldVal) {
                                                                    newCorrectAnswer = e.target.value;
                                                                }

                                                                const updatedQuestions = [...training.questions];
                                                                updatedQuestions[index] = {
                                                                    ...updatedQuestions[index],
                                                                    options: newOptions,
                                                                    correctAnswer: newCorrectAnswer
                                                                };
                                                                setTraining({ ...training, questions: updatedQuestions });
                                                            }}
                                                            className="w-full px-2 py-1 bg-transparent border-b border-transparent focus:border-indigo-300 outline-none text-sm text-slate-600"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {/* Fallback for FIB */}
                                        {q.type !== 'mcq' && (
                                            <div className="flex items-center">
                                                <span className="text-sm font-bold text-slate-400 mr-2">Answer:</span>
                                                <input
                                                    type="text"
                                                    value={q.answer}
                                                    onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                                                    className="px-2 py-1 border-b border-slate-200 focus:border-indigo-500 outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(!training.questions || training.questions.length === 0) && (
                                <div className="text-center py-8 text-slate-400">
                                    No questions available.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrainingDetails;
