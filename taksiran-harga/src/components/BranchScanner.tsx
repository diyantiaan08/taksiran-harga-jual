import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, ArrowRight } from "lucide-react";
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
    if (branch) onBranchFound(branch);
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
    onBranchFound(branch);
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="w-full space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center">
            <QrCode className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Identifikasi Cabang</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Scan QR Code pada nota, pilih cabang, atau masukkan kode manual
        </p>
      </div>

      {/* Dropdown */}
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Pilih cabang:</p>
          <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setError(""); }}>
            <SelectTrigger className="h-14 border-border bg-surface-elevated text-sm">
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
            <div className="text-xs text-muted-foreground py-2">Memuat data cabang...</div>
          )}
          {!loading && branches.length === 0 && (
            <div className="text-xs text-destructive py-2">Tidak ada data cabang</div>
          )}
          <Button
            variant="gold"
            size="lg"
            className="w-full h-12 rounded-xl"
            disabled={!selectedId || loading || branches.length === 0}
            onClick={handleDropdown}
          >
            Lanjutkan
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">atau masukkan kode manual</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleManual} className="space-y-4">
          <Input
            value={manualCode}
            onChange={(e) => { setManualCode(e.target.value); setError(""); }}
            placeholder="Contoh: cabang-1"
            className="h-14 text-center text-lg font-mono tracking-widest border-border bg-surface-elevated focus:border-primary"
          />
          <Button
            type="submit"
            variant="goldSoft"
            size="lg"
            className="w-full h-12 rounded-xl"
            disabled={!manualCode.trim()}
          >
            Cari Cabang
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {error && (
          <p className="text-center text-sm text-destructive animate-in fade-in">{error}</p>
        )}
      </div>
    </div>
  );
};

export default BranchScanner;
