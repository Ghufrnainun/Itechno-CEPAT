'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Email atau password admin salah.');
        return;
      }

      router.replace('/admin/dashboard');
    } catch {
      setError('Terjadi kendala jaringan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface text-on-surface p-4 sm:p-6 font-sans">
      <div className="w-full max-w-sm bg-surface-container-lowest border border-card-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="CEPAT Logo"
              width={40}
              height={40}
              className="rounded-xl object-contain"
              priority
            />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface font-headline">
              Login Admin
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Masuk untuk mengelola platform CEPAT
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 bg-error-container/30 border border-error/25 rounded-xl text-xs text-error animate-fadeIn"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="admin@itechno.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            disabled={loading}
            autoComplete="email"
            required
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            disabled={loading}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={loading || !email || !password}
            className="mt-2 text-sm font-bold"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        {/* Back Link */}
        <div className="pt-2 border-t border-card-border text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
