import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Weight, Gem, Hash, Wallet, Package } from "lucide-react";
import type { GoldItem } from "@/types/appraisal";

interface ItemDetailsProps {
  item: GoldItem;
  minPrice?: number | null;
  maxPrice?: number | null;
  onNext: () => void;
}

const ItemDetails = ({ item, minPrice: _minPrice, maxPrice: _maxPrice, onNext }: ItemDetailsProps) => {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const details = [
    { icon: Hash, label: "Kode Barcode", value: item.barcode },
    { icon: Gem, label: "Nama Barang", value: item.nama_barang },
    { icon: Weight, label: "Berat", value: `${item.berat} gram` },
    { icon: Wallet, label: "Harga Beli Customer", value: item.harga_jual ? `Rp ${item.harga_jual.toLocaleString()}` : "-" },
  ];
  const cardTones = [
    "from-amber-50/80 via-white to-white border-amber-100/80",
    "from-sky-50/80 via-white to-white border-sky-100/80",
    "from-rose-50/80 via-white to-white border-rose-100/80",
    "from-emerald-50/80 via-white to-white border-emerald-100/80",
  ];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-[0_8px_18px_-12px_rgba(217,119,6,0.7)]">
            <Package className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-bold text-foreground">Detail Barang</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Ringkasan data barang yang akan ditaksir
        </p>
      </div>

      <div className="w-full rounded-3xl border border-slate-100 bg-gradient-to-br from-white via-white to-amber-50/60 p-4 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.6)] space-y-3">
        {details.map(({ icon: Icon, label, value }, idx) => (
          <div
            key={label}
            className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-br p-4 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)] ${cardTones[idx % cardTones.length]}`}
          >
            <div className="w-11 h-11 rounded-2xl bg-white/90 ring-1 ring-black/5 shadow-sm flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="gold"
        size="lg"
        className="w-full h-12 rounded-2xl"
        onClick={() => {
          setIsAdvancing(true);
          setTimeout(() => onNext(), 250);
        }}
        disabled={isAdvancing}
      >
        {isAdvancing ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
  );
};

export default ItemDetails;
