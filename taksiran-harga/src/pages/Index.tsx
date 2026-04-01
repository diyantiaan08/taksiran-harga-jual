import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/StepIndicator";
import BranchScanner from "@/components/BranchScanner";
import BarcodeInput from "@/components/BarcodeInput";
import ItemDetails from "@/components/ItemDetails";
import Questionnaire from "@/components/Questionnaire";
import AppraisalResultView from "@/components/AppraisalResult";
import { QUESTIONNAIRE, GOLD_PRICE_PER_GRAM } from "@/data/mock-data";
import type { BranchInfo, GoldItem, QuestionnaireAnswer, AppraisalResult } from "@/types/appraisal";

const STEP_LABELS = ["Cabang", "Kode Nota", "Detail", "Kondisi", "Taksiran"];

const Index = () => {
  const [searchParams] = useSearchParams();
  const presetBranch = searchParams.get("branch");

  const [step, setStep] = useState(presetBranch ? 2 : 1);
  const [branch, setBranch] = useState<BranchInfo | null>(null);
  const [item, setItem] = useState<GoldItem | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  // Token pusat, bisa akses semua domain
  const TOKEN_PUSAT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiUFVTQVQiLCJsZXZlbCI6IlNVIiwiaWF0IjoxNjQyNDAyMDg4fQ.TWq2eBf_HAtwYzeomz8KA7PJM0151iafJsJjQmz2Zxs";
  const [result, setResult] = useState<AppraisalResult | null>(null);
  const [error, setError] = useState("");

  const handleBranchFound = (b: BranchInfo) => {
    setBranch(b);
    setStep(2);
  };

  const handleBarcode = async (barcode: string) => {
    setError("");
    setItem(null);
    setMinPrice(null);
    setMaxPrice(null);
    try {
      // 1. Fetch barang by barcode
      const res = await fetch(
        `https://italy.goldstore.id/api/v1/pembelian/get/jual/${barcode}`,
        {
          headers: { "X-Auth-Token": TOKEN_PUSAT },
        }
      );
      if (!res.ok) throw new Error("Gagal mengambil data barang");
      const data = await res.json();
      if (!Array.isArray(data) || !data[0]) {
        setError("Kode barcode tidak ditemukan. Silakan coba lagi.");
        return;
      }
      const barang = data[0];
      setItem({
        barcode: barang.kode_barcode,
        nama_barang: barang.nama_barang,
        berat: barang.berat,
        harga_gram: barang.harga_gram,
      });

      // 2. Fetch potongan kondisi
      const resPot = await fetch(
        "https://italy.goldstore.id/api/v1/parabeli/get/all",
        {
          headers: { "X-Auth-Token": TOKEN_PUSAT },
        }
      );
      if (!resPot.ok) throw new Error("Gagal mengambil data potongan kondisi");
      const potArr = await resPot.json();
      if (!Array.isArray(potArr) || potArr.length === 0) {
        setError("Data potongan kondisi tidak ditemukan.");
        return;
      }
      // Filter hanya yang aktif
      const aktif = potArr.filter((p: any) => p.status_aktif);
      // Helper untuk ambil nilai potongan (prioritas persentase)
      const getPotonganValue = (p: any) => (p.persentase && p.persentase > 0 ? p.persentase : p.potongan);
      // Cari potongan tertinggi (min price) dan terendah (max price)
      const hargaDasar = barang.berat * barang.harga_gram;
      // Hitung harga akhir untuk semua kondisi aktif
      const hargaAkhirList = aktif.map((kond) => {
        if (kond.persentase && kond.persentase > 0) {
          return hargaDasar - (hargaDasar * kond.persentase / 100);
        } else if (kond.potongan && kond.potongan > 0) {
          return hargaDasar - kond.potongan;
        } else {
          return hargaDasar; // fallback jika dua-duanya 0
        }
      });
      // Ambil harga minimum dan maksimum dari semua hasil
      const hargaMin = Math.min(...hargaAkhirList);
      const hargaMax = Math.max(...hargaAkhirList);
      setMinPrice(Math.round(hargaMin));
      setMaxPrice(Math.round(hargaMax));
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengambil data");
    }
  };

  const handleQuestionnaire = (answers: QuestionnaireAnswer[]) => {
    if (!item) return;

    let score = 100;
    answers.forEach((a) => {
      if (a.questionId === "q1" && a.answer === true) score -= 25;
      if (a.questionId === "q2" && a.answer === true) score -= 15;
      if (a.questionId === "q3" && a.answer === true) score -= 20;
      if (a.questionId === "q4" && a.answer === false) score -= 10;
      if (a.questionId === "q5") {
        const map: Record<string, number> = { "Sangat Baik": 0, "Baik": -5, "Cukup": -15, "Kurang": -30 };
        score += map[a.answer as string] || 0;
      }
    });
    score = Math.max(0, Math.min(100, score));

    // Gunakan minPrice/maxPrice dari hasil API (state), fallback ke 0 jika belum ada
    setResult({
      item,
      conditionScore: score,
      goldPricePerGram: 0, // Tidak dipakai di tampilan
      minPrice: minPrice ?? 0,
      maxPrice: maxPrice ?? 0,
      answers,
    });
    setStep(5);
  };

  const handleReset = () => {
    setStep(1);
    setBranch(null);
    setItem(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col lg:h-screen lg:flex-row">
        <aside
          className="relative hidden shrink-0 overflow-hidden lg:flex lg:w-2/5 xl:w-1/2 lg:sticky lg:top-0 lg:h-full"
          aria-hidden="true"
        >
          <img
            src="/background-portrait.jpg"
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-b from-[#f8f9ff] via-[#f2f6ff] to-[#e9f0ff] text-slate-800 lg:h-screen lg:min-h-0 lg:overflow-y-auto">
          {/* Header — only shown after branch selected */}
          {branch && (
            <header className="w-full border-b border-white/60 bg-white/70 backdrop-blur animate-in slide-in-from-top duration-300">
                <div className="mx-auto flex max-w-lg flex-col items-center gap-2 px-4 py-4 text-center">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <img
                      src="/icon-diamond.png"
                      alt="Ikon emas"
                      className="h-10 w-10 rounded-lg border border-white/60 object-cover shadow-md shadow-black/10"
                      loading="lazy"
                    />
                    <div className="flex flex-wrap items-center justify-center gap-2 text-lg font-semibold uppercase text-slate-900">
                      <span>TAKSIRAN HARGA JUAL EMAS</span>
                      {branch.name && (
                        <span className="whitespace-nowrap tracking-normal text-primary">
                          - {branch.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {branch.address && (
                    <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{branch.address}</span>
                    </div>
                  )}
              </div>
            </header>
          )}

          {/* Global Step Header */}
          {!branch && (
            <div className="mx-auto w-full max-w-lg px-4 pt-4">
              <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md shadow-black/10">
                  <img src="/icon-diamond.png" alt="Ikon emas" className="h-8 w-8 object-contain" />
                </div>
                <h2 className="text-lg font-semibold uppercase tracking-wide text-slate-900">
                  TAKSIRAN HARGA JUAL EMAS
                </h2>
              </div>
            </div>
          )}

          {/* Step Indicator + Back */}
          <div className="mx-auto w-full max-w-lg space-y-3 px-4 py-5">
            {step > 1 && step < 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-slate-600 hover:text-slate-800"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali
              </Button>
            )}
            <div className="rounded-3xl bg-white/85 p-4 shadow-lg shadow-indigo-100 ring-1 ring-white/70">
              <StepIndicator currentStep={step} totalSteps={5} labels={STEP_LABELS} />
            </div>
          </div>

          {/* Content */}
          <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-8">
            <div className="rounded-3xl bg-white/90 p-6 shadow-2xl shadow-indigo-100 ring-1 ring-white/70 backdrop-blur-sm">
              {step === 1 && <BranchScanner onBranchFound={handleBranchFound} />}
              {step === 2 && (
                <div className="space-y-4">
                  <BarcodeInput onSubmit={handleBarcode} />
                  {error && (
                    <p className="animate-in fade-in text-center text-sm text-destructive">{error}</p>
                  )}
                </div>
              )}
              {step === 3 && item && (
                <ItemDetails
                  item={item}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onNext={() => setStep(4)}
                />
              )}
              {step === 4 && <Questionnaire questions={QUESTIONNAIRE} onSubmit={handleQuestionnaire} />}
              {step === 5 && result && <AppraisalResultView result={result} onReset={handleReset} />}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-white/60 bg-[#eef2ff] py-4 backdrop-blur">
            <div className="mx-auto flex max-w-lg flex-col items-center gap-1 px-4 text-center text-xs text-slate-700">
              <span>© 2026 Nagatech Sistem Integrator</span>
              {branch?.phone && (
                <a href={`tel:${branch.phone}`} className="transition-colors hover:text-primary">
                  {branch.phone}
                </a>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Index;
