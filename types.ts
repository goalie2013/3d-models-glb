export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface GeneratedModelData {
  code: string;
  prompt: string;
  timestamp: number;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  code: string;
  createdAt: number;
}
