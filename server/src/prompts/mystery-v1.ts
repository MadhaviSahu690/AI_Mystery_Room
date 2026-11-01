export function buildMysteryPrompt(scenario: string, difficulty: string, length: string): string {
  return `
You are creating a fictional mystery case. Generate a JSON object with this exact shape:
{
  "title": "string",
  "difficulty": "easy|medium|hard",
  "length": "short|standard",
  "premise": "string",
  "setting": "string",
  "incident": "string",
  "timeline": [{ "id": "string", "timestamp": "string", "event": "string" }],
  "suspects": [{
    "id": "string",
    "name": "string",
    "role": "string",
    "publicBio": "string",
    "publicAlibi": "string",
    "privateMotive": "string",
    "privateSecret": "string",
    "statement": "string"
  }],
  "evidence": [{
    "id": "string",
    "type": "chat|image|camera|document|audio_transcript|physical",
    "title": "string",
    "timestamp": "string",
    "content": "string",
    "mediaUrl": "string | null",
    "altText": "string | null",
    "relevance": "string",
    "implicatesSuspectIds": ["string"],
    "contradictsSuspectIds": ["string"]
  }],
  "solution": {
    "culpritId": "string",
    "summary": "string",
    "reasoning": "string",
    "keyEvidenceIds": ["string"],
    "suspectEliminations": [{ "suspectId": "string", "explanation": "string" }]
  }
}

Requirements:
- Story premise: ${scenario}
- Difficulty: ${difficulty}
- Length: ${length}
- Use only fictional content based on the premise.
- Include 3 to 5 suspects.
- Exactly one culprit matches a suspect ID.
- Make multiple suspects plausible.
- Create a consistent timeline and evidence set.
- Ensure the culprit is inferable from public evidence only.
- Keep all public fields free of the solution or culprit identity.
- No real identities, real crimes, or real surveillance authenticity claims.
- Output valid JSON only.
`;
}
