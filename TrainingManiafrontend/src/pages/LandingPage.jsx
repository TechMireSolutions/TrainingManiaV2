import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 16, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 14
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 py-8 sm:py-10 md:py-12 relative overflow-x-hidden bg-[#f8fafc]">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "linear" 
          }}
          className="absolute top-[-20%] left-[-10%] w-[85%] sm:w-[60%] h-[60%] bg-indigo-300/30 rounded-full blur-[60px] sm:blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.25, 1],
            rotate: [0, -60, 0],
            opacity: [0.15, 0.3, 0.15] 
          }}
          transition={{ 
            duration: 16, 
            repeat: Infinity,
            ease: "linear",
            delay: 2
          }}
          className="absolute bottom-[-20%] right-[-10%] w-[85%] sm:w-[60%] h-[60%] bg-blue-300/20 rounded-full blur-[60px] sm:blur-[100px]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-5xl w-full mx-auto relative z-10 flex flex-col items-center my-auto"
      >
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 space-y-3 sm:space-y-4 w-full max-w-2xl mx-auto px-2">
          {/* Badge */}
          <motion.div 
            variants={itemVariants} 
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 bg-white border border-indigo-100/80 rounded-full text-indigo-600 text-xs sm:text-sm font-semibold tracking-wide shadow-sm max-w-[90vw]"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
            <span className="truncate">TRAINING MANIA PORTAL</span>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            variants={itemVariants} 
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight drop-shadow-sm"
          >
            Welcome Back
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            variants={itemVariants} 
            className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-500 max-w-xl mx-auto font-normal leading-relaxed px-2"
          >
            Select your role to access the dashboard and manage your training modules efficiently.
          </motion.p>
        </div>

        {/* Portal Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl w-full mx-auto px-2 sm:px-4">
          {/* Admin Card */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin/login')}
            className="w-full cursor-pointer group relative bg-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden shadow-lg shadow-indigo-100/40 hover:shadow-xl hover:shadow-indigo-200/50 flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="relative z-10 w-full">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-md shadow-indigo-200 group-hover:scale-105 group-hover:rotate-2 transition-all duration-300">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                Admin Portal
              </h2>
              <p className="text-slate-500 mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base leading-relaxed">
                Manage users, create training modules, and track organization-wide progress.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center text-indigo-600 font-semibold text-xs sm:text-sm md:text-base group-hover:translate-x-1.5 transition-transform">
              Login as Admin <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 ml-1.5 shrink-0" />
            </div>
          </motion.button>

          {/* Candidate Card */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/candidate/login')}
            className="w-full cursor-pointer group relative bg-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-blue-200 transition-all duration-300 text-left overflow-hidden shadow-lg shadow-blue-100/40 hover:shadow-xl hover:shadow-blue-200/50 flex flex-col justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="relative z-10 w-full">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white border border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-md shadow-slate-100 group-hover:border-blue-200 group-hover:scale-105 group-hover:-rotate-2 transition-all duration-300">
                <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-500" />
              </div>
              
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                Candidate Portal
              </h2>
              <p className="text-slate-500 mb-5 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base leading-relaxed">
                Access your assigned training, view progress, and complete assessments.
              </p>
            </div>
            
            <div className="relative z-10 flex items-center text-blue-600 font-semibold text-xs sm:text-sm md:text-base group-hover:translate-x-1.5 transition-transform">
              Login as Candidate <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 ml-1.5 shrink-0" />
            </div>
          </motion.button>
        </div>
        
        {/* Footer */}
        <motion.div variants={itemVariants} className="mt-6 sm:mt-8 md:mt-10 text-center text-slate-400 text-xs sm:text-sm font-medium px-4">
          &copy; {new Date().getFullYear()} Training Mania. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
