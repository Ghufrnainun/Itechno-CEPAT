'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@itechno.id');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/admin/dashboard');
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F6F3] text-[#111111] p-4 relative">
      {/* Login Container */}
      <div className="relative w-full max-w-sm bg-white border border-[#EAEAEA] rounded-xl p-8 shadow-sm space-y-6">
        {/* Brand & Security Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[#E6F4F1] text-[#0F766E] border border-[#BDE3DC]/60 mb-1">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#111111] font-sans">
            CEPAT Admin
          </h1>
          <p className="text-xs text-[#787774]">
            Internal Platform Governance Portal
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#787774] mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-[#F7F6F3] border border-[#EAEAEA] rounded-md text-xs text-[#111111] placeholder-[#787774] focus:border-[#111111] focus:bg-white outline-none transition-all"
                placeholder="admin@domain.id"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#787774] mb-1">
              Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787774]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-[#F7F6F3] border border-[#EAEAEA] rounded-md text-xs text-[#111111] placeholder-[#787774] focus:border-[#111111] focus:bg-white outline-none transition-all"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#111111] hover:bg-[#333333] text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footnote */}
        <div className="pt-4 border-t border-[#EAEAEA] text-center">
          <p className="text-[10px] text-[#787774]">
            Protected area. Unauthorized access attempts are monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
