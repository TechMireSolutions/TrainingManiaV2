import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Download, ArrowLeft, Printer } from 'lucide-react';

const Certificate = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [candidateName, setCandidateName] = useState('');
    const [trainingTitle, setTrainingTitle] = useState('');
    const [date, setDate] = useState('');

    useEffect(() => {
        // Load Candidate
        let candidate = null;
        try {
            const authInfo = localStorage.getItem('candidateInfo');
            if (authInfo) {
                candidate = JSON.parse(authInfo);
            } else {
                // Fallback
                const stored = localStorage.getItem('current_candidate');
                if (stored) candidate = JSON.parse(stored);
            }
        } catch (e) {
            console.error("Error parsing candidate info", e);
        }

        if (!candidate) {
            navigate('/candidate/login');
            return;
        }

        setCandidateName(candidate.name || candidate.email.split('@')[0]);

        // Load Training
        const fetchTraining = async () => {
            try {
                const res = await fetch(`/api/training/${id}/`);
                if (res.ok) {
                    const data = await res.json();
                    setTrainingTitle(data.title);
                }
            } catch (err) {
                console.error("Failed to fetch training for certificate", err);
            }
        };
        fetchTraining();

        setDate(new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));

    }, [id, navigate]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
            {/* Controls */}
            <div className="w-full max-w-4xl mb-8 flex justify-between items-center print:hidden">
                <button
                    onClick={() => navigate('/candidate/dashboard')}
                    className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    <Printer className="w-5 h-5 mr-2" />
                    Print / Save PDF
                </button>
            </div>

            {/* Certificate Container */}
            <div className="bg-white p-12 rounded-none shadow-2xl max-w-5xl w-full aspect-[1.414/1] relative print:shadow-none print:w-full print:h-full print:absolute print:top-0 print:left-0 print:m-0 print:aspect-auto overflow-hidden text-center flex flex-col items-center justify-center border-[20px] border-double border-indigo-900">

                {/* Background Decorative Elements */}
                <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-900 rotate-45 transform -translate-x-20 -translate-y-20"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-900 rotate-45 transform translate-x-20 translate-y-20"></div>

                <div className="relative z-10 w-full">
                    {/* Logo / Icon */}
                    <div className="mb-8 flex justify-center">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center border-4 border-indigo-100">
                            <Award className="w-12 h-12 text-indigo-600" />
                        </div>
                    </div>

                    <h1 className="text-5xl font-serif font-bold text-slate-900 mb-4 tracking-wide uppercase">Certificate</h1>
                    <h2 className="text-2xl font-serif text-indigo-600 mb-12 tracking-widest uppercase">Of Completion</h2>

                    <p className="text-lg text-slate-500 mb-2">This is to certify that</p>

                    <div className="mb-8 px-12">
                        <h1 className="text-4xl font-serif font-bold text-slate-900 text-center w-full border-b-2 border-slate-200 py-2">
                            {candidateName}
                        </h1>
                    </div>

                    <p className="text-lg text-slate-500 mb-4">has successfully completed the training module</p>
                    <h3 className="text-3xl font-bold text-slate-900 mb-16">{trainingTitle}</h3>

                    <div className="flex justify-between items-end w-full px-20">
                        <div className="text-center">
                            <p className="text-lg font-bold text-slate-900 border-t-2 border-slate-300 pt-2 px-8">{date}</p>
                            <p className="text-sm text-slate-500 mt-1 uppercase tracking-wider">Date</p>
                        </div>

                        <div className="w-24 h-24 flex items-center justify-center relative opacity-80">
                            {/* Seal */}
                            <div className="absolute inset-0 border-4 border-dashed border-indigo-200 rounded-full animate-[spin_10s_linear_infinite]"></div>
                            <Award className="w-12 h-12 text-indigo-900" />
                        </div>

                        <div className="text-center">
                            <div className="font-dancing text-3xl text-indigo-800 mb-2">Training Mania</div>
                            <p className="text-sm text-slate-500 border-t-2 border-slate-300 pt-2 px-8 mt-1 uppercase tracking-wider">Administrator</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificate;
