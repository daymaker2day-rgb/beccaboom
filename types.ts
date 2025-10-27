export type TapeState = 'stopped' | 'playing' | 'paused';

export type RadioMode = 'AUDIO' | 'VIDEO';

export type MediaQueueItem = {
    file: File;
    url: string;
};