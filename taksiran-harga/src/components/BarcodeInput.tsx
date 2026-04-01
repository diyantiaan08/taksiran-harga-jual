import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanBarcode, ArrowRight } from "lucide-react";

interface BarcodeInputProps {
  onSubmit: (barcode: string) => void;
}

const BarcodeInput = ({ onSubmit }: BarcodeInputProps) => {
  const [barcode, setBarcode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) onSubmit(barcode.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm mx-auto animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center">
        <ScanBarcode className="w-10 h-10 text-primary-foreground" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Masukkan Kode Nota</h2>
        <p className="text-sm text-muted-foreground">
          Masukkan kode barcode yang tertera pada nota pembelian Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <Input
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Contoh: GLD-001"
          className="h-14 text-center text-lg font-mono tracking-widest border-border bg-surface-elevated focus:border-primary"
        />
        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="w-full h-12 rounded-xl"
          disabled={!barcode.trim()}
        >
          Cari Data
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Kode demo: GLD-001, GLD-002, GLD-003
      </p>
    </div>
  );
};

export default BarcodeInput;
