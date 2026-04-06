import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { encryptQrPayload } from "@/lib/qr";
import type { BranchInfo } from "@/types/appraisal";
import QRCode from "qrcode";
import { toast } from "@/components/ui/sonner";
import { PlusCircle, Search, ShieldCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STORAGE_KEY = "qr_admin_token";

const AdminQr = () => {
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
  const qrSecret = import.meta.env.VITE_QR_SECRET as string | undefined;
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [baseUrl, setBaseUrl] = useState("");
  const [qrLink, setQrLink] = useState("");
  const [qrPng, setQrPng] = useState("");
  const [qrFileName, setQrFileName] = useState("qr.png");
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [createKode, setCreateKode] = useState("");
  const [createDomain, setCreateDomain] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKode, setEditKode] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setAuthToken(saved);
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (!authToken) return;
      try {
        const res = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error("unauthorized");
        const data = await res.json();
        setUserId(data.user_id || "");
        setAuthError("");
      } catch {
        setAuthToken(null);
        localStorage.removeItem(STORAGE_KEY);
        setAuthError("Sesi admin sudah habis. Silakan login lagi.");
      }
    };
    verify();
  }, [authToken]);

  useEffect(() => {
    if (authToken) loadBranches();
  }, [authToken]);

  const loadBranches = async () => {
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

  const filteredBranches = branches.filter((b) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      (b.domain || "").toLowerCase().includes(q)
    );
  });

  const normalizeDomain = (value: string) =>
    value.endsWith("/") ? value.slice(0, -1) : value;

  const createStore = async () => {
    if (!createKode.trim() || !createDomain.trim()) {
      toast.error("Kode toko dan domain wajib diisi.");
      return;
    }
    setActionLoading("create");
    try {
      const res = await fetch(`${apiBaseUrl}/stores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          kode_toko: createKode.trim(),
          domain: normalizeDomain(createDomain.trim()),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal menambah cabang");
      }
      toast.success("Cabang berhasil ditambahkan.");
      setCreateKode("");
      setCreateDomain("");
      await loadBranches();
    } catch (e: any) {
      toast.error(e.message || "Gagal menambah cabang.");
    } finally {
      setActionLoading("");
    }
  };

  const startEdit = (b: BranchInfo) => {
    setEditingId(b.id);
    setEditKode(b.id);
    setEditDomain(b.domain || "");
  };

  const saveEdit = async (originalId: string) => {
    if (!editKode.trim() || !editDomain.trim()) {
      toast.error("Kode toko dan domain wajib diisi.");
      return;
    }
    setActionLoading(`edit-${originalId}`);
    try {
      const res = await fetch(`${apiBaseUrl}/stores`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          kode_toko: originalId,
          new_kode_toko: editKode.trim(),
          domain: normalizeDomain(editDomain.trim()),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal update cabang");
      }
      toast.success("Cabang berhasil diupdate.");
      setEditingId(null);
      await loadBranches();
    } catch (e: any) {
      toast.error(e.message || "Gagal update cabang.");
    } finally {
      setActionLoading("");
    }
  };

  const deleteStore = async (id: string) => {
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetch(`${apiBaseUrl}/stores/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Gagal hapus cabang");
      }
      toast.success("Cabang berhasil dihapus.");
      await loadBranches();
    } catch (e: any) {
      toast.error(e.message || "Gagal hapus cabang.");
    } finally {
      setActionLoading("");
    }
  };

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
      setAuthToken(data.token);
      setPassword("");
    } catch {
      setAuthError("Login gagal. Periksa user id dan password.");
    }
  };

  const handleGenerate = async (branch: BranchInfo) => {
    if (!qrSecret) {
      setAuthError("VITE_QR_SECRET belum di-set.");
      return;
    }
    setIsGenerating(true);
    setSaveStatus("");
    try {
      const qrToken = await encryptQrPayload(
        { kode_toko: branch.id, domain: branch.domain },
        qrSecret
      );
      const url = new URL(baseUrl);
      url.searchParams.set("qr", qrToken);
      const link = url.toString();
      const png = await QRCode.toDataURL(link, { margin: 1, width: 512 });
      setQrLink(link);
      setQrPng(png);
      setQrFileName(`qr-${branch.id}.png`);
      setIsQrOpen(true);
      const res = await fetch(`${apiBaseUrl}/stores/qr`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ kode_toko: branch.id, qr_link: link }),
      });
      if (res.ok) {
        setSaveStatus("QR tersimpan di database.");
        setBranches((prev) =>
          prev.map((b) => (b.id === branch.id ? { ...b, qr_link: link } : b))
        );
        toast.success("QR berhasil dibuat dan disimpan.");
      } else {
        setSaveStatus("QR berhasil dibuat, tapi gagal disimpan.");
        toast.error("QR dibuat, tapi gagal disimpan.");
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

  if (!authToken) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f7f0e8] via-[#f4f6fb] to-[#eaf1ff] flex items-center justify-center px-4">
        <div className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-80px] right-[-60px] h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="pointer-events-none absolute top-24 right-16 h-28 w-28 rounded-3xl bg-white/50 blur-xl" />

        <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white/80 p-7 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Masuk untuk kelola cabang & QR
              </p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user id"
              className="h-11 rounded-xl"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="h-11 rounded-xl"
            />
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <Button type="submit" className="w-full h-11 rounded-xl">
              Login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#f7f0e8] via-[#f4f6fb] to-[#eaf1ff] py-10 px-4 sm:px-6 lg:px-12">
      <div className="pointer-events-none absolute -top-28 left-10 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-[-120px] h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] left-1/3 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />

      <div className="mx-auto w-full max-w-7xl space-y-6 relative">
        <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.1)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Generator QR Cabang</h1>
              <p className="text-sm text-muted-foreground">
                Login sebagai <span className="font-medium">{userId}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
              Admin Aktif
            </div>
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setAuthToken(null);
                setQrLink("");
                setQrPng("");
              }}
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              onClick={() => setShowAddForm((v) => !v)}
              title="Tambah Data Cabang"
            >
              <PlusCircle className="h-5 w-5 text-amber-600" />
              <span className="hidden sm:inline">Tambah Data Cabang</span>
            </button>
          </div>
          {showAddForm && (
            <div className="space-y-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/70 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Base URL Aplikasi</label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nama Toko</label>
                  <Input
                    value={createKode}
                    onChange={(e) => setCreateKode(e.target.value.toUpperCase())}
                    placeholder="Nama Toko"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Domain</label>
                  <Input
                    value={createDomain}
                    onChange={(e) => setCreateDomain(e.target.value)}
                    placeholder="https://domain-toko.com"
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
              <Button onClick={createStore} disabled={actionLoading === "create"} className="h-11 rounded-xl">
                {actionLoading === "create" ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Daftar Cabang</h2>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama toko atau domain..."
                className="h-10 rounded-full pl-9"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                  <th className="py-3 px-3">Nama Toko</th>
                  <th className="py-3 px-3">Domain</th>
                  <th className="py-3 px-3">QR Link</th>
                  <th className="py-3 px-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((b) => (
                  <tr key={b.id} className="border-t hover:bg-amber-50/40">
                    <td className="py-3 px-3">
                      {editingId === b.id ? (
                        <Input
                          value={editKode}
                          onChange={(e) => setEditKode(e.target.value.toUpperCase())}
                          className="h-9"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">{b.id}</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {editingId === b.id ? (
                        <Input value={editDomain} onChange={(e) => setEditDomain(e.target.value)} className="h-9" />
                      ) : (
                        <span className="text-slate-700">{b.domain}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 max-w-[260px] break-all text-xs text-slate-500">
                      {b.qr_link || "-"}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-2">
                        {editingId === b.id ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => saveEdit(b.id)}
                              disabled={actionLoading === `edit-${b.id}`}
                            >
                              Simpan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Batal
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(b)}
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  Hapus
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Cabang?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Data cabang akan dihapus permanen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteStore(b.id)}>
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              size="sm"
                              onClick={() => handleGenerate(b)}
                              disabled={isGenerating}
                            >
                              Generate QR
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBranches.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Tidak ada data yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {authError && <p className="text-sm text-destructive mt-3">{authError}</p>}
          {saveStatus && <p className="text-sm text-emerald-600 mt-2">{saveStatus}</p>}
        </div>

        {isQrOpen && (
          <AlertDialog open={isQrOpen} onOpenChange={setIsQrOpen}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>Hasil QR</AlertDialogTitle>
                <AlertDialogDescription>
                  {qrLink && <span className="break-all">{qrLink}</span>}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {qrPng && (
                <div className="flex flex-col items-center gap-4">
                  <img src={qrPng} alt="QR Cabang" className="w-56 h-56" />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCopy}>
                      Copy Link
                    </Button>
                    <a href={qrPng} download={qrFileName}>
                      <Button>Download PNG</Button>
                    </a>
                  </div>
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Tutup</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default AdminQr;
