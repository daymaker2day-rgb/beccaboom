export type TapeState = 'stopped' | 'playing' | 'paused';

export type RadioMode = 'AUDIO' | 'VIDEO';

export type MediaQueueItem = {
    file: File | { name: string; type: string };
    url: string;
};

export interface WatermarkData {
  color: string;
  thickness: number;
  opacity: number;
  traced: boolean;
  hidden: boolean;
  layers?: WatermarkLayer[];
  x?: number;
  y?: number;
  angle?: number;
  size?: number;
  shape?: string;
  text?: string;
}

export interface WatermarkLayer {
  color: string;
  thickness: number;
  opacity: number;
  x?: number;
  y?: number;
  angle?: number;
  size?: number;
  shape?: string;
  text?: string;
  hidden?: boolean;
  traced?: boolean;
}