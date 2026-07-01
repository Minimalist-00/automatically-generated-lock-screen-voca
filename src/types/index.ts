export interface Word {
  id: string;
  word: string;
  meaning: string;
  part_of_speech?: string;
  scene?: string;
  example?: string;
  is_archived?: boolean;
  is_priority?: boolean;
  sort_order?: number;
  created_at: string;
}

export interface Wallpaper {
  id: string;
  name: string;
  public_url: string;
  created_at: string;
  storage_path?: string;
}

export interface Quest {
  id: string;
  quest_date: string;
  word_ids: string[];
}

export interface GeneratedCandidate {
  scene: string;
  example: string;
}

export interface GeneratedVocaContent {
  meaning: string;
  part_of_speech?: string;
  candidates: GeneratedCandidate[];
}

export interface BulkGeneratedWord {
  word: string;
  meaning: string;
  part_of_speech?: string;
  candidates: { scene: string; example: string }[];
}

export type FontFamily = 'rounded' | 'sans' | 'serif' | 'handwriting';
export type ColorTheme = 'mint' | 'sakura' | 'blue' | 'ginkgo';
