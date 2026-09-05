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
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen md:h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden bg-[#f8fafc]">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "linear" 
          }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-300/30 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -60, 0],
            opacity: [0.2, 0.4, 0.2] 
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity,
            ease: "linear",
            delay: 2
          }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-300/20 rounded-full blur-[100px]"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl w-full relative z-10"
      >
        <div className="text-center mb-8 md:mb-6 lg:mb-10 space-y-4 md:space-y-6">
          <motion.div variants={itemVariants} className="inline-flex items-center px-4 py-2 bg-white border border-indigo-100 rounded-full text-indigo-600 text-xs md:text-sm font-semibold tracking-wide mb-2 md:mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
            TRAINING MANIA PORTAL
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-tight drop-shadow-sm">
            Welcome Back
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
            Select your role to access the dashboard and manage your training modules efficiently.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl lg:max-w-5xl mx-auto px-4">
          {/* Admin Card */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin/login')}
            className="cursor-pointer group relative bg-white p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 transition-all duration-500 text-left overflow-hidden shadow-xl shadow-indigo-100/50 hover:shadow-2xl hover:shadow-indigo-200/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-lg shadow-indigo-200 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 md:mb-4 group-hover:text-indigo-600 transition-colors">
                Admin Portal
              </h2>
              <p className="text-slate-500 mb-6 md:mb-10 text-sm md:text-base lg:text-lg leading-relaxed">
                Manage users, create training modules, and track organization-wide progress.
              </p>
              
              <div className="flex items-center text-indigo-600 font-bold text-base md:text-lg group-hover:translate-x-2 transition-transform">
                Login as Admin <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2" />
              </div>
            </div>
          </motion.button>

          {/* Candidate Card */}
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/candidate/login')}
            className="cursor-pointer group relative bg-white p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all duration-500 text-left overflow-hidden shadow-xl shadow-blue-100/50 hover:shadow-2xl hover:shadow-blue-200/50"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-lg group-hover:border-blue-200 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                <User className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
              </div>
              
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3 md:mb-4 group-hover:text-blue-600 transition-colors">
                Candidate Portal
              </h2>
              <p className="text-slate-500 mb-6 md:mb-10 text-sm md:text-base lg:text-lg leading-relaxed">
                Access your assigned training, view progress, and complete assessments.
              </p>
              
              <div className="flex items-center text-blue-600 font-bold text-base md:text-lg group-hover:translate-x-2 transition-transform">
                Login as Candidate <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2" />
              </div>
            </div>
          </motion.button>
        </div>
        
        <motion.div variants={itemVariants} className="mt-6 md:mt-8 lg:mt-14 text-center text-slate-400 text-xs md:text-sm font-medium">
          &copy; {new Date().getFullYear()} Training Mania. All rights reserved.
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
