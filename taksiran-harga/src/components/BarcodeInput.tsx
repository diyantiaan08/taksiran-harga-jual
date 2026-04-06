import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanBarcode, ArrowRight, QrCode } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

interface BarcodeInputProps {
  onSubmit: (barcode: string) => void;
  loading?: boolean;
}

const BarcodeInput = ({ onSubmit, loading }: BarcodeInputProps) => {
  const [barcode, setBarcode] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const [isDecodingImage, setIsDecodingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const getReader = () => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.CODE_128,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) onSubmit(barcode.trim().toUpperCase());
  };

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
      setBarcode(resultText.trim().toUpperCase());
      setIsScannerOpen(false);
    } catch (e) {
      setScanError("QR/barcode dari gambar tidak terbaca. Coba gambar lain.");
    } finally {
      setIsDecodingImage(false);
    }
  };

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
        if (!text) {
          setScanError("QR/barcode tidak terbaca. Coba lagi.");
          return;
        }
        stopped = true;
        try {
          reader.reset();
        } catch {}
        setIsScannerOpen(false);
        setBarcode(text.trim().toUpperCase());
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
  }, [isScannerOpen]);

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
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode className="w-4 h-4" />
            Scan QR/Barcode
          </Button>
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

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-slate-900">Scan Barcode Nota</span>
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
                Arahkan kamera ke QR atau barcode. Pastikan pencahayaan cukup.
              </p>
              {scanError && <p className="text-xs text-destructive text-center">{scanError}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeInput;
