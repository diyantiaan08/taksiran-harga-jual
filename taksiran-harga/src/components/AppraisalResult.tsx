import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, TrendingUp, TrendingDown, Coins } from "lucide-react";
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
        <h2 className="text-xl font-bold text-foreground">Taksiran Harga</h2>
        <p className="text-sm text-muted-foreground">{result.item.description}</p>
      </div>

      {/* Condition Score */}
      <div className="w-full p-5 rounded-2xl surface-elevated text-center space-y-3">
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
        <p className="text-sm font-semibold gold-text">{conditionLabel}</p>
      </div>

      {/* Price Range */}
      <div className="w-full space-y-3">
        <div className="flex items-center gap-4 p-4 rounded-xl surface-elevated">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Harga Minimum</p>
            <p className="font-bold text-foreground">{formatRupiah(result.minPrice)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl gold-gradient">
          <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-primary-foreground/70">Harga Maksimum</p>
            <p className="font-bold text-primary-foreground text-lg">{formatRupiah(result.maxPrice)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl surface-elevated">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-primary" />
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

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        * Taksiran ini bersifat estimasi. Harga final ditentukan setelah verifikasi langsung di toko.
      </p>

      <Button
        variant="outline"
        size="lg"
        className="w-full h-12 rounded-xl"
        onClick={onReset}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Taksiran Baru
      </Button>
    </div>
  );
};

export default AppraisalResult;
