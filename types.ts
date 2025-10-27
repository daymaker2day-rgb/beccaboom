export type TapeState = 'stopped' | 'playing' | 'paused';

export type RadioMode = 'AUDIO' | 'VIDEO';

export type MediaQueueItem = {
    file: File | { name: string; type: string };
    url: string;
};