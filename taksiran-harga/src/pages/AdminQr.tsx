import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { encryptQrPayload } from "@/lib/qr";
import type { BranchInfo } from "@/types/appraisal";
import QRCode from "qrcode";

const STORAGE_KEY = "qr_admin_token";

const AdminQr = () => {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  const qrSecret = import.meta.env.VITE_QR_SECRET as string | undefined;
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [qrLink, setQrLink] = useState("");
  const [qrPng, setQrPng] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedId) || null,
    [branches, selectedId]
  );

  useEffect(() => {
    setBaseUrl(window.location.origin);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setToken(saved);
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("unauthorized");
        const data = await res.json();
        setUserId(data.user_id || "");
        setAuthError("");
      } catch {
        setToken(null);
        localStorage.removeItem(STORAGE_KEY);
        setAuthError("Sesi admin sudah habis. Silakan login lagi.");
      }
    };
    verify();
  }, [token]);

  useEffect(() => {
    const loadBranches = async () => {
      if (!token) return;
      const res = await fetch(`${apiBaseUrl}/stores`);
      const data = await res.json();
      const list = Array.isArray(data.stores)
        ? data.stores.map((s: any) => ({
            id: s.kode_toko,
            name: s.kode_toko,
            address: s.alamat || "",
            phone: s.telepon || "",
            domain: s.domain,
            qr_link: s.qr_link,
          }))
        : [];
      setBranches(list);
    };
    loadBranches();
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, password }),
      });
      if (!res.ok) throw new Error("Login gagal");
      const data = await res.json();
      localStorage.setItem(STORAGE_KEY, data.token);
      setToken(data.token);
      setPassword("");
    } catch {
      setAuthError("Login gagal. Periksa user_id dan password.");
    }
  };

  const handleGenerate = async () => {
    if (!selectedBranch) {
      setAuthError("Pilih cabang terlebih dulu.");
      return;
    }
    if (!qrSecret) {
      setAuthError("VITE_QR_SECRET belum di-set.");
      return;
    }
    setIsGenerating(true);
    setSaveStatus("");
    try {
      const token = await encryptQrPayload(
        { kode_toko: selectedBranch.id, domain: selectedBranch.domain },
        qrSecret
      );
      const url = new URL(baseUrl);
      url.searchParams.set("qr", token);
      const link = url.toString();
      const png = await QRCode.toDataURL(link, { margin: 1, width: 512 });
      setQrLink(link);
      setQrPng(png);
      const res = await fetch(`${apiBaseUrl}/stores/qr`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kode_toko: selectedBranch.id, qr_link: link }),
      });
      if (res.ok) {
        setSaveStatus("QR tersimpan di database.");
        setBranches((prev) =>
          prev.map((b) => (b.id === selectedBranch.id ? { ...b, qr_link: link } : b))
        );
      } else {
        setSaveStatus("QR berhasil dibuat, tapi gagal disimpan.");
      }
    } catch {
      setAuthError("Gagal generate QR.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!qrLink) return;
    await navigator.clipboard.writeText(qrLink);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">Masuk untuk generate QR cabang</p>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user id"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] py-10 px-4">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="rounded-3xl bg-white/90 p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Generator QR Cabang</h1>
              <p className="text-sm text-muted-foreground">
                Login sebagai <span className="font-medium">{userId}</span>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setToken(null);
                setQrLink("");
                setQrPng("");
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="rounded-3xl bg-white/90 p-6 shadow-xl space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Base URL Aplikasi</label>
              <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Pilih Cabang</label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Pilih cabang..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectedBranch && (
            <div className="text-xs text-muted-foreground">
              Domain cabang: <span className="font-medium">{selectedBranch.domain}</span>
            </div>
          )}
          {selectedBranch?.qr_link && (
            <div className="text-xs text-muted-foreground break-all">
              QR tersimpan: <span className="font-medium">{selectedBranch.qr_link}</span>
            </div>
          )}
          {authError && <p className="text-sm text-destructive">{authError}</p>}
          {saveStatus && <p className="text-sm text-emerald-600">{saveStatus}</p>}
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate QR"}
          </Button>
        </div>

        {qrLink && (
          <div className="rounded-3xl bg-white/90 p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Hasil QR</h2>
              <p className="text-sm text-muted-foreground break-all">{qrLink}</p>
            </div>
            {qrPng && (
              <div className="flex flex-col items-center gap-4">
                <img src={qrPng} alt="QR Cabang" className="w-56 h-56" />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCopy}>
                    Copy Link
                  </Button>
                  <a href={qrPng} download={`qr-${selectedId}.png`}>
                    <Button>Download PNG</Button>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQr;
