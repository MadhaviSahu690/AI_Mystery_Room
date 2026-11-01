import type { GameSession, MysteryCase } from '../types.js';

const cases = new Map<string, MysteryCase>();
const sessions = new Map<string, GameSession>();

export function createCaseRecord(payload: MysteryCase): MysteryCase {
  cases.set(payload._id, payload);
  return payload;
}

export function createSessionForCase(caseId: string): GameSession {
  const session: GameSession = {
    _id: crypto.randomUUID(),
    caseId,
    status: 'active',
    discoveredEvidenceIds: [],
    hintsUsed: 0,
    questionsUsed: 0,
    interrogation: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
  };

  sessions.set(session._id, session);
  return session;
}

export function getCaseById(id: string): MysteryCase | undefined {
  return cases.get(id);
}

export function getSessionById(id: string): GameSession | undefined {
  return sessions.get(id);
}

export function getSessionForCase(caseId: string): GameSession | undefined {
  return [...sessions.values()].find((session) => session.caseId === caseId);
}

export function saveSession(session: GameSession): GameSession {
  sessions.set(session._id, session);
  return session;
}

export function listSessions(): GameSession[] {
  return [...sessions.values()];
}

export function clearStores(): void {
  cases.clear();
  sessions.clear();
}
