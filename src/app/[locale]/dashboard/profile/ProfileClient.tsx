"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, User, Building, Mail, KeyRound, Loader2 } from "lucide-react";

export default function ProfileClient({ user }: { user: any }) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("DashboardCommon");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleDisable2FA = async () => {
    if (!confirm(t("disableConfirm"))) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/totp-disable", { method: "POST" });
      if (res.ok) {
        setSuccessMsg(t("disabledSuccess"));
        setTimeout(() => {
           router.refresh();
           router.push("/auth/setup-totp");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    const dest = user.role === "CONSERJE" ? "/dashboard/conserje" : "/dashboard/resident";
    router.push(dest);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[68px]">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("title")}</h1>
              <p className="text-slate-500 text-sm font-medium">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-sm"
          >
            {tCommon("back")}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {successMsg && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 font-medium flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Info Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <User className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">{t("personalInfo")}</h3>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("role")}</label>
                <div className="mt-1 font-medium text-slate-900 flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase rounded-md border border-indigo-100">
                    {user.role}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Mail className="w-3 h-3"/> {t("email")}</label>
                <div className="mt-1 font-medium text-slate-900">{user.email}</div>
              </div>

              {user.role === "RESIDENTE" && user.apartment && (
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Building className="w-3 h-3"/> {t("apartment")}</label>
                  <div className="mt-1 font-medium text-slate-900">{user.apartment.number} {user.apartment.tower ? `(Tower ${user.apartment.tower})` : ''}</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">{t("security")}</h3>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${user.totpEnabled ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                  {user.totpEnabled ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">{t("twoFactorDesc")}</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    {user.totpEnabled 
                      ? "Your account is currently protected by Google Authenticator 2FA. Disabling it will require you to set it up again next time you log in."
                      : "You do not have 2FA enabled. It is highly recommended to enable it for security."}
                  </p>
                  
                  {user.totpEnabled ? (
                    <button
                      onClick={handleDisable2FA}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all duration-200 text-sm border border-red-200 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("disable2FA")}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/auth/setup-totp")}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all duration-200 text-sm"
                    >
                      {t("enable2FA")}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
