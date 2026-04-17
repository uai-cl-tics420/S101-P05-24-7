"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, CheckCircle, ArrowRight, Loader2 } from "lucide-react";

type Role = "CONSERJE" | "RESIDENTE" | null;

interface Apartment {
  id: string;
  number: string;
  tower: string | null;
}

export default function OnboardingClient({ apartments }: { apartments: Apartment[] }) {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [apartmentId, setApartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 3;

  const handleNext = () => {
    if (step === 1 && role === "CONSERJE") {
      setStep(3); // Skip apartment selection
    } else {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, apartmentId: role === "RESIDENTE" ? apartmentId : null }),
      });

      if (res.ok) {
        // Force refresh session/server components
        router.refresh();
        const dest = role === "CONSERJE" ? "/dashboard/conserje" : "/dashboard/resident";
        router.push(dest);
      } else {
        console.error("Failed to complete onboarding");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepDisplay = step === 3 && role === "CONSERJE" ? 2 : step;
  const totalStepsDisplay = role === "CONSERJE" ? 2 : 3;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center pt-20 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-neutral-400">{t("subtitle")}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-400 font-medium">
              {t("progress", { current: currentStepDisplay, total: totalStepsDisplay })}
            </span>
            <span className="text-sm font-medium text-indigo-400">
              {Math.round((currentStepDisplay / totalStepsDisplay) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-indigo-600 rounded-full"
              initial={{ width: "33%" }}
              animate={{ width: \`\${(currentStepDisplay / totalStepsDisplay) * 100}%\` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Cards / Forms */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6 md:p-10 shadow-2xl overflow-hidden relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-white text-center mb-8">{t("step1.title")}</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <button
                    onClick={() => { setRole("CONSERJE"); }}
                    className={\`p-6 rounded-xl border-2 text-left transition-all \${role === "CONSERJE" ? "border-indigo-500 bg-indigo-500/10" : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"}\`}
                  >
                  <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
                    <User size={24} />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">{t("step1.concierge")}</h3>
                  <p className="text-sm text-neutral-400">{t("step1.conciergeDesc")}</p>
                </button>

                <button
                  onClick={() => { setRole("RESIDENTE"); }}
                  className={\`p-6 rounded-xl border-2 text-left transition-all \${role === "RESIDENTE" ? "border-emerald-500 bg-emerald-500/10" : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"}\`}
                  >
                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
                  <Home size={24} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{t("step1.resident")}</h3>
                <p className="text-sm text-neutral-400">{t("step1.residentDesc")}</p>
              </button>
                </div>

        <div className="mt-8 flex justify-end">
          <button
            disabled={!role}
            onClick={handleNext}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{t("continue")}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
            )}

      {step === 2 && role === "RESIDENTE" && (
        <motion.div
          key="step2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold text-white text-center mb-8">{t("step2.title")}</h2>

          {apartments.length === 0 ? (
            <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400">{t("step2.noApartments")}</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-neutral-300 mb-2">{t("apartment")}</label>
              <select
                value={apartmentId}
                onChange={(e) => setApartmentId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>{t("step2.placeholder")}</option>
                {apartments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.number} {apt.tower ?\`({t(ower)} \${apt.tower})\` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-neutral-400 hover:text-white px-4 py-2 font-medium transition-colors"
            >
              {t("back")}
            </button>
            <button
              disabled={!apartmentId}
              onClick={handleNext}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{t("continue")}</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div
          key="step3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6 text-center"
        >
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2">{t("step3.title")}</h2>
          <p className="text-neutral-400 mb-8">{t("step3.subtitle")}</p>

          <div className="bg-neutral-950 rounded-xl p-6 mb-8 max-w-sm mx-auto text-left border border-neutral-800">
            <div className="mb-4">
              <span className="text-sm text-neutral-500 block">{t("role")}</span>
              <span className="text-white font-medium">{role === "CONSERJE" ? t("step1.concierge") : t("step1.resident")}</span>
            </div>
            {role === "RESIDENTE" && (
              <div>
                <span className="text-sm text-neutral-500 block">{t("apartment")}</span>
                <span className="text-white font-medium">
                  {apartments.find(a => a.id === apartmentId)?.number}
                  {apartments.find(a => a.id === apartmentId)?.tower ?\` ({t(ower)} \${apartments.find(a => a.id === apartmentId)?.tower})\` : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-between max-w-sm mx-auto items-center">
            <button
              onClick={() => setStep(role === "CONSERJE" ? 1 : 2)}
              className="text-neutral-400 hover:text-white px-4 py-2 font-medium transition-colors"
              disabled={isLoading}
            >
              {t("back")}
            </button>
            <button
              onClick={handleComplete}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <span>{t("step3.cta")}</span>}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
        </div >
      </div >
    </div >
  );
}
