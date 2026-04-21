"use client";

import { motion } from 'framer-motion';

export const DashboardPreview = () => {
  return (
    <section id="dashboard" className="py-24 px-6 overflow-hidden relative z-10">
      <div className="max-w-6xl mx-auto relative">
        <div className="absolute inset-0 bg-indigo-500/20 blur-[150px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl border border-white/10 bg-[#0d1322]/80 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        >
          {/* OS Window Header */}
          <div className="h-12 border-b border-white/10 bg-white/[0.02] flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <div className="ml-4 text-xs text-slate-500 font-medium font-mono">hackhub-workspace</div>
          </div>
          
          {/* Dashboard Skeleton */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 h-[500px]">
             {/* Sidebar */}
             <div className="hidden md:flex flex-col gap-4 border-r border-white/5 pr-4">
                <div className="h-10 rounded-lg bg-white/10 w-full mb-4"></div>
                <div className="h-6 rounded bg-white/5 w-3/4"></div>
                <div className="h-6 rounded bg-white/5 w-1/2"></div>
                <div className="h-6 rounded bg-white/5 w-2/3"></div>
             </div>
             
             {/* Main Viewer */}
             <div className="md:col-span-3 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                   <div className="h-8 rounded-md bg-white/10 w-48" />
                   <div className="h-8 rounded-full border border-indigo-500/30 bg-indigo-500/10 w-32" />
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                   {[1,2,3].map(i => (
                     <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md" />
                   ))}
                </div>
                
                {/* Visualizer Area */}
                <div className="flex-1 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden flex items-end">
                   <div className="w-full h-3/4 bg-gradient-to-t from-purple-500/20 to-transparent" />
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
