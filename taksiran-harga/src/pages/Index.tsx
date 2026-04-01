import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Phone, ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — only shown after branch selected */}
      {branch && (
        <header className="w-full border-b border-border bg-surface-elevated animate-in slide-in-from-top duration-300">
          <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
              {branch.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-foreground truncate">{branch.name}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {branch.address}
                </span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Step Indicator + Back */}
      <div className="max-w-lg mx-auto w-full px-4 py-5 space-y-3">
        {step > 1 && step < 5 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => setStep(step - 1)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Button>
        )}
        <StepIndicator currentStep={step} totalSteps={5} labels={STEP_LABELS} />
      </div>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-8">
        {step === 1 && <BranchScanner onBranchFound={handleBranchFound} />}
        {step === 2 && (
          <div className="space-y-4">
            <BarcodeInput onSubmit={handleBarcode} />
            {error && (
              <p className="text-center text-sm text-destructive animate-in fade-in">{error}</p>
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
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Nagatech Sistem Integrator</span>
          {branch && (
            <a href={`tel:${branch.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="w-3 h-3" />
              {branch.phone}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Index;
