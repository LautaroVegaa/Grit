export type Mood = 'terrible' | 'bad' | 'neutral' | 'great' | 'excellent';

export const MOOD_VALUES: Mood[] = ['terrible', 'bad', 'neutral', 'great', 'excellent'];

export interface MoodOption {
	id: Mood;
	title: string;
	emoji: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
	{ id: 'terrible', title: 'Terrible', emoji: '😣' },
	{ id: 'bad', title: 'Bad', emoji: '😕' },
	{ id: 'neutral', title: 'Neutral', emoji: '😐' },
	{ id: 'great', title: 'Great', emoji: '🙂' },
	{ id: 'excellent', title: 'Excellent', emoji: '😄' },
];
