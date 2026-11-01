import { GoogleGenAI } from '@google/genai';

import { config } from '../config.js';
import { buildMysteryPrompt } from '../prompts/mystery-v1.js';
import { generateMockMysteryCase } from '../lib/mockGenerator.js';
import type { CaseLength, Difficulty, MysteryCase } from '../types.js';

export async function generateMysteryCase(
  scenario: string,
  difficulty: Difficulty,
  length: CaseLength
): Promise<MysteryCase> {
  if (!config.geminiApiKey) {
    return generateMockMysteryCase(scenario, difficulty, length);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
    const prompt = buildMysteryPrompt(scenario, difficulty, length);

    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            difficulty: { type: 'string' },
            length: { type: 'string' },
            premise: { type: 'string' },
            setting: { type: 'string' },
            incident: { type: 'string' },
            timeline: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  timestamp: { type: 'string' },
                  event: { type: 'string' }
                },
                required: ['id', 'timestamp', 'event']
              }
            },
            suspects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  publicBio: { type: 'string' },
                  publicAlibi: { type: 'string' },
                  privateMotive: { type: 'string' },
                  privateSecret: { type: 'string' },
                  statement: { type: 'string' }
                },
                required: ['id', 'name', 'role', 'publicBio', 'publicAlibi', 'privateMotive', 'statement']
              }
            },
            evidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  title: { type: 'string' },
                  timestamp: { type: 'string' },
                  content: { type: 'string' },
                  mediaUrl: { type: 'string' },
                  altText: { type: 'string' },
                  relevance: { type: 'string' },
                  implicatesSuspectIds: { type: 'array', items: { type: 'string' } },
                  contradictsSuspectIds: { type: 'array', items: { type: 'string' } }
                },
                required: ['id', 'type', 'title', 'content', 'relevance', 'implicatesSuspectIds', 'contradictsSuspectIds']
              }
            },
            solution: {
              type: 'object',
              properties: {
                culpritId: { type: 'string' },
                summary: { type: 'string' },
                reasoning: { type: 'string' },
                keyEvidenceIds: { type: 'array', items: { type: 'string' } },
                suspectEliminations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      suspectId: { type: 'string' },
                      explanation: { type: 'string' }
                    },
                    required: ['suspectId', 'explanation']
                  }
                }
              },
              required: ['culpritId', 'summary', 'reasoning', 'keyEvidenceIds', 'suspectEliminations']
            }
          },
          required: ['title', 'difficulty', 'length', 'premise', 'setting', 'incident', 'timeline', 'suspects', 'evidence', 'solution']
        }
      }
    });

    const rawText = typeof response.text === 'string' ? response.text : JSON.stringify(response);
    const parsed = JSON.parse(rawText) as Partial<MysteryCase>;
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Gemini returned no content.');
    }

    const normalized: MysteryCase = {
      _id: crypto.randomUUID(),
      title: parsed.title ?? 'Unknown case',
      difficulty: parsed.difficulty ?? difficulty,
      length: parsed.length ?? length,
      premise: parsed.premise ?? scenario,
      setting: parsed.setting ?? 'Unknown locale',
      incident: parsed.incident ?? 'Unknown incident',
      timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
      suspects: Array.isArray(parsed.suspects) ? parsed.suspects : [],
      evidence: Array.isArray(parsed.evidence) ? parsed.evidence : [],
      solution: {
        culpritId: parsed.solution?.culpritId ?? '',
        summary: parsed.solution?.summary ?? '',
        reasoning: parsed.solution?.reasoning ?? '',
        keyEvidenceIds: parsed.solution?.keyEvidenceIds ?? [],
        suspectEliminations: parsed.solution?.suspectEliminations ?? []
      },
      promptVersion: 'mystery-v1',
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
    };

    if (normalized.suspects.length >= 3 && normalized.evidence.length >= 5) {
      return normalized;
    }

    return generateMockMysteryCase(scenario, difficulty, length);
  } catch (error) {
    console.warn('Gemini request failed; falling back to local generated case.', error);
    return generateMockMysteryCase(scenario, difficulty, length);
  }
}
