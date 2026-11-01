import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { config } from './config.js';
import { generateMysteryCase } from './services/gemini.js';
import { CreateCaseInputSchema, AccuseInputSchema, InterrogateInputSchema, sanitizeText } from './lib/validate.js';
import { calculateScore } from './lib/scoring.js';
import { clearStores, createCaseRecord, createSessionForCase, getCaseById, getSessionForCase, saveSession } from './lib/caseStore.js';
import type { GameSession, MysteryCase, PublicCaseResponse, PublicResultResponse, GameStateResponse } from './types.js';

export const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    const isAllowedLocalOrigin = config.clientOrigins.includes(origin)
      || origin.startsWith('http://localhost:')
      || origin.startsWith('http://127.0.0.1:')
      || origin.startsWith('http://[::1]:');

    if (isAllowedLocalOrigin) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

const caseLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } }
});

app.use('/api', caseLimit);

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'ai-mystery-room',
    message: 'This is the backend API. Open the frontend at http://localhost:5173',
    health: 'http://localhost:4100/api/health'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ai-mystery-room', timestamp: new Date().toISOString() });
});

app.post('/api/cases', async (req, res, next) => {
  try {
    const parsed = CreateCaseInputSchema.parse(req.body);
    const caseRecord = await generateMysteryCase(parsed.scenario, parsed.difficulty, parsed.length);

    const session = createSessionForCase(caseRecord._id);
    const persistedCase = createCaseRecord({ ...caseRecord, promptVersion: caseRecord.promptVersion ?? 'mystery-v1', schemaVersion: caseRecord.schemaVersion ?? 1 });
    const publicCase = toPublicCase(caseRecord, session.status, session.discoveredEvidenceIds);
    const publicGameState = toGameState(session);

    res.status(201).json({
      caseId: persistedCase._id,
      sessionId: session._id,
      case: publicCase,
      gameState: publicGameState
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/cases/:caseId', (req, res, next) => {
  try {
    const caseRecord = getCaseById(req.params.caseId);
    if (!caseRecord) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.' } });
      return;
    }

    const session = getSessionForCase(caseRecord._id);
    const publicCase = toPublicCase(caseRecord, session?.status ?? 'active', session?.discoveredEvidenceIds ?? []);
    res.json({ case: publicCase, gameState: session ? toGameState(session) : { status: 'active', discoveredEvidenceIds: [], hintsUsed: 0, questionsUsed: 0 } });
  } catch (error) {
    next(error);
  }
});

app.post('/api/cases/:caseId/evidence/:evidenceId/open', (req, res, next) => {
  try {
    const caseRecord = getCaseById(req.params.caseId);
    if (!caseRecord) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.' } });
      return;
    }

    const evidence = caseRecord.evidence.find((item) => item.id === req.params.evidenceId);
    if (!evidence) {
      res.status(400).json({ error: { code: 'INVALID_EVIDENCE', message: 'Evidence not found.' } });
      return;
    }

    const session = getSessionForCase(caseRecord._id);
    if (!session) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Session not found.' } });
      return;
    }

    if (!session.discoveredEvidenceIds.includes(evidence.id)) {
      session.discoveredEvidenceIds.push(evidence.id);
      saveSession(session);
    }

    res.json({
      evidence: toPublicEvidence(evidence, true),
      gameState: toGameState(session)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/cases/:caseId/hints', (req, res, next) => {
  try {
    const caseRecord = getCaseById(req.params.caseId);
    if (!caseRecord) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.' } });
      return;
    }

    const session = getSessionForCase(caseRecord._id);
    if (!session) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Session not found.' } });
      return;
    }

    if (session.status === 'resolved') {
      res.status(409).json({ error: { code: 'CASE_ALREADY_RESOLVED', message: 'Case is already resolved.' } });
      return;
    }

    if (session.hintsUsed >= 3) {
      res.status(409).json({ error: { code: 'HINT_LIMIT_REACHED', message: 'Hint limit reached.' } });
      return;
    }

    session.hintsUsed += 1;
    saveSession(session);

    res.json({
      hint: { index: session.hintsUsed, text: `Hint ${session.hintsUsed}: Review the evidence tied to ${caseRecord.solution.culpritId}.` },
      gameState: toGameState(session)
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/cases/:caseId/interrogate', (req, res, next) => {
  try {
    const caseRecord = getCaseById(req.params.caseId);
    if (!caseRecord) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.' } });
      return;
    }

    const session = getSessionForCase(caseRecord._id);
    if (!session) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Session not found.' } });
      return;
    }

    const parsed = InterrogateInputSchema.parse(req.body);
    const suspect = caseRecord.suspects.find((item) => item.id === parsed.suspectId);
    if (!suspect) {
      res.status(400).json({ error: { code: 'INVALID_SUSPECT', message: 'Unknown suspect.' } });
      return;
    }

    if (session.status === 'resolved') {
      res.status(409).json({ error: { code: 'CASE_ALREADY_RESOLVED', message: 'Case is already resolved.' } });
      return;
    }

    if (session.questionsUsed >= 5) {
      res.status(409).json({ error: { code: 'QUESTION_LIMIT_REACHED', message: 'Question limit reached.' } });
      return;
    }

    session.questionsUsed += 1;
    session.interrogation.push({
      suspectId: suspect.id,
      question: parsed.question,
      answer: `${suspect.name}: "${suspect.statement}"`,
      createdAt: new Date().toISOString()
    });
    saveSession(session);

    res.json({ suspectId: suspect.id, answer: `${suspect.name}: "${suspect.statement}"`, gameState: toGameState(session) });
  } catch (error) {
    next(error);
  }
});

app.post('/api/cases/:caseId/accuse', (req, res, next) => {
  try {
    const caseRecord = getCaseById(req.params.caseId);
    if (!caseRecord) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.' } });
      return;
    }

    const session = getSessionForCase(caseRecord._id);
    if (!session) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Session not found.' } });
      return;
    }

    if (session.status === 'resolved') {
      res.status(200).json({
        result: buildResultResponse(caseRecord, session),
        gameState: toGameState(session)
      });
      return;
    }

    const parsed = AccuseInputSchema.parse(req.body);
    const suspect = caseRecord.suspects.find((item) => item.id === parsed.suspectId);
    if (!suspect) {
      res.status(400).json({ error: { code: 'INVALID_SUSPECT', message: 'Unknown suspect.' } });
      return;
    }

    const correct = parsed.suspectId === caseRecord.solution.culpritId;
    const result = buildResultResponse(caseRecord, session, parsed.suspectId, correct);
    session.status = 'resolved';
    session.accusation = {
      suspectId: parsed.suspectId,
      correct,
      score: result.score,
      submittedAt: new Date().toISOString()
    };
    saveSession(session);

    res.status(200).json({ result, gameState: toGameState(session) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/cases/:caseId/result', (req, res, next) => {
  try {
    const caseRecord = getCaseById(req.params.caseId);
    if (!caseRecord) {
      res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'Case not found.' } });
      return;
    }

    const session = getSessionForCase(caseRecord._id);
    if (!session || session.status !== 'resolved' || !session.accusation) {
      res.status(409).json({ error: { code: 'CASE_NOT_RESOLVED', message: 'Case is not resolved yet.' } });
      return;
    }

    res.json({ result: buildResultResponse(caseRecord, session), gameState: toGameState(session) });
  } catch (error) {
    next(error);
  }
});

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  if (error?.name === 'ZodError') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request payload.' } });
    return;
  }

  if (error instanceof Error && error.message.includes('Missing required environment')) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } });
});

