"use client";

import { motion, Variants } from 'framer-motion';
import { Zap, Brain, Rocket } from 'lucide-react';

const featuresData = [
  {
    title: 'Real-time Sync',
    description: 'Collaborate with your team seamlessly with sub-millisecond latency synchronization protocols.',
    icon: <Zap size={24} className="text-teal-400" />,
  },
  {
    title: 'Advanced AI Assistant',
    description: 'Write better code faster with our context-aware, integrated AI pairing intelligence.',
    icon: <Brain size={24} className="text-purple-500" />,
  },
  {
    title: 'Instant Deployments',
    description: 'Push to production with a single click. Zero configuration or CI/CD pipelines required.',
    icon: <Rocket size={24} className="text-indigo-500" />,
  }
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export const Features = () => {
  return (
    <section id="features" className="py-32 px-6 max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-20">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">Engineered for Speed</h2>
        <p className="text-slate-400 max-w-xl mx-auto text-lg pt-2">Everything you need to manage your engineering workflows in one beautiful, minimal interface.</p>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {featuresData.map((feature, idx) => (
          <motion.div 
            key={idx}
            variants={item}
            whileHover={{ y: -8 }}
            className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-2xl transition-colors duration-300 flex flex-col items-start cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-slate-400 group-hover:text-slate-300 transition-colors leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};
