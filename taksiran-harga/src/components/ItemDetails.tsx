import { Button } from "@/components/ui/button";
import { ArrowRight, Weight, Gem, Hash, Coins } from "lucide-react";
import type { GoldItem } from "@/types/appraisal";

interface ItemDetailsProps {
  item: GoldItem;
  minPrice?: number | null;
  maxPrice?: number | null;
  onNext: () => void;
}

const ItemDetails = ({ item, minPrice, maxPrice, onNext }: ItemDetailsProps) => {
  const details = [
    { icon: Hash, label: "Kode Barcode", value: item.barcode },
    { icon: Gem, label: "Nama Barang", value: item.nama_barang },
    { icon: Weight, label: "Berat", value: `${item.berat} gram` },
    { icon: Coins, label: "Harga Beli Customer/gr", value: item.harga_gram ? `Rp ${item.harga_gram.toLocaleString()}` : "-" },
  ];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Detail Barang</h2>
        {/* <p className="text-sm text-muted-foreground">{item.description}</p> */}
      </div>

      <div className="w-full space-y-3">
        {details.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 rounded-xl surface-elevated"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {typeof minPrice === "number" && typeof maxPrice === "number" && (
        <div className="w-full p-4 rounded-xl bg-surface-elevated flex flex-col gap-2 mt-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Harga Minimal</span>
            <span className="font-mono">Rp {minPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Harga Maksimal</span>
            <span className="font-mono">Rp {maxPrice.toLocaleString()}</span>
          </div>
        </div>
      )}
      <Button
        variant="gold"
        size="lg"
        className="w-full h-12 rounded-xl"
        onClick={onNext}
      >
        Lanjutkan
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
};

export default ItemDetails;