function toPublicCase(caseRecord: MysteryCase, status: 'active' | 'resolved', discoveredIds: string[] = []): PublicCaseResponse {
  const discoveredSet = new Set(discoveredIds);

  return {
    title: caseRecord.title,
    difficulty: caseRecord.difficulty,
    premise: caseRecord.premise,
    setting: caseRecord.setting,
    incident: caseRecord.incident,
    timeline: caseRecord.timeline,
    suspects: caseRecord.suspects.map((suspect) => ({
      id: suspect.id,
      name: suspect.name,
      role: suspect.role,
      publicBio: suspect.publicBio,
      publicAlibi: suspect.publicAlibi,
      statement: suspect.statement
    })),
    evidence: caseRecord.evidence.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      timestamp: item.timestamp,
      content: item.content,
      mediaUrl: item.mediaUrl,
      altText: item.altText,
      discovered: discoveredSet.has(item.id),
      fictionalLabel: 'Fictional evidence'
    })),
    status,
    counts: {
      suspects: caseRecord.suspects.length,
      evidence: caseRecord.evidence.length,
      discovered: caseRecord.evidence.filter((item) => discoveredSet.has(item.id)).length
    }
  };
}

function toPublicEvidence(evidence: MysteryCase['evidence'][number], discovered: boolean) {
  return {
    id: evidence.id,
    type: evidence.type,
    title: evidence.title,
    timestamp: evidence.timestamp,
    content: evidence.content,
    mediaUrl: evidence.mediaUrl,
    altText: evidence.altText,
    discovered,
    fictionalLabel: 'Fictional evidence'
  };
}

function toGameState(session: GameSession): GameStateResponse {
  return {
    status: session.status,
    discoveredEvidenceIds: session.discoveredEvidenceIds,
    hintsUsed: session.hintsUsed,
    questionsUsed: session.questionsUsed,
    accusation: session.accusation
  };
}

function buildResultResponse(caseRecord: MysteryCase, session: GameSession, accusationId?: string, correct?: boolean): PublicResultResponse {
  const scoreResult = calculateScore(session, correct ?? false);
  const culprit = caseRecord.suspects.find((suspect) => suspect.id === caseRecord.solution.culpritId);

  return {
    correct: correct ?? session.accusation?.correct ?? false,
    culprit: {
      id: culprit?.id ?? caseRecord.solution.culpritId,
      name: culprit?.name ?? 'Unknown'
    },
    summary: caseRecord.solution.summary,
    reasoning: caseRecord.solution.reasoning,
    keyEvidence: caseRecord.solution.keyEvidenceIds.map((id) => {
      const evidence = caseRecord.evidence.find((item) => item.id === id);
      return {
        id,
        title: evidence?.title ?? 'Unknown evidence',
        explanation: evidence?.relevance ?? 'Evidence connects the culprit to the case.'
      };
    }),
    suspectEliminations: caseRecord.solution.suspectEliminations,
    score: scoreResult.score,
    scoreBreakdown: scoreResult.scoreBreakdown
  };
}

export function resetAppState(): void {
  clearStores();
}
