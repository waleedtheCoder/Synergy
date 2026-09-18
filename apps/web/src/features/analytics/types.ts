export interface AnalyticsTotals {
  PROFILE_VIEW: number;
  SEARCH_APPEARANCE: number;
  PROFILE_CLICK: number;
  INQUIRY: number;
}

export interface AnalyticsSeriesPoint extends AnalyticsTotals {
  date: string;
}

export interface AnalyticsSummary {
  totals: AnalyticsTotals;
  series: AnalyticsSeriesPoint[];
  rangeDays: number;
}

export interface AdminAnalyticsSummary extends AnalyticsSummary {
  topProfessionals: {
    id: string;
    slug: string;
    businessName: string | null;
    user: { firstName: string; lastName: string };
    views: number;
  }[];
}
