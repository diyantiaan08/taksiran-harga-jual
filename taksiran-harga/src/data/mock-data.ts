import type { BranchInfo, GoldItem, QuestionnaireItem } from "@/types/appraisal";

export const MOCK_BRANCHES: Record<string, BranchInfo> = {
  "cabang-1": {
    id: "cabang-1",
    name: "Toko Emas Cahaya",
    address: "Jl. Pasar Baru No. 12, Jakarta Pusat",
    phone: "021-1234567",
  },
  "cabang-2": {
    id: "cabang-2",
    name: "Toko Emas Cahaya - Bandung",
    address: "Jl. Braga No. 45, Bandung",
    phone: "022-7654321",
  },
};

export const MOCK_ITEMS: Record<string, GoldItem> = {
  "GLD-001": {
    barcode: "GLD-001",
    type: "Cincin",
    karat: 24,
    weight: 5.2,
    description: "Cincin Emas 24K Polos",
  },
  "GLD-002": {
    barcode: "GLD-002",
    type: "Kalung",
    karat: 22,
    weight: 12.8,
    description: "Kalung Emas 22K Rantai Italia",
  },
  "GLD-003": {
    barcode: "GLD-003",
    type: "Gelang",
    karat: 18,
    weight: 8.5,
    description: "Gelang Emas 18K Ukir",
  },
};

export const QUESTIONNAIRE: QuestionnaireItem[] = [
  {
    id: "q1",
    question: "Apakah barang dalam kondisi rusak?",
    type: "boolean",
  },
  {
    id: "q2",
    question: "Apakah warna emas pudar atau berubah?",
    type: "boolean",
  },
  {
    id: "q3",
    question: "Apakah ada bagian yang patah atau bengkok?",
    type: "boolean",
  },
  {
    id: "q4",
    question: "Apakah sertifikat/surat masih tersedia?",
    type: "boolean",
  },
  {
    id: "q5",
    question: "Bagaimana kondisi keseluruhan barang?",
    type: "select",
    options: ["Sangat Baik", "Baik", "Cukup", "Kurang"],
  },
];

// Mock gold price per gram (IDR)
export const GOLD_PRICE_PER_GRAM: Record<number, number> = {
  24: 1_050_000,
  22: 960_000,
  18: 780_000,
};
