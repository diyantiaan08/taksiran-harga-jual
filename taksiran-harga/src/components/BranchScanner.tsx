import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, ArrowRight, Store } from "lucide-react";
import type { BranchInfo } from "@/types/appraisal";


interface BranchScannerProps {
  onBranchFound: (branch: BranchInfo) => void;
}

const BranchScanner = ({ onBranchFound }: BranchScannerProps) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  const [selectedId, setSelectedId] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProceedingSelect, setIsProceedingSelect] = useState(false);
  const [isProceedingManual, setIsProceedingManual] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        // Gunakan host dari environment agar bisa diakses lintas perangkat
        const res = await fetch(`${apiBaseUrl}/stores`);
        const data = await res.json();
        setBranches(
          Array.isArray(data.stores)
            ? data.stores.map((s: any) => ({
                id: s.kode_toko,
                name: s.kode_toko,
                address: s.alamat || "",
                phone: s.telepon || "",
                domain: s.domain,
              }))
            : []
        );
      } catch (e) {
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const handleDropdown = () => {
    const branch = branches.find((b) => b.id === selectedId);
    if (!branch) return;
    setIsProceedingSelect(true);
    setTimeout(() => onBranchFound(branch), 250);
  };

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim().toUpperCase();
    const branch = branches.find((b) => b.id === trimmed);
    if (!branch) {
      setError("Kode cabang tidak ditemukan. Silakan coba lagi.");
      return;
    }
    setError("");
    setIsProceedingManual(true);
    setTimeout(() => onBranchFound(branch), 250);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="w-full space-y-5">
        <p className="text-center text-sm text-muted-foreground">
          Silakan pilih cabang <span className="font-medium text-slate-700">atau</span> masukkan kode manual.
        </p>
        <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.6)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Store className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Pilih Cabang</h3>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="px-5 py-5 space-y-4">
            <p className="text-sm text-slate-500">Pilih cabang toko emas Anda</p>
            <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setError(""); }}>
              <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white text-sm shadow-sm focus:ring-2 focus:ring-amber-200">
                <SelectValue placeholder="Pilih cabang toko..." />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="font-medium">{b.name}</span>
                    {b.address && (
                      <span className="text-muted-foreground ml-2 text-xs">— {b.address}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loading && (
              <div className="text-xs text-muted-foreground">Memuat data cabang...</div>
            )}
            {!loading && branches.length === 0 && (
              <div className="text-xs text-destructive">Tidak ada data cabang</div>
            )}
          <Button
            variant="goldSoft"
            size="lg"
            className="w-full h-12 rounded-2xl"
            disabled={!selectedId || loading || branches.length === 0 || isProceedingSelect}
            onClick={handleDropdown}
          >
            {isProceedingSelect ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-600" />
                Memuat
              </span>
            ) : (
              <>
                Lanjutkan
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.6)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Masukkan Kode Manual</h3>
          </div>
          <div className="h-px bg-slate-100" />
          <form onSubmit={handleManual} className="px-5 py-5 space-y-4">
            <p className="text-sm text-slate-500">Kode cabang ada pada nota atau kartu cabang</p>
            <Input
              value={manualCode}
              onChange={(e) => { setManualCode(e.target.value); setError(""); }}
              placeholder="Contoh: CABANG-1"
              className="h-12 rounded-2xl text-center text-base font-mono tracking-widest border-slate-200 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-amber-200"
            />
            <Button
              type="submit"
              variant="goldSoft"
              size="lg"
              className="w-full h-12 rounded-2xl"
              disabled={!manualCode.trim() || isProceedingManual}
            >
              {isProceedingManual ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-600" />
                  Memuat
                </span>
              ) : (
                <>
                  Cari Cabang
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </form>
        </div>

        {error && (
          <p className="text-center text-sm text-destructive animate-in fade-in">{error}</p>
        )}
      </div>
    </div>
  );
};

export default BranchScanner;
