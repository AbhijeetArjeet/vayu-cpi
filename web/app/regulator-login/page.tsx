"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Shield, Lock, Phone, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, LogOut, Sparkles, Building2 } from "lucide-react";
import { requestRegulatorOtp, verifyRegulatorOtp, fetchAuthMe, logoutAuth } from "../../lib/api";

export default function RegulatorLoginPage() {
  const [phone, setPhone] = useState<string>("");
  const [step, setStep] = useState<"PHONE" | "OTP" | "AUTHENTICATED">("PHONE");
  const [maskedPhone, setMaskedPhone] = useState<string>("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Timer states
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [expirySeconds, setExpirySeconds] = useState<number>(300);

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    // Check if existing session is active
    fetchAuthMe().then((res) => {
      if (res && res.authenticated) {
        setUserProfile(res.user);
        setStep("AUTHENTICATED");
      }
    });
  }, []);

  // Resend cooldown timer decrement
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Expiry countdown timer decrement
  useEffect(() => {
    if (step !== "OTP" || expirySeconds <= 0) return;
    const interval = setInterval(() => {
      setExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, expirySeconds]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!phone || phone.trim().length < 10) {
      setError("Please enter a valid 10-digit registered mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestRegulatorOtp(phone.trim());
      setMaskedPhone(res.masked_phone || phone);
      setResendCooldown(res.resend_cooldown_seconds || 30);
      setExpirySeconds(res.expires_in_seconds || 300);
      setStep("OTP");
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs[0].current?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Unable to authenticate with the provided credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto focus next box
    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyRegulatorOtp(phone.trim(), fullOtp);
      setUserProfile(res.user);
      setSuccessMsg("Authentication successful. Opening Regulatory Intelligence Portal...");
      setTimeout(() => {
        setStep("AUTHENTICATED");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await requestRegulatorOtp(phone.trim());
      setResendCooldown(res.resend_cooldown_seconds || 30);
      setExpirySeconds(res.expires_in_seconds || 300);
      setSuccessMsg(`New verification code sent to ${res.masked_phone || maskedPhone}`);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await logoutAuth();
    setUserProfile(null);
    setStep("PHONE");
    setPhone("");
    setLoading(false);
  };

  const formatMinutesSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans py-4">
      {/* Header Banner */}
      <div className="glass-panel p-8 bg-slate-900/90 border-slate-800 space-y-3 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 h-40 w-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">VAYU-CPI • AIRFARE ECONOMIC INTELLIGENCE</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                OFFICIAL USE ONLY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              REGULATORY INTELLIGENCE PORTAL
            </h1>
          </div>
        </div>
        <p className="text-xs font-mono text-slate-400 max-w-2xl leading-relaxed">
          Restricted access portal for authorized Ministry of Statistics & DGCA regulatory officers. Secure two-factor authentication via official registered mobile number.
        </p>
      </div>

      {/* Step 1: Phone Entry */}
      {step === "PHONE" && (
        <div className="glass-panel p-8 max-w-md mx-auto bg-slate-900/80 border-slate-800 font-mono space-y-6">
          <div className="border-b border-slate-800 pb-4 text-center space-y-1">
            <div className="inline-flex p-3 rounded-full bg-slate-800 text-blue-400 mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">AUTHORIZED MOBILE AUTHENTICATION</h2>
            <p className="text-xs text-slate-400">Enter your registered official mobile number to receive a secure 6-digit OTP code.</p>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Authorized Mobile Number (+91)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying Authorization...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: 6-Digit OTP Verification Screen */}
      {step === "OTP" && (
        <div className="glass-panel p-8 max-w-md mx-auto bg-slate-900/80 border-slate-800 font-mono space-y-6">
          <div className="border-b border-slate-800 pb-4 text-center space-y-1">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">ENTER VERIFICATION CODE</h2>
            <p className="text-xs text-slate-400">
              We've sent a secure 6-digit verification code to:
            </p>
            <div className="text-sm font-bold text-emerald-400 tracking-wider pt-1">{maskedPhone}</div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={inputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 bg-slate-950 border border-slate-700 rounded-lg text-center text-xl font-bold text-emerald-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
              <div>
                {resendCooldown > 0 ? (
                  <span className="text-slate-500">Resend OTP in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-blue-400 hover:underline font-bold"
                  >
                    Resend OTP Code
                  </button>
                )}
              </div>
              <div>
                Verification expires in <span className="text-amber-400 font-bold">{formatMinutesSeconds(expirySeconds)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>VERIFY & OPEN PORTAL</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => setStep("PHONE")}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Change Mobile Number
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Authenticated Session View */}
      {step === "AUTHENTICATED" && userProfile && (
        <div className="space-y-6">
          {/* User Badge Bar */}
          <div className="glass-panel p-6 bg-slate-900/80 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-white text-base">{userProfile.name}</h2>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    ROLE: {userProfile.role}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Authenticated: {userProfile.phone_masked} • Session Active
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {userProfile.role === "ADMIN" && (
                <Link
                  href="/admin/users"
                  className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 rounded-lg text-xs font-bold transition-all"
                >
                  Manage Users
                </Link>
              )}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-lg text-xs font-bold transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>

          {/* Regulatory Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <Link
              href="/"
              className="glass-panel p-6 bg-slate-900/70 border-slate-800 hover:border-blue-500/50 transition-all group space-y-2"
            >
              <div className="flex items-center justify-between text-blue-400">
                <span className="text-xs font-bold uppercase">National Airfare Index</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">Real-Time Jevons Composite CPI & Live Spot Observations</p>
            </Link>

            <Link
              href="/dgca"
              className="glass-panel p-6 bg-slate-900/70 border-slate-800 hover:border-indigo-500/50 transition-all group space-y-2"
            >
              <div className="flex items-center justify-between text-indigo-400">
                <span className="text-xs font-bold uppercase">DGCA Surge Anomaly Matrix</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">Sigma Deviation Flags, HHI Concentration & Fee Breakdown</p>
            </Link>

            <Link
              href="/data"
              className="glass-panel p-6 bg-slate-900/70 border-slate-800 hover:border-emerald-500/50 transition-all group space-y-2"
            >
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-bold uppercase">Dataset Transparency Library</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-slate-400">Complete Dataset Registry Audit Trail & Provenance Metadata</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
