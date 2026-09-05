import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, ArrowRight, Clock } from "lucide-react";

const Quiz = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { course } = location.state || {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  // Initialize timer directly to avoid 0 triggering immediate submit
  const [timeLeft, setTimeLeft] = useState((course?.testDuration || 20) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isReviewing, setIsReviewing] = useState(false);
  const [processedQuestions, setProcessedQuestions] = useState([]);

  useEffect(() => {
    if (location.state?.mode === 'review') {
      setIsReviewing(true);
      setAnswers(location.state.answers || {});
    }
  }, [location.state]);

  useEffect(() => {
    if (!course) {
      navigate("/candidate/dashboard");
      return;
    }
    
    // Ensure questions have IDs
    if (course.questions) {
      const questionsWithIds = course.questions.map((q, index) => ({
        ...q,
        id: q.id || `q-${index}-${Date.now()}`
      }));
      setProcessedQuestions(questionsWithIds);
    }
  }, [course, navigate]);

  const handleReview = () => {
    setIsReviewing(true);
    setCurrentQuestionIndex(0);
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!processedQuestions || processedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Quiz</h2>
          <p className="text-slate-500 mb-8">
            The quiz questions could not be loaded. Please contact your administrator.
          </p>
          <button
            onClick={() => navigate("/candidate/dashboard")}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = processedQuestions[currentQuestionIndex];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
         <p className="text-red-500">Error: Question not found.</p>
      </div>
    );
  }

  if (isSubmitted && !isReviewing) {
    const passed = score >= (course.passingMarks || 40);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              passed
                ? "bg-emerald-100 text-emerald-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            {passed ? (
              <CheckCircle className="w-10 h-10" />
            ) : (
              <AlertCircle className="w-10 h-10" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {passed ? "Congratulations!" : "Assessment Failed"}
          </h2>
          <p className="text-slate-500 mb-6">
            You have scored{" "}
            <span className={`font-bold ${passed ? 'text-emerald-600' : 'text-red-600'}`}>{score}%</span> in this
            assessment.
          </p>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Correct</div>
              <div className="font-bold text-emerald-600 text-lg">{processedQuestions.filter(q => {
                 const userAnswer = answers[q.id];
                 return (q.type === "mcq" && userAnswer === q.correctAnswer) ||
                        (q.type === "fib" && userAnswer?.toLowerCase().trim() === (q.answer || q.correctAnswer).toLowerCase().trim());
              }).length}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Wrong</div>
              <div className="font-bold text-red-600 text-lg">{processedQuestions.filter(q => {
                 const userAnswer = answers[q.id];
                 return userAnswer && !((q.type === "mcq" && userAnswer === q.correctAnswer) ||
                        (q.type === "fib" && userAnswer?.toLowerCase().trim() === (q.answer || q.correctAnswer).toLowerCase().trim()));
              }).length}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="text-sm text-slate-500 mb-1">Skipped</div>
              <div className="font-bold text-slate-600 text-lg">{processedQuestions.filter(q => !answers[q.id]).length}</div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleReview}
              className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
            >
              Review Answers
            </button>
            {passed && (
              <button
                onClick={() => navigate(`/candidate/certificate/${course.id}`)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                View Certificate
              </button>
            )}
            <button
              onClick={() => navigate("/candidate/dashboard")}
              className={`w-full py-3 rounded-xl font-bold transition-colors ${passed ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900 truncate max-w-xs">
            {course.title} {isReviewing && <span className="text-indigo-600 ml-2">(Review Mode)</span>}
          </h1>
          {!isReviewing && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold ${
                timeLeft < 60
                  ? "bg-red-50 text-red-600"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Question {currentQuestionIndex + 1} of {processedQuestions.length}
            </span>
            <span
              className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                currentQuestion.type === "mcq"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {currentQuestion.type === "mcq"
                ? "Multiple Choice"
                : "Fill in Blank"}
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
            {currentQuestion.question}
          </h2>

          <div className="flex-1">
            {currentQuestion.type === "mcq" ? (
              <div className="space-y-3">
                {currentQuestion.options && currentQuestion.options.length > 0 ? (
                  currentQuestion.options.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    const isCorrect = option === currentQuestion.correctAnswer;
                    
                    let buttonStyle = "border-slate-100 hover:border-indigo-200 hover:bg-slate-50 text-slate-600";
                    if (isReviewing) {
                      if (isCorrect) {
                        buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium";
                      } else if (isSelected && !isCorrect) {
                        buttonStyle = "border-red-500 bg-red-50 text-red-700 font-medium";
                      } else if (isSelected) {
                         buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium";
                      }
                    } else if (isSelected) {
                      buttonStyle = "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium shadow-sm";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => !isReviewing && handleOptionSelect(currentQuestion.id, option)}
                        disabled={isReviewing}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${buttonStyle}`}
                      >
                        <div className="flex items-center">
                          <div
                            className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                               isReviewing 
                                 ? (isCorrect ? "border-emerald-500" : (isSelected ? "border-red-500" : "border-slate-300"))
                                 : (isSelected ? "border-indigo-600" : "border-slate-300")
                            }`}
                          >
                            {(isSelected || (isReviewing && isCorrect)) && (
                              <div className={`w-2.5 h-2.5 rounded-full ${isReviewing && isCorrect ? "bg-emerald-500" : (isReviewing && isSelected ? "bg-red-500" : "bg-indigo-600")}`} />
                            )}
                          </div>
                          {option}
                          {isReviewing && isCorrect && <span className="ml-auto text-xs font-bold text-emerald-600 uppercase">Correct Answer</span>}
                          {isReviewing && isSelected && !isCorrect && <span className="ml-auto text-xs font-bold text-red-600 uppercase">Your Answer</span>}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-red-500">Error: No options available for this question.</p>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) =>
                    !isReviewing && handleFibChange(currentQuestion.id, e.target.value)
                  }
                  readOnly={isReviewing}
                  placeholder="Type your answer here..."
                  className={`w-full p-4 rounded-xl border-2 outline-none transition-all text-lg ${
                    isReviewing
                      ? (answers[currentQuestion.id]?.toLowerCase().trim() === (currentQuestion.answer || currentQuestion.correctAnswer).toLowerCase().trim()
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-red-500 bg-red-50 text-red-700")
                      : "border-slate-200 focus:border-indigo-600 focus:ring-0"
                  }`}
                />
                {isReviewing && answers[currentQuestion.id]?.toLowerCase().trim() !== (currentQuestion.answer || currentQuestion.correctAnswer).toLowerCase().trim() && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
                    <span className="font-bold block text-xs uppercase mb-1">Correct Answer:</span>
                    {currentQuestion.answer || currentQuestion.correctAnswer}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-100">
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 text-slate-500 font-bold hover:text-slate-900 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors"
            >
              Previous
            </button>

            {currentQuestionIndex === processedQuestions.length - 1 ? (
              isReviewing ? (
                 <button
                  onClick={() => setIsReviewing(false)} // Go back to result screen
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Back to Results
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Submit Assessment
                </button>
              )
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(processedQuestions.length - 1, prev + 1)
                  )
                }
                className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Next Question
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Quiz;
