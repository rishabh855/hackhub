"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50 rounded-2xl px-6 py-4 flex items-center justify-between backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl"
    >
      <Link href="/" className="flex items-center gap-3 cursor-pointer group">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
          H
        </div>
        <span className="font-bold text-xl tracking-tight text-white">HackHub</span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a>
        <Link href="/login" className="hover:text-white transition-colors">About</Link>
      </div>

      <div className="flex items-center gap-5">
        <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors hidden sm:block">
          Sign In
        </Link>
        <Link href="/login">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-shadow"
          >
            Get Started
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  );
};
