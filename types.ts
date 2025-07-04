export enum Tool {
  OnPageSEO = 'On-Page SEO',
  KeywordGenerator = 'Keyword Generator',
  BlogPostWriter = 'Blog Post Writer',
  RankTracker = 'Rank Tracker',
}

// On-Page SEO Types
export type OnPageSeoResult = string; // Result is now a single markdown/html string

export interface OnPageSeoState {
  webhook: string;
  url: string;
  result: OnPageSeoResult | null;
  isLoading: boolean;
  error: string | null;
  rawResponse: any | null;
}

// Keyword Generator Types
export interface Keyword {
  keyword: string;
  intent: string;
  volumeCategory: string;
  type: string;
}
export interface KeywordGeneratorState {
  webhook: string;
  topic: string;
  result: Keyword[] | null;
  isLoading: boolean;
  error: string | null;
  rawResponse: any | null;
}

// Blog Post Writer Types
export type BlogPostResult = string; // Will hold the raw HTML content from the webhook

export interface BlogPostWriterState {
  webhook: string;
  topic: string;
  result: BlogPostResult | null;
  isLoading: boolean;
  error: string | null;
  rawResponse: any | null;
}

// Rank Tracker Types
export interface RankTrackerResult {
  "Current Rank": number | 'Not Found';
  "Previous Rank": number | 'N/A';
}
export interface RankTrackerState {
  webhook: string;
  domain: string;
  keyword: string;
  result: RankTrackerResult | null;
  isLoading: boolean;
  error: string | null;
  rawResponse: any | null;
}

// Global App State
export interface AppState {
  [Tool.OnPageSEO]: OnPageSeoState;
  [Tool.KeywordGenerator]: KeywordGeneratorState;
  [Tool.BlogPostWriter]: BlogPostWriterState;
  [Tool.RankTracker]: RankTrackerState;
}