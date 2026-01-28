export enum AppView {
  HOME = 'HOME',
  SESSION = 'SESSION',
  PROGRESS = 'PROGRESS',
  PROFILE = 'PROFILE'
}

export enum PracticeMode {
  CASUAL = 'CASUAL',
  PRONUNCIATION = 'PRONUNCIATION',
  INTERVIEW = 'INTERVIEW',
  GRAMMAR = 'GRAMMAR'
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  emoji: string;
  mode: PracticeMode;
  initialPrompt: string;
}

export interface SessionConfig {
  mode: PracticeMode;
  topic?: Topic;
}

export interface AudioVolumeState {
  input: number;
  output: number;
}
