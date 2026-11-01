import { z } from 'zod';

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const CaseLengthSchema = z.enum(['short', 'standard']);
export const EvidenceTypeSchema = z.enum(['chat', 'image', 'camera', 'document', 'audio_transcript', 'physical']);

export const CreateCaseInputSchema = z.object({
  scenario: z.string().trim().min(30, 'Scenario must be at least 30 characters.').max(1000, 'Scenario must be 1000 characters or fewer.'),
  difficulty: DifficultySchema.default('medium'),
  length: CaseLengthSchema.default('short')
});

export const InterrogateInputSchema = z.object({
  suspectId: z.string().min(1),
  question: z.string().trim().min(1).max(300)
});

export const AccuseInputSchema = z.object({
  suspectId: z.string().min(1)
});

export function isKnownCaseLength(value: string): value is 'short' | 'standard' {
  return value === 'short' || value === 'standard';
}

export function sanitizeText(value: string, fallback = 'Unknown'): string {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  return cleaned && cleaned.length > 0 ? cleaned : fallback;
}

export function assertValidGeneratedCase(caseData: any): caseData is any {
  if (!caseData || typeof caseData !== 'object') {
    return false;
  }

  const suspects = Array.isArray(caseData.suspects) ? caseData.suspects : [];
  const evidence = Array.isArray(caseData.evidence) ? caseData.evidence : [];

  if (!caseData.title || !caseData.incident || !caseData.setting) {
    return false;
  }

  if (suspects.length < 3 || suspects.length > 5) {
    return false;
  }

  const evidenceCountMin = caseData.length === 'short' ? 5 : 8;
  const evidenceCountMax = caseData.length === 'short' ? 8 : 12;
  if (evidence.length < evidenceCountMin || evidence.length > evidenceCountMax) {
    return false;
  }

  const suspectIds = new Set<string>();
  for (const suspect of suspects) {
    if (!suspect.id || !suspect.name || !suspect.role || !suspect.publicBio || !suspect.publicAlibi || !suspect.statement) {
      return false;
    }
    if (suspectIds.has(suspect.id)) {
      return false;
    }
    suspectIds.add(suspect.id);
  }

  if (!caseData.solution || !caseData.solution.culpritId || !suspectIds.has(caseData.solution.culpritId)) {
    return false;
  }

  if (!Array.isArray(caseData.solution.keyEvidenceIds) || caseData.solution.keyEvidenceIds.length === 0) {
    return false;
  }

  for (const piece of evidence) {
    if (!piece.id || !piece.title || !piece.content) {
      return false;
    }
    if (!Array.isArray(piece.implicatesSuspectIds) || !Array.isArray(piece.contradictsSuspectIds)) {
      return false;
    }
  }

  return true;
}
