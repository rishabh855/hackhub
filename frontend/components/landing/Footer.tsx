import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[#040814] pt-20 pb-10 px-6 mt-32 relative z-10">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-7 h-7 rounded bg-indigo-500 flex items-center justify-center font-bold text-white text-xs">
              H
            </div>
            <span className="font-bold text-white tracking-tight text-lg">HackHub</span>
          </div>
          <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
            Building the next generation of collaborative tools for elite engineering teams pushing the boundaries of software.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-6 tracking-tight">Product</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li><Link href="#features" className="hover:text-indigo-500 transition-colors">Features</Link></li>
            <li><Link href="#" className="hover:text-indigo-500 transition-colors">Pricing</Link></li>
            <li><Link href="#" className="hover:text-indigo-500 transition-colors">Changelog</Link></li>
            <li><Link href="#" className="hover:text-indigo-500 transition-colors">Integrations</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-6 tracking-tight">Legal</h4>
          <ul className="space-y-4 text-sm text-slate-400">
            <li><Link href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</Link></li>
            <li><Link href="#" className="hover:text-indigo-500 transition-colors">Terms of Service</Link></li>
            <li><Link href="#" className="hover:text-indigo-500 transition-colors">Security</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto pt-8 border-t border-white/5 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>© 2026 HackHub Inc. All rights reserved.</p>
        <div className="flex gap-4">
           {[1,2,3].map(i => (
             <div key={i} className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer" />
           ))}
        </div>
      </div>
    </footer>
  );
};
