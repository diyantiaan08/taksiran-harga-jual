export interface BranchInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  domain?: string;
}

export interface GoldItem {
  barcode: string;
  nama_barang: string;
  berat: number; // gram
  harga_gram?: number; // harga beli customer per gram
}
}

export interface QuestionnaireItem {
  id: string;
  question: string;
  type: 'boolean' | 'select';
  options?: string[];
}

export interface QuestionnaireAnswer {
  questionId: string;
  answer: string | boolean;
}

export interface AppraisalResult {
  item: GoldItem;
  conditionScore: number; // 0-100
  goldPricePerGram: number;
  minPrice: number;
  maxPrice: number;
  answers: QuestionnaireAnswer[];
}
