import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanBarcode, ArrowRight } from "lucide-react";

interface BarcodeInputProps {
  onSubmit: (barcode: string) => void;
  loading?: boolean;
}

const BarcodeInput = ({ onSubmit, loading }: BarcodeInputProps) => {
  const [barcode, setBarcode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) onSubmit(barcode.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-full sm:max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="w-full space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-[0_8px_20px_-12px_rgba(217,119,6,0.8)]">
            <ScanBarcode className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Input Barcode Nota</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Masukkan kode barcode yang tertera pada nota pembelian Anda
        </p>
      </div>

      <div className="w-full rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.6)] overflow-hidden">
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          <p className="text-sm text-slate-500">
            Kode barcode terdapat pada nota pembelian Anda
          </p>
          <Input
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Contoh: GLD-001"
            className="h-12 rounded-2xl text-center text-base font-mono tracking-widest border-slate-200 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-amber-200"
          />
          <Button
            type="submit"
            variant="goldSoft"
            size="lg"
            className="w-full h-12 rounded-2xl"
            disabled={!barcode.trim() || loading}
          >
            {loading ? (
              <>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-600" />
                  Memproses
                </span>
              </>
            ) : (
              <>
                Lanjutkan
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default BarcodeInput;
