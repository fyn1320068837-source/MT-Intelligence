
export interface PriceData {
  date: string;
  price: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface PredictionState {
  currentPrice: number;
  lastUpdate: string;
  history: PriceData[];
  prediction: PriceData[];
  sentimentScore: number; // New: -100 (Extremely Bearish) to 100 (Extremely Bullish)
  news: string;
  sources: GroundingSource[];
  isUpdating: boolean;
}

export interface AppState {
  data: PredictionState;
  error: string | null;
}
