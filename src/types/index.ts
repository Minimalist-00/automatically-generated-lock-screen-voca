export interface Word {
  id: string;
  word: string;
  memo?: string;
  part_of_speech?: string;
  tags?: string[];
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

// Removed unused AI candidate types

export type ColorTheme = 'mint' | 'sakura' | 'blue' | 'ginkgo';
