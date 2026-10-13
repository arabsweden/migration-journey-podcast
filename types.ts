
export interface AnalysisResult {
  summary: string;
  lessons: string[];
  migrationAdvice: string;
  podcastScript: string;
  podcastTitle: string;
  relatedResources: {
    title: string;
    description: string;
  }[];
  asylumProbability: {
    level: string;
    reasoning: string;
  };
  acceptanceTips: string[];
  legalContext: {
    country: string;
    laws: string[];
  };
  categories: {
    origin: string;
    destination: string;
    reason: string;
  };
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  image: string;
  analysis: AnalysisResult;
}

export interface PodcastMessage {
  speaker: string;
  text: string;
}

export interface Comment {
  id: string;
  storyId: string;
  text: string;
  author: string;
  timestamp: number;
}
