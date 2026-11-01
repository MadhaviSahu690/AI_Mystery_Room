export type Difficulty = 'easy' | 'medium' | 'hard';
export type CaseLength = 'short' | 'standard';
export type CaseStatus = 'active' | 'resolved';
export type EvidenceType = 'chat' | 'image' | 'camera' | 'document' | 'audio_transcript' | 'physical';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  event: string;
}

export interface Suspect {
  id: string;
  name: string;
  role: string;
  publicBio: string;
  publicAlibi: string;
  privateMotive: string;
  privateSecret?: string;
  statement: string;
}

export interface EvidenceArtifact {
  id: string;
  type: EvidenceType;
  title: string;
  timestamp?: string;
  content: string;
  mediaUrl?: string;
  altText?: string;
  relevance: string;
  implicatesSuspectIds: string[];
  contradictsSuspectIds: string[];
}

export interface MysteryCase {
  _id: string;
  title: string;
  difficulty: Difficulty;
  length: CaseLength;
  premise: string;
  setting: string;
  incident: string;
  timeline: TimelineEvent[];
  suspects: Suspect[];
  evidence: EvidenceArtifact[];
  solution: {
    culpritId: string;
    summary: string;
    reasoning: string;
    keyEvidenceIds: string[];
    suspectEliminations: Array<{ suspectId: string; explanation: string }>;
  };
  promptVersion: string;
  schemaVersion: number;
  createdAt: string;
  expiresAt: string;
}

export interface GameSession {
  _id: string;
  caseId: string;
  status: CaseStatus;
  discoveredEvidenceIds: string[];
  hintsUsed: number;
  questionsUsed: number;
  interrogation: Array<{
    suspectId: string;
    question: string;
    answer: string;
    createdAt: string;
  }>;
  accusation?: {
    suspectId: string;
    correct: boolean;
    score: number;
    submittedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface PublicCaseResponse {
  title: string;
  difficulty: Difficulty;
  premise: string;
  setting: string;
  incident: string;
  timeline: TimelineEvent[];
  suspects: Array<{
    id: string;
    name: string;
    role: string;
    publicBio: string;
    publicAlibi: string;
    statement: string;
  }>;
  evidence: Array<{
    id: string;
    type: EvidenceType;
    title: string;
    timestamp?: string;
    content: string;
    mediaUrl?: string;
    altText?: string;
    discovered: boolean;
    fictionalLabel: string;
  }>;
  status: CaseStatus;
  counts: {
    suspects: number;
    evidence: number;
    discovered: number;
  };
}

export interface EvidenceDetailResponse {
  id: string;
  type: EvidenceType;
  title: string;
  timestamp?: string;
  content: string;
  mediaUrl?: string;
  altText?: string;
  discovered: boolean;
  fictionalLabel: string;
}

export interface PublicResultResponse {
  correct: boolean;
  culprit: { id: string; name: string };
  summary: string;
  reasoning: string;
  keyEvidence: Array<{ id: string; title: string; explanation: string }>;
  suspectEliminations: Array<{ suspectId: string; explanation: string }>;
  score: number;
  scoreBreakdown: {
    base: number;
    hintPenalty: number;
    questionPenalty: number;
    incorrectAccusationPenalty: number;
    final: number;
  };
}

export interface GameStateResponse {
  status: CaseStatus;
  discoveredEvidenceIds: string[];
  hintsUsed: number;
  questionsUsed: number;
  accusation?: {
    suspectId: string;
    correct: boolean;
    score: number;
    submittedAt: string;
  };
}
