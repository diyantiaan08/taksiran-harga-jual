export interface BranchInfo {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  domain?: string;
  qr_link?: string;
}

export interface GoldItem {
  barcode: string;
  nama_barang: string;
  berat: number; // gram
  harga_gram?: number; // harga beli customer per gram
  harga_jual?: number; // harga beli customer total
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
