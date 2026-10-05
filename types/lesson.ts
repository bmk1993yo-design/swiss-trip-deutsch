// data/schema/lesson.schema.json 과 같은 구조를 유지할 것.

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "preposition"
  | "pronoun"
  | "interjection"
  | "phrase";

export type Gender = "der" | "die" | "das";

export interface Theme {
  id: string;
  title: string;
  emoji: string;
}

export interface PronunciationSyllable {
  text: string;
  stress: boolean;
}

export interface Pronunciation {
  /** 기준 데이터. 예: "/ˈbɔʁtˌkaʁtə/" */
  ipa: string;
  /** 보조 수단. stress=true 덩어리를 강조 표시 */
  korean: PronunciationSyllable[];
}

export type VoiceId = "aiden" | "serena";

export interface AudioPair {
  normal: string;
  slow?: string;
}

/** 목소리별 음성. 예: /audio/2026-10-06/word-01-aiden.opus */
export type Audio = Record<VoiceId, AudioPair>;

interface WordBase {
  id: string;
  german: string;
  meaning: string;
  pronunciation: Pronunciation;
  audio: Audio;
  isSwissExpression: boolean;
  swissNote?: string;
}

export interface NounWord extends WordBase {
  partOfSpeech: "noun";
  gender: Gender;
  plural: string | null;
}

export interface OtherWord extends WordBase {
  partOfSpeech: Exclude<PartOfSpeech, "noun">;
  gender?: never;
  plural?: string | null;
}

export type Word = NounWord | OtherWord;

export interface Sentence {
  id: string;
  german: string;
  meaning: string;
  pronunciation: Pronunciation;
  audio: Audio;
  usesWords?: string[];
  swissNote?: string;
}

export interface GrammarExample {
  german: string;
  meaning: string;
}

export interface Grammar {
  id: string;
  title: string;
  pattern: string;
  meaning: string;
  explanation: string;
  examples: GrammarExample[];
  tip?: string;
}

export interface Lesson {
  schemaVersion: 1;
  /** YYYY-MM-DD (KST) */
  date: string;
  day: number;
  /** YYYY-MM-DDT17:00:00+09:00 */
  unlockAt: string;
  theme: Theme;
  approved: boolean;
  words: Word[];
  sentences: Sentence[];
  grammar: Grammar;
}
