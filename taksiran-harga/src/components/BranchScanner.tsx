import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, ArrowRight, Store } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { decryptQrPayload, encryptQrPayload } from "@/lib/qr";
import type { BranchInfo } from "@/types/appraisal";


interface BranchScannerProps {
  onBranchFound: (branch: BranchInfo) => void;
}

const BranchScanner = ({ onBranchFound }: BranchScannerProps) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  const qrSecret = import.meta.env.VITE_QR_SECRET as string | undefined;
  const [selectedId, setSelectedId] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [isProceedingSelect, setIsProceedingSelect] = useState(false);
  const [isProceedingManual, setIsProceedingManual] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const [hasAutoQrProcessed, setHasAutoQrProcessed] = useState(false);
  const [lastDecoded, setLastDecoded] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isDecodingImage, setIsDecodingImage] = useState(false);

  const normalizeCode = (value: string) =>
    value
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();

  const fetchBranchesData = async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/stores`);
      if (!res.ok) {
        throw new Error(`Gagal ambil cabang (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data.stores)
        ? data.stores.map((s: any) => ({
            id: s.kode_toko,
            name: s.kode_toko,
            address: s.alamat || "",
            phone: s.telepon || "",
            domain: s.domain,
          }))
        : [];
      setBranchesError(list.length === 0 ? "Data cabang kosong." : "");
      return list as BranchInfo[];
    } catch {
      setBranchesError("Gagal mengambil data cabang.");
      return [] as BranchInfo[];
    }
  };

  const getReader = () => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints, 300);
  };

  const refreshBranches = async () => {
      setLoading(true);
      try {
        const list = await fetchBranchesData();
        setBranches(list);
      } catch (e) {
        setBranches([]);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    refreshBranches();
  }, [apiBaseUrl]);

  const getQrTokenFromText = (text: string) => {
    try {
      const url = new URL(text);
      return url.searchParams.get("qr");
    } catch {
      return text.includes("qr=") ? new URLSearchParams(text.split("?")[1] ?? "").get("qr") : null;
    }
  };

  const resolveBranchByCode = async (code: string) => {
    const kodeToko = normalizeCode(code);
    let list = branches;
    if (list.length === 0) {
      list = await fetchBranchesData();
      if (list.length) setBranches(list);
    }
    return list.find((b) => normalizeCode(b.id) === kodeToko) || null;
  };

  const resolveFromShortUrl = async (url: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/qr/resolve?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.finalUrl) {
        const token = getQrTokenFromText(data.finalUrl);
        if (token) return { token };
      }
      if (data?.extracted) return { text: data.extracted as string };
      return null;
    } catch {
      return null;
    }
  };

  const handlePlainCode = async (code: string) => {
    const kodeToko = normalizeCode(code);
    if (!kodeToko) {
      setError("Kode cabang kosong.");
      return;
    }
    const branch = await resolveBranchByCode(kodeToko);
    if (!branch) {
      setError(`Cabang tidak ditemukan dari QR. (Kode: ${kodeToko})`);
      return;
    }
    if (qrSecret) {
      const token = await encryptQrPayload({ kode_toko: branch.id, domain: branch.domain }, qrSecret);
      const url = new URL(window.location.href);
      url.searchParams.set("qr", token);
      window.history.replaceState({}, "", url.toString());
    }
    onBranchFound(branch);
  };

  const handleQrToken = async (token: string) => {
    if (!qrSecret) {
      setError("QR secret belum di-set (VITE_QR_SECRET)");
      return;
    }
    try {
      const payload = await decryptQrPayload(token, qrSecret);
      const kodeToko = normalizeCode(String(payload.kode_toko || ""));
      if (!kodeToko) throw new Error("QR tidak valid");
      const branch = await resolveBranchByCode(kodeToko);
      if (!branch) {
        setError(`Cabang tidak ditemukan dari QR. (Kode: ${kodeToko})`);
        return;
      }
      onBranchFound(branch);
    } catch (e) {
      setError("QR tidak valid atau tidak bisa dibaca.");
    }
  };

  useEffect(() => {
    if (loading || hasAutoQrProcessed) return;
    const qrParam = new URLSearchParams(window.location.search).get("qr");
    if (!qrParam) return;
    setHasAutoQrProcessed(true);
    handleQrToken(qrParam);
  }, [loading, hasAutoQrProcessed, branches]);

  useEffect(() => {
    if (!isScannerOpen) return;
    if (!videoRef.current) return;
    setScanError("");
    const reader = getReader();
    readerRef.current = reader;
    let stopped = false;
    try {
      reader.decodeFromVideoDevice(undefined, videoRef.current, async (result) => {
        if (!result || stopped) return;
        const text = result.getText();
        setLastDecoded(text);
        const token = getQrTokenFromText(text);
        if (!token && !text) {
          setScanError("QR tidak terbaca. Coba lagi.");
          return;
        }
        stopped = true;
        try {
          reader.reset();
        } catch {}
        setIsScannerOpen(false);
        if (token) {
          await handleQrToken(token);
        } else {
          try {
            const url = new URL(text);
            const resolved = await resolveFromShortUrl(url.toString());
            if (resolved?.token) {
              await handleQrToken(resolved.token);
            } else if (resolved?.text) {
              await handlePlainCode(resolved.text);
            } else {
              await handlePlainCode(text);
            }
          } catch {
            await handlePlainCode(text);
          }
        }
      });
    } catch (e) {
      setScanError("Tidak bisa mengakses kamera. Periksa izin kamera.");
    }
    return () => {
      stopped = true;
      try {
        reader.reset();
      } catch {}
      readerRef.current = null;
    };
  }, [isScannerOpen, qrSecret, branches]);

  const preprocessImage = async (file: File, scale: number, threshold = 160) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(file);
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(img.width * scale);
    canvas.height = Math.floor(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas tidak tersedia");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const v = gray > threshold ? 255 : 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const handleImageFile = async (file: File) => {
    if (!file) return;
    setScanError("");
    setIsDecodingImage(true);
    try {
      const reader = getReader();
      let resultText: string | null = null;
      try {
        const url = URL.createObjectURL(file);
        const result = await reader.decodeFromImageUrl(url);
        resultText = result.getText();
        URL.revokeObjectURL(url);
      } catch {}

      if (!resultText) {
        const attempts = [
          { scale: 2, threshold: 150 },
          { scale: 3, threshold: 150 },
          { scale: 2, threshold: 180 },
          { scale: 3, threshold: 180 },
        ];
        for (const attempt of attempts) {
          try {
            const dataUrl = await preprocessImage(file, attempt.scale, attempt.threshold);
            const result = await reader.decodeFromImageUrl(dataUrl);
            resultText = result.getText();
            if (resultText) break;
          } catch {}
        }
      }

      if (!resultText) throw new Error("no-result");

      setLastDecoded(resultText);
      const token = getQrTokenFromText(resultText);
      if (token) {
        await handleQrToken(token);
      } else {
        try {
          const url = new URL(resultText);
          const resolved = await resolveFromShortUrl(url.toString());
          if (resolved?.token) {
            await handleQrToken(resolved.token);
          } else if (resolved?.text) {
            await handlePlainCode(resolved.text);
          } else {
            await handlePlainCode(resultText);
          }
        } catch {
          await handlePlainCode(resultText);
        }
      }
      setIsScannerOpen(false);
    } catch (e) {
      setScanError("QR dari gambar tidak terbaca. Coba gambar lain.");
    } finally {
      setIsDecodingImage(false);
    }
  };

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
          Silakan pilih cabang, scan QR, <span className="font-medium text-slate-700">atau</span> masukkan kode manual.
        </p>
        <div className="rounded-3xl border border-slate-200/70 bg-white/90 shadow-[0_30px_70px_-60px_rgba(15,23,42,0.6)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <QrCode className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Scan QR Code</h3>
          </div>
          <div className="h-px bg-slate-100" />
          <div className="px-5 py-5 space-y-4">
            <p className="text-sm text-slate-500">Scan QR dari nota atau kartu cabang</p>
            <Button
              variant="goldSoft"
              size="lg"
              className="w-full h-12 rounded-2xl"
              onClick={() => setIsScannerOpen(true)}
            >
              Buka Kamera
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            {scanError && <p className="text-xs text-destructive">{scanError}</p>}
          </div>
        </div>
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
            {branchesError && (
              <div className="text-xs text-destructive">{branchesError}</div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={refreshBranches}
              disabled={loading}
            >
              Muat Ulang Data Cabang
            </Button>
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
          <p className="text-center text-sm text-destructive animate-in fade-in">
            {error}
            {lastDecoded && (
              <span className="block text-xs text-slate-500 mt-1">Decoded: {normalizeCode(lastDecoded)}</span>
            )}
          </p>
        )}
      </div>

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-slate-900">Scan QR Cabang</span>
              </div>
              <button
                className="text-sm text-slate-500 hover:text-slate-700"
                onClick={() => {
                  try {
                    readerRef.current?.reset();
                  } catch {}
                  setIsScannerOpen(false);
                }}
              >
                Tutup
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="overflow-hidden rounded-2xl bg-slate-900">
                <video ref={videoRef} className="w-full" />
              </div>
              <div className="flex items-center justify-center">
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                      e.currentTarget.value = "";
                    }}
                  />
                  {isDecodingImage ? "Memproses gambar..." : "Scan dari Galeri"}
                </label>
              </div>
              <p className="text-xs text-slate-500 text-center">
                Arahkan kamera ke QR. Pastikan pencahayaan cukup.
              </p>
              {scanError && <p className="text-xs text-destructive text-center">{scanError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchScanner;
