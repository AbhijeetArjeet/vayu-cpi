"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, Shield, CheckCircle2, AlertCircle, RefreshCw, Lock, ArrowLeft } from "lucide-react";
import { fetchAdminUsers, createAdminUser, updateAdminUser, fetchAuthMe } from "../../../lib/api";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("REGULATOR");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminUsers();
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!name || !phone) {
      setError("Please fill out full name and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAdminUser({ name, phone, email, role });
      setSuccessMsg(res.message || "User registered successfully.");
      setName("");
      setPhone("");
      setEmail("");
      setRole("REGULATOR");
      loadUsers();
    } catch (err: any) {
      setError(err.message || "User registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await updateAdminUser(user.id, { is_active: !user.is_active });
      loadUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user status.");
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 font-mono">
        <div className="flex items-center gap-3">
          <Link
            href="/regulator-login"
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              ADMIN USER MANAGEMENT & REGULATOR REGISTRY
            </h1>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
          ADMIN ACCESS
        </span>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-400 text-xs font-mono">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-xs font-mono">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Register Form + User Directory Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Register New Regulator Form */}
        <div className="glass-panel p-6 bg-slate-900/80 border-slate-800 font-mono space-y-4 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserPlus className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold uppercase text-white tracking-wider">
              AUTHORIZE NEW REGULATOR
            </h2>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Official Full Name</label>
              <input
                type="text"
                placeholder="Dr. A. Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Mobile Number (+91)</label>
              <input
                type="tel"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Official Email Address</label>
              <input
                type="email"
                placeholder="official@mospi.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold block">Assign Access Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="REGULATOR">REGULATOR (Intelligence Access)</option>
                <option value="ADMIN">ADMIN (Full Control Access)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded text-xs uppercase tracking-wider transition-all"
            >
              {submitting ? "Registering..." : "Authorize Regulator Account"}
            </button>
          </form>
        </div>

        {/* Directory Table */}
        <div className="lg:col-span-2 glass-panel p-6 bg-slate-900/80 border-slate-800 font-mono space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase text-white tracking-wider">
                REGISTERED OFFICIALS DIRECTORY ({users.length})
              </h2>
            </div>
            <button
              onClick={loadUsers}
              className="p-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              <span>Loading user directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded">
              No registered user accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Official Name</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Registered Mobile</th>
                    <th className="py-2.5 px-3">Last Login</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.email || "No Email"}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            u.role === "ADMIN"
                              ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-bold">{u.phone_masked}</td>
                      <td className="py-3 px-3 text-slate-400 text-[10px]">
                        {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Never"}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.is_active
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {u.is_active ? "ACTIVE" : "SUSPENDED"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors ${
                            u.is_active
                              ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                              : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
