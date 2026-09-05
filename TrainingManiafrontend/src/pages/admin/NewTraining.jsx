import React, { useState } from 'react';
import {
  Youtube,
  FileText,
  CheckSquare,
  AlertCircle,
  Save,
  X,
  Lock,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewTraining = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  // Video State
  const [videoType, setVideoType] = useState('youtube'); // 'youtube' or 'upload'
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);

  const [testTypes, setTestTypes] = useState({
    mcq: true,
    fillInBlanks: false,
    shortAnswer: false
  });
  const [percentages, setPercentages] = useState({
    mcq: 100,
    fillInBlanks: 0,
    shortAnswer: 0
  });
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [attempts, setAttempts] = useState(3);
  const [testDuration, setTestDuration] = useState(20);
  const [totalMarks, setTotalMarks] = useState('');
  const [passingMarks, setPassingMarks] = useState('');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkingValue, setNegativeMarkingValue] = useState(0.25);
  const [securitySettings, setSecuritySettings] = useState({
    noCopyPaste: false,
    noTabSwitch: false,
    noScreenshot: false
  });

  const handleTestTypeChange = (type) => {
    const nextTestTypes = { ...testTypes, [type]: !testTypes[type] };
    setTestTypes(nextTestTypes);

    const activeTypes = Object.keys(nextTestTypes).filter(k => nextTestTypes[k]);
    const count = activeTypes.length;

    if (count === 0) {
      setPercentages({ mcq: 0, fillInBlanks: 0, shortAnswer: 0 });
    } else if (count === 1) {
      setPercentages({
        mcq: nextTestTypes.mcq ? 100 : 0,
        fillInBlanks: nextTestTypes.fillInBlanks ? 100 : 0,
        shortAnswer: nextTestTypes.shortAnswer ? 100 : 0
      });
    } else if (count === 2) {
      const p = { mcq: 0, fillInBlanks: 0, shortAnswer: 0 };
      activeTypes.forEach(t => p[t] = 50);
      setPercentages(p);
    } else if (count === 3) {
      setPercentages({ mcq: 34, fillInBlanks: 33, shortAnswer: 33 });
    }
  };

  const handlePercentageChange = (type, val) => {
    let value = val === '' ? 0 : parseInt(val);
    if (isNaN(value)) value = 0;
    if (value > 100) value = 100;
    if (value < 0) value = 0;

    setPercentages(prev => ({ ...prev, [type]: value }));
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Create New Training</h2>
        <p className="text-slate-500">Configure the course content and assessment rules.</p>
      </div>

      <form className="space-y-8">
        {/* Title Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Training Module Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Introduction to React"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-lg font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* 1. Course Content Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">1</div>
            Course Materials
          </h3>

          <div className="space-y-8">
            {/* PDF Upload (Required) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Training Manual (PDF) <span className="text-red-500">*</span>
              </label>
              {!selectedFile ? (
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          alert('File size exceeds 10MB');
                          e.target.value = null;
                          return;
                        }
                        setSelectedFile(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-900 font-medium">Click to upload training manual</p>
                    <p className="text-sm text-slate-500">Required: PDF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm mr-4 flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Uploaded successfully</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Video (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Video Tutorial (Optional)
              </label>

              {/* Video Type Toggle */}
              <div className="flex gap-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="videoType"
                    checked={videoType === 'youtube'}
                    onChange={() => setVideoType('youtube')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-slate-700 font-medium">Video Link</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="videoType"
                    checked={videoType === 'upload'}
                    onChange={() => setVideoType('upload')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-slate-700 font-medium">Upload Video</span>
                </label>
              </div>

              {videoType === 'youtube' ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Youtube className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="trainingvideo.mp4"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              ) : (
                <div>
                  {!videoFile ? (
                    <div className="relative">
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                              alert('Video size exceeds 100MB');
                              e.target.value = null;
                              return;
                            }
                            setVideoFile(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                        <Youtube className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-900 font-medium">Click to upload video</p>
                        <p className="text-sm text-slate-500">MP4, WebM up to 100MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center overflow-hidden">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm mr-4 flex-shrink-0">
                          <Youtube className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{videoFile.name}</p>
                          <p className="text-xs text-slate-500">{(videoFile.size / 1024 / 1024).toFixed(2)} MB • Uploaded</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setVideoFile(null)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Upload (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Course Thumbnail (Optional)
              </label>
              {!thumbnailFile ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) { // 2MB limit
                          alert('Image size exceeds 2MB');
                          e.target.value = null;
                          return;
                        }
                        setThumbnailFile(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <FileText className="w-6 h-6" />
                    </div>
                    <p className="text-slate-900 font-medium">Click to upload thumbnail</p>
                    <p className="text-sm text-slate-500">JPG, PNG up to 2MB</p>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center overflow-hidden">
                    <div className="w-16 h-10 bg-slate-200 rounded-lg overflow-hidden mr-4 flex-shrink-0">
                      <img
                        src={URL.createObjectURL(thumbnailFile)}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{thumbnailFile.name}</p>
                      <p className="text-xs text-slate-500">{(thumbnailFile.size / 1024).toFixed(2)} KB • Uploaded</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setThumbnailFile(null)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Assessment Configuration */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">2</div>
            Assessment Structure
          </h3>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={testTypes.mcq}
                  onChange={() => handleTestTypeChange('mcq')}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-slate-900">Multiple Choice Questions</span>
                  <span className="text-xs text-slate-500">Standard MCQ format</span>
                </div>
              </div>
              {testTypes.mcq && (
                <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200 self-start sm:self-auto">
                  <input
                    type="number"
                    value={percentages.mcq}
                    onChange={(e) => handlePercentageChange('mcq', e.target.value)}
                    className="w-16 text-right outline-none font-bold text-indigo-600 bg-transparent"
                  />
                  <span className="ml-1 text-slate-500 font-medium">%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={testTypes.fillInBlanks}
                  onChange={() => handleTestTypeChange('fillInBlanks')}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-slate-900">Fill in the Blanks</span>
                  <span className="text-xs text-slate-500">Text input based answers</span>
                </div>
              </div>
              {testTypes.fillInBlanks && (
                <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200 self-start sm:self-auto">
                  <input
                    type="number"
                    value={percentages.fillInBlanks}
                    onChange={(e) => handlePercentageChange('fillInBlanks', e.target.value)}
                    className="w-16 text-right outline-none font-bold text-indigo-600 bg-transparent"
                  />
                  <span className="ml-1 text-slate-500 font-medium">%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={testTypes.shortAnswer}
                  onChange={() => handleTestTypeChange('shortAnswer')}
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-bold text-slate-900">Short Answer Questions</span>
                  <span className="text-xs text-slate-500">Descriptive text answers</span>
                </div>
              </div>
              {testTypes.shortAnswer && (
                <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200 self-start sm:self-auto">
                  <input
                    type="number"
                    value={percentages.shortAnswer}
                    onChange={(e) => handlePercentageChange('shortAnswer', e.target.value)}
                    className="w-16 text-right outline-none font-bold text-indigo-600 bg-transparent"
                  />
                  <span className="ml-1 text-slate-500 font-medium">%</span>
                </div>
              )}
            </div>

            {(percentages.mcq + percentages.fillInBlanks + percentages.shortAnswer !== 100) && (
              <div className="flex items-center text-amber-700 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                <AlertCircle className="w-4 h-4 mr-2" />
                Total percentage must equal 100% (Current: {percentages.mcq + percentages.fillInBlanks + percentages.shortAnswer}%)
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Total Number of Questions</label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTotalQuestions('');
                    return;
                  }
                  const num = parseInt(val);
                  // Allow typing, but max is 100. Min 10 is enforced on save.
                  if (num >= 0 && num <= 100) {
                    setTotalQuestions(num);
                  }
                }}
                onBlur={() => {
                  if (totalQuestions !== '' && parseInt(totalQuestions) < 10) {
                    setTotalQuestions(10);
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900"
                placeholder="Min 10 - Max 100"
              />
            </div>
          </div>
        </div>

        {/* 3. Rules & Scoring */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">3</div>
            Rules & Scoring
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Total Marks</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val <= 100 || e.target.value === '') setTotalMarks(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900"
                placeholder="Max 100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Passing Marks</label>
              <input
                type="number"
                value={passingMarks}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val <= 100 || e.target.value === '') setPassingMarks(e.target.value);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900"
                placeholder="Max 100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Allowed Attempts</label>
              <input
                type="number"
                value={attempts}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val < 10 || e.target.value === '') setAttempts(val || '');
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Test Duration (Mins)</label>
              <input
                type="number"
                value={testDuration}
                onChange={(e) => setTestDuration(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 outline-none transition-all text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center">
              <div className={`w-10 h-6 rounded-full p-1 transition-colors cursor-pointer ${negativeMarking ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => setNegativeMarking(!negativeMarking)}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${negativeMarking ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="ml-3 text-sm font-bold text-slate-900">Enable Negative Marking</span>
            </div>

            {negativeMarking && (
              <div className="flex items-center">
                <span className="text-sm text-slate-500 mr-3">Deduct per wrong answer:</span>
                <div className="flex items-center bg-white px-3 py-2 rounded-lg border border-slate-200 w-24">
                  <input
                    type="number"
                    step="0.25"
                    value={negativeMarkingValue}
                    onChange={(e) => setNegativeMarkingValue(parseFloat(e.target.value))}
                    className="w-full outline-none font-bold text-red-500 bg-transparent"
                    placeholder="0.25"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Rules & Regulations (Security) */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3">4</div>
            Rules & Regulations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* No Copy Paste */}
            <div
              onClick={() => setSecuritySettings(prev => ({ ...prev, noCopyPaste: !prev.noCopyPaste }))}
              className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${securitySettings.noCopyPaste ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${securitySettings.noCopyPaste ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-bold ${securitySettings.noCopyPaste ? 'text-indigo-900' : 'text-slate-700'}`}>No Copy Paste</span>
                <span className="text-xs text-slate-500">Disable clipboard actions</span>
              </div>
              <div className={`ml-auto w-5 h-5 rounded border flex items-center justify-center ${securitySettings.noCopyPaste ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                {securitySettings.noCopyPaste && <CheckSquare className="w-3 h-3" />}
              </div>
            </div>

            {/* No Tab Switching */}
            <div
              onClick={() => setSecuritySettings(prev => ({ ...prev, noTabSwitch: !prev.noTabSwitch }))}
              className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${securitySettings.noTabSwitch ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${securitySettings.noTabSwitch ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-bold ${securitySettings.noTabSwitch ? 'text-indigo-900' : 'text-slate-700'}`}>No Tab Switching</span>
                <span className="text-xs text-slate-500">Auto-submit on violation</span>
              </div>
              <div className={`ml-auto w-5 h-5 rounded border flex items-center justify-center ${securitySettings.noTabSwitch ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                {securitySettings.noTabSwitch && <CheckSquare className="w-3 h-3" />}
              </div>
            </div>

            {/* No Screenshots */}
            <div
              onClick={() => setSecuritySettings(prev => ({ ...prev, noScreenshot: !prev.noScreenshot }))}
              className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${securitySettings.noScreenshot ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-200'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${securitySettings.noScreenshot ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className={`block font-bold ${securitySettings.noScreenshot ? 'text-indigo-900' : 'text-slate-700'}`}>No Screenshots</span>
                <span className="text-xs text-slate-500"> Prevent screen capture</span>
              </div>
              <div className={`ml-auto w-5 h-5 rounded border flex items-center justify-center ${securitySettings.noScreenshot ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                {securitySettings.noScreenshot && <CheckSquare className="w-3 h-3" />}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={() => {
              // Validate Required Fields (Title & PDF)
              if (!title.trim()) {
                alert('Please enter a training title');
                return;
              }
              if (!selectedFile) {
                alert('Please upload a PDF training manual');
                return;
              }

              // Validate percentages
              const totalPercentage = (testTypes.mcq ? percentages.mcq : 0) +
                (testTypes.fillInBlanks ? percentages.fillInBlanks : 0) +
                (testTypes.shortAnswer ? percentages.shortAnswer : 0);

              if (totalPercentage !== 100) {
                alert(`Total percentage must equal 100% (Current: ${totalPercentage}%)`);
                return;
              }

              // Prepare config
              const config = {
                mcq: testTypes.mcq ? percentages.mcq : 0,
                fib: testTypes.fillInBlanks ? percentages.fillInBlanks : 0,
                shortAnswer: testTypes.shortAnswer ? percentages.shortAnswer : 0,
                totalQuestions: totalQuestions
              };

              // Validate Total Questions
              if (totalQuestions < 10 || totalQuestions > 100) {
                alert('Total questions must be between 10 and 100');
                return;
              }

              // Navigate to preview
              navigate('/admin/test-preview', {
                state: {
                  config,
                  title,
                  videoType,
                  videoUrl: videoType === 'youtube' ? videoUrl : '', // Only pass URL if youtube
                  videoFile: videoType === 'upload' ? videoFile : null, // Pass file if upload
                  pdfFile: selectedFile, // Pass the File object!
                  settings: {
                    totalMarks: parseInt(totalMarks) || 100,
                    passingMarks: parseInt(passingMarks) || 40,
                    attempts: attempts,
                    testDuration: testDuration || 20,
                    negativeMarking: negativeMarking,
                    negativeMarkingValue: negativeMarking ? negativeMarkingValue : 0,
                    totalQuestions: totalQuestions,
                    noCopyPaste: securitySettings.noCopyPaste,
                    noTabSwitch: securitySettings.noTabSwitch,
                    noScreenshot: securitySettings.noScreenshot
                  },
                  thumbnailFile: thumbnailFile
                }
              });
            }}
            className="flex items-center bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-5 h-5 mr-2" />
            Create Training Module
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTraining;
