import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, TrendingUp, TrendingDown, Coins, BarChart3 } from "lucide-react";
import type { AppraisalResult as AppraisalResultType } from "@/types/appraisal";

interface AppraisalResultProps {
  result: AppraisalResultType;
  onReset: () => void;
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

const AppraisalResult = ({ result, onReset }: AppraisalResultProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const conditionLabel =
    result.conditionScore >= 80
      ? "Sangat Baik"
      : result.conditionScore >= 60
      ? "Baik"
      : result.conditionScore >= 40
      ? "Cukup"
      : "Kurang";

  useEffect(() => {
    setAnimatedScore(0);
    const duration = 900;
    const start = performance.now();
    let frameId: number;

    const animate = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(result.conditionScore * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [result.conditionScore]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-[0_8px_18px_-12px_rgba(217,119,6,0.7)]">
            <BarChart3 className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-bold text-foreground">Taksiran Harga</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {result.item.nama_barang} • {result.item.berat}g
        </p>
      </div>

      {/* Condition Score */}
      <div className="w-full rounded-3xl border border-amber-100/80 bg-gradient-to-br from-amber-50/80 via-white to-white p-5 text-center shadow-[0_22px_50px_-38px_rgba(15,23,42,0.5)] space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Skor Kondisi</p>
        <div className="relative w-24 h-24 mx-auto">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(animatedScore / 100) * 264} 264`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{animatedScore}</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-amber-700">{conditionLabel}</p>
      </div>

      {/* Price Range */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-4 rounded-2xl border border-sky-100/80 bg-gradient-to-br from-sky-50/80 via-white to-white p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
          <div className="w-11 h-11 rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-sm flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Harga Minimum</p>
            <p className="font-bold text-foreground">{formatRupiah(result.minPrice)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-[#f7c463] via-[#f4b34f] to-[#e9a93a] p-4 shadow-[0_20px_44px_-26px_rgba(217,119,6,0.6)]">
          <div className="w-11 h-11 rounded-2xl bg-white/25 ring-1 ring-white/40 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-white/70">Harga Maksimum</p>
            <p className="font-bold text-white text-lg">{formatRupiah(result.maxPrice)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/80 via-white to-white p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
          <div className="w-11 h-11 rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-sm flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Harga Beli Customer/gr</p>
            <p className="font-semibold text-foreground">
              {typeof result.item.harga_gram === "number"
                ? formatRupiah(result.item.harga_gram)
                : formatRupiah(result.goldPricePerGram)}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full rounded-2xl border border-amber-100/70 bg-amber-50/70 p-4 text-center text-xs text-amber-900/80 leading-relaxed">
        * Taksiran ini bersifat estimasi. Harga final ditentukan setelah verifikasi langsung di toko.
      </div>

      <Button
        variant="goldSoft"
        size="lg"
        className="w-full h-12 rounded-2xl"
        onClick={onReset}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Taksiran Baru
      </Button>
    </div>
  );
};

export default AppraisalResult;
