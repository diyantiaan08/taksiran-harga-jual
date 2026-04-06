# Panduan QR Cabang (Step 1 → Step 2)

## Format QR
Ada dua bentuk yang didukung:

1) **QR berisi link terenkripsi**:
```
https://<domain>/?qr=<token>
```

`token` adalah hasil **AES-GCM** berisi payload:
```
{ "kode_toko": "ITY", "domain": "https://italy.goldstore.id" }
```

2) **QR berisi teks kode toko saja** (misal: `ITALY BANDUNG`)
- FE akan mengenali kode toko, lalu otomatis membuat token terenkripsi di URL.

## Env yang Dibutuhkan (FE)
```
VITE_QR_SECRET=<secret_min_32_char>
```

## Generator Link
Gunakan script:
```
node taksiran-harga/scripts/generate-qr-link.js --base https://domain --kode KODE_TOKO --secret SECRET
```

Contoh:
```
node taksiran-harga/scripts/generate-qr-link.js --base https://taksiranemas.id --kode ITY --secret supersecret1234567890supersecret
```

Output berupa link siap dijadikan QR.

## Catatan
- QR hanya membawa `kode_toko`. Detail cabang tetap diambil dari API `/stores`.
- Jika QR invalid atau kode tidak ditemukan, akan muncul pesan error.
