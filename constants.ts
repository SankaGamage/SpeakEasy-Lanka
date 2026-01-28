import { Topic, PracticeMode } from './types';

export const TOPICS: Topic[] = [
  {
    id: 'intro',
    title: 'Self Introduction',
    description: 'Learn to introduce yourself confidently.',
    emoji: '👋',
    mode: PracticeMode.CASUAL,
    initialPrompt: "Let's practice introducing yourself. Can you tell me your name and what you do?",
  },
  {
    id: 'daily-chat',
    title: 'Daily Chat',
    description: 'Casual conversation about your day.',
    emoji: '☕',
    mode: PracticeMode.CASUAL,
    initialPrompt: "Hi! How is your day going so far? Did you do anything interesting?",
  },
  {
    id: 'job-interview',
    title: 'Job Interview',
    description: 'Practice answering common interview questions.',
    emoji: '💼',
    mode: PracticeMode.INTERVIEW,
    initialPrompt: "Welcome to the interview. Let's start with a simple question: Tell me about yourself.",
  },
  {
    id: 'pronunciation',
    title: 'Pronunciation Fix',
    description: 'Focus on tricky words and sounds.',
    emoji: '🗣️',
    mode: PracticeMode.PRONUNCIATION,
    initialPrompt: "Let's work on your pronunciation. I'll give you a sentence, and you repeat it. Ready?",
  },
  {
    id: 'food',
    title: 'Ordering Food',
    description: 'Practice ordering at a restaurant.',
    emoji: '🍛',
    mode: PracticeMode.CASUAL,
    initialPrompt: "Imagine we are at a restaurant. I am the waiter. What would you like to order today?",
  },
    {
    id: 'directions',
    title: 'Giving Directions',
    description: 'Explain how to get somewhere.',
    emoji: '🗺️',
    mode: PracticeMode.CASUAL,
    initialPrompt: "Excuse me, I'm lost. Can you tell me how to get to the bus station from here?",
  },
];
