AI Mystery Room --- Product & Engineering Specification
Document status: Source of truth for implementation
Version: 1.0
Product: AI Mystery Room
Stack: MERN (MongoDB, Express, React, Node.js) + Google Gemini API
Primary consumer: Codex / coding agent
1. Purpose and source-of-truth rules
This document defines the product behavior, architecture, data
contracts, user experience, security requirements, and acceptance
criteria for AI Mystery Room. Treat it as the canonical implementation
specification.
Rules for implementation
1. Implement requirements in this document unless a later, explicitly
   approved change updates this file.
2. Do not silently invent new product behavior. If a requirement is
   ambiguous, choose the simplest secure behavior and document the
   assumption in the README.
3. Keep secrets and the true solution on the server. Never send the
   culprit ID, private solution, hidden evidence, or unrevealed content
   to the browser.
4. Gemini output is untrusted input. Validate it against schemas before
   storing or using it.
5. Core game logic must remain deterministic after a case is created.
   Do not ask Gemini to independently decide who the culprit is during
   accusation checking.
6. Every major feature must have automated tests and user-visible
   loading, empty, and error states.
7. The application must run locally using documented commands and
   environment variables.
2. Product overview
AI Mystery Room is a browser-based investigation game. A player submits
a short scenario or story premise. The application uses Gemini on the
backend to create a fictional mystery case containing a crime or
incident, suspects, timelines, clues, and supporting evidence artifacts
such as chat messages, images, and security-camera footage descriptions
or generated media where configured.

The player examines the evidence, compares alibis, requests optional
hints, and selects the person they believe is responsible. The app then
reveals whether the accusation is correct and explains how the evidence
supports the solution.

All cases and evidence are fictional. The interface must not present
generated evidence as genuine records or real surveillance footage.
Product goals
- Turn a user-written premise into a playable, coherent mystery.
- Make evidence exploration intuitive and engaging.
- Keep the culprit and solution hidden until the player submits an
  accusation or explicitly ends the case.
- Provide a fair, explainable resolution based on evidence shown to
  the player.
- Deliver a responsive, reliable web application suitable for a live
  demo.
Non-goals for MVP
- Multiplayer or real-time co-op.
- Public user-generated case sharing or social feeds.
- Payments, subscriptions, or advertising.
- Real WhatsApp, camera, email, or social-media integrations.
- Uploading or analyzing real private surveillance or chat records.
- Training or fine-tuning a model.
- A requirement that Gemini itself generate binary video files. MVP
  may represent camera recordings as clearly labeled fictional
  clips/storyboards or short text transcripts. Actual image/video
  generation is an optional provider integration and must not block
  core gameplay.
3. Target users and primary journey
Target user
A person who wants to play a short, interactive detective mystery in a
web browser, with no technical knowledge required.
Primary journey
1. Open the landing page.
2. Enter a scenario/premise and choose difficulty and case length.
3. Submit the form.
4. See a generation/loading state while the server creates and
   validates a case.
5. Open the investigation workspace.
6. Review the incident summary, timeline, suspects, and available
   evidence.
7. Open evidence artifacts and inspect their contents.
8. Optionally request hints.
9. Select a suspect and submit a final accusation.
10. View the result, explanation, evidence connections, and score.
11. Start a new case or replay with a different premise.
Success criteria
A new user can create a case, inspect evidence, accuse a suspect, and
see the final explanation without instructions from a developer. No
client response or network payload exposes the solution before
resolution.
4. MVP feature requirements
4.1 Landing / case creation
- Show product name, short description, and a clear "Create Mystery"
  call to action.
- Provide a required scenario textarea.
- Scenario length: 30--1,000 characters after trimming.
- Provide difficulty: Easy, Medium, Hard. Default: Medium.
- Provide case length: Short or Standard. Default: Short.
- Show remaining/maximum character count.
- Disable submission for invalid input or while a request is in
  progress.
- Include an accessible error message if generation fails.
- Do not require account creation for MVP.
4.2 Case generation
- Backend calls Gemini using a versioned prompt and a structured
  output schema.
- Generate one fixed culprit, 3--5 suspects, a timeline, 5--8 evidence
  artifacts for Short cases, and 8--12 for Standard cases.
- Easy: obvious but non-trivial evidence links; Medium: multiple
  plausible suspects and contradictions; Hard: subtler connections but
  still solvable from provided evidence.
- Each case must have a consistent timeline, plausible motives,
  alibis, and evidence.
- At least 3 artifacts must be materially useful to reasoning; at
  least 1 artifact should weaken or eliminate a plausible alternative
  suspect.
- At least 2 suspects should initially appear plausible.
- The final culprit must be inferable from evidence available to the
  player; do not make the answer depend on undisclosed facts.
- If model output is invalid, retry once with a repair/strict-format
  prompt. If still invalid, return a safe error and do not create a
  playable case.
- Persist the validated case before returning the public view to the
  client.
- The backend creates a public case ID (MongoDB ObjectId or opaque ID)
  and stores private solution data separately from the public response
  shape.
4.3 Investigation workspace
The main case page must contain: - Case title, fictional label,
difficulty, and incident summary. - Tabs or navigation for Overview,
Suspects, Evidence, and Timeline. - Suspect list with name,
role/relationship, public description, and visible status. - Evidence
gallery/list with artifact type, title, short summary, and
locked/unlocked state. - Evidence detail view/modal with full content
and relevant metadata. - Discovered evidence counter and progress
indicator. - Hint count/usage indicator. - Final accusation action,
visually distinct from ordinary navigation. - Loading, empty, not-found,
expired/unavailable, and server-error states.
4.4 Suspects
- Display 3--5 suspects.
- Public profile includes ID, name, role, public bio, and public
  alibi.
- Do not reveal private motive/secret fields unless the player
  discovers evidence that legitimately reveals them.
- A suspect may be selected for accusation from the suspect list or
  accusation panel.
- Avoid stereotypes or protected-class traits as a shortcut to guilt.
  Suspect attributes must be story-relevant and non-discriminatory.
4.5 Evidence artifacts
Supported MVP artifact types: - chat: fictional chat/message exchange
formatted like a conversation. - image: generated image URL if an
image provider is configured; otherwise an illustrative placeholder with
a text description and accessible alt text. - camera: fictional
security-camera clip representation, which may include a
thumbnail/placeholder, timestamp, duration, and transcript/scene
description. Actual video generation is optional. - document:
fictional note, receipt, report, or other written artifact. -
audio_transcript: fictional transcript of an audio recording. -
physical: description of a physical clue.

Every artifact must include: - Stable ID. - Type. - Title. - In-world
timestamp or "time unknown." - Public description/content. - A short
discovery/inspection state. - Optional media URL and alt text. -
Evidence relevance is private; do not show the relevance explanation
until resolution. - Clear label: "FICTIONAL AI-GENERATED EVIDENCE" or
equivalent on artifact detail and media previews.

Evidence visibility rules: - The initial case may expose all artifacts
as inspectable, or use a small number of locked artifacts that unlock
after a prerequisite clue. MVP default: all generated artifacts are
available from the start to keep game logic simple and fair. - Opening
an artifact marks it as discovered in server-side game state. - The
server, not only the browser, tracks discovered artifacts and hint
usage. - The player can revisit discovered artifacts. - Do not generate
new facts during evidence viewing that contradict the stored case.
4.6 Interrogation (MVP-lite)
- Player can select a suspect and submit a question of 1--300
  characters.
- Backend responds using the stored case facts and a constrained
  Gemini prompt.
- Answers must not disclose the culprit directly, reveal private
  solution fields, or introduce facts that conflict with the case.
- Limit: 5 questions per case in MVP.
- Store question and answer in game state, with timestamps.
- If the model response is unsafe, contradictory, or fails validation,
  return a generic fallback such as: "They cannot provide a clearer
  answer right now. Compare their statement with the evidence."
- If implementing constrained interrogation reliably is too large for
  the first milestone, keep the UI and API contract but return
  pre-authored, case-consistent answers from stored suspect
  statements. Do not block the rest of the game.
4.7 Hints
- Allow up to 3 hints per case.
- Hints are progressive and should point toward evidence rather than
  naming the culprit:
  1. General direction: which timeline or evidence category to
     revisit.
  2. More specific connection between two pieces of evidence.
  3. Strong nudge toward the contradiction or deduction needed.
- Do not reveal the culprit ID/name or full solution in a hint.
- Hints must be based on stored case facts.
- Server validates the hint budget and increments usage atomically
  where practical.
- The result screen shows hints used and includes a score penalty.
4.8 Accusation and resolution
- Player selects exactly one suspect and submits an accusation.
- The server validates that the suspect belongs to the case and that
  the case has not already been resolved.
- Compare the selected suspect ID to the stored culprit ID
  deterministically. Do not use Gemini to judge correctness.
- Once submitted, the accusation is final for that case in MVP.
- Return outcome: correct/incorrect, explanation, key evidence
  references, score, and resolved timestamp.
- Reveal the culprit, the complete solution reasoning, and how each
  key artifact supports or contradicts the theory only after
  accusation.
- Prevent repeat submissions from changing the result.
- A resolved case remains viewable and shows the recorded result.
4.9 Scoring
Score is an integer from 0 to 100. - Base score: 100. - Subtract 15
points per hint used. - Subtract 5 points per interrogation question
used. - Incorrect final accusation: final score is 0. - Correct
accusation: score is
max(0, 100 - (15 * hintsUsed) - (5 * questionsUsed)). - Do not
penalize opening evidence. - Show the scoring breakdown on the result
screen.
4.10 Case lifecycle
States: - generating: server is generating/validating the case; this
state may be transient. - active: player can investigate. -
resolved: accusation has been submitted and outcome stored. -
failed: generation failed; do not persist as an active case.

MVP does not need an account system. Cases are accessed by opaque case
ID. Add a configurable expiry/cleanup strategy for abandoned cases,
default 7 days, without deleting active in-memory request processing.
Access to an opaque ID should not be treated as strong authentication
for highly sensitive information; this app contains fictional data only.
5. UX and visual design
Design direction
A polished detective-noir experience: dark charcoal/navy backgrounds,
warm amber highlights, restrained red accents, readable typography,
subtle borders, evidence-card layouts, and clear hierarchy. Avoid
clutter and excessive animations. Keep it usable and accessible rather
than imitating any real messaging or surveillance service so closely
that generated artifacts could be mistaken for real evidence.
Layout
- Desktop: centered content with a left case navigation/sidebar and
  main content area where appropriate.
- Mobile: single-column layout; navigation becomes tabs or a compact
  menu; evidence cards stack vertically.
- Use a consistent spacing scale and reusable components.
- Use skeleton/loading states during generation and API requests.
- Use toast or inline notifications for recoverable errors.
- Confirm before final accusation because it cannot be changed.
- Add a visible "Fictional case" indicator throughout gameplay.
Required pages/routes
- / --- landing and case creation.
- /case/:caseId --- investigation workspace.
- /case/:caseId/result --- result/solution view; backend must still
  enforce resolved status.
- A not-found route for invalid pages/case IDs.
Accessibility
- Semantic HTML and accessible form labels.
- Keyboard-operable navigation, dialogs, tabs, and accusation
  controls.
- Visible focus states and sufficient color contrast.
- Do not communicate status using color alone.
- Images require alt text; decorative images use empty alt text.
- Respect reduced-motion preferences.
- Error messages should be associated with the relevant input.
6. Technical architecture
Monorepo structure
Use npm workspaces or a simple root with client and server.
ai-mystery-room/
  client/
    src/
      app/
      components/
      features/
        case-creation/
        investigation/
        suspects/
        evidence/
        hints/
        accusation/
      lib/
      pages/
      styles/
      types/
    public/
    package.json
    vite.config.ts
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
        gemini/
        case-generation/
        game-state/
        scoring/
      validators/
      prompts/
      app.ts
      server.ts
    tests/
    package.json
  shared/
    schemas/
    types/
  .env.example
  .gitignore
  package.json
  README.md
  SPEC.md
The precise file layout can change if the resulting separation of
concerns is maintained.
Frontend
- React with TypeScript and Vite.
- React Router for routes.
- Use a consistent component styling system; Tailwind CSS is
  recommended, but CSS Modules or plain CSS are acceptable if used
  consistently.
- Use a typed API client for backend requests.
- Keep server data separate from local presentation state.
- Do not store secrets in the frontend.
- Do not trust client-supplied score, hint count, question count,
  culprit ID, or case solution.
Backend
- Node.js with TypeScript and Express.
- Mongoose for MongoDB persistence.
- Use Zod (or an equivalent runtime schema validator) for request
  bodies and Gemini output.
- Centralized error middleware.
- Request size limits, rate limiting, security headers, and CORS
  allowlist.
- Keep Gemini prompts and API credentials on the server.
- Use a service layer so controllers do not contain game rules or
  model prompts.
Database
MongoDB stores validated cases and player state. Use environment-based
connection configuration. Define indexes for case ID, state, and expiry
where appropriate. Do not log API keys or full hidden solution payloads.
Gemini integration
- Use the current official Google Gen AI SDK for Node.js and a
  configurable model name from environment variables.
- Do not hardcode a model version in source code.
- Use structured output / JSON schema support where available,
  followed by independent server-side validation.
- Set timeouts and handle quota errors, rate limits, unavailable
  models, malformed output, and safety refusals.
- Keep prompts versioned in source control.
- Set temperature conservatively for consistent structured mystery
  generation.
- Treat all user scenario text and model-generated text as untrusted
  data.
- Do not put user scenario text into system/developer instructions.
  Pass it as clearly delimited data.
- Avoid logging raw user prompts or private case solution unless
  needed for local development and explicitly enabled.
- Gemini may generate image prompts/descriptions, but binary
  image/video creation requires a separately configured supported
  media provider. The MVP must work without that provider.
7. Data model
Use TypeScript types and MongoDB schemas. The following is the
conceptual contract; implementation may add timestamps and internal
fields but must not weaken privacy boundaries.
Case document (server-private)
type Difficulty = "easy" | "medium" | "hard";
type CaseLength = "short" | "standard";
type CaseStatus = "active" | "resolved";

interface MysteryCase {
  _id: ObjectId;
  title: string;
  difficulty: Difficulty;
  length: CaseLength;
  premise: string;
  setting: string;
  incident: string;
  timeline: Array<{
    id: string;
    timestamp: string;
    event: string;
  }>;
  suspects: Array<{
    id: string;
    name: string;
    role: string;
    publicBio: string;
    publicAlibi: string;
    privateMotive: string;
    privateSecret?: string;
    statement: string;
  }>;
  evidence: Array<{
    id: string;
    type: "chat" | "image" | "camera" | "document" | "audio_transcript" | "physical";
    title: string;
    timestamp?: string;
    content: string;
    mediaUrl?: string;
    altText?: string;
    relevance: string;
    implicatesSuspectIds: string[];
    contradictsSuspectIds: string[];
  }>;
  solution: {
    culpritId: string;
    summary: string;
    reasoning: string;
    keyEvidenceIds: string[];
    suspectEliminations: Array<{
      suspectId: string;
      explanation: string;
    }>;
  };
  promptVersion: string;
  schemaVersion: number;
  createdAt: Date;
  expiresAt: Date;
}
Game session document
interface GameSession {
  _id: ObjectId;
  caseId: ObjectId;
  status: "active" | "resolved";
  discoveredEvidenceIds: string[];
  hintsUsed: number;
  questionsUsed: number;
  interrogation: Array<{
    suspectId: string;
    question: string;
    answer: string;
    createdAt: Date;
  }>;
  accusation?: {
    suspectId: string;
    correct: boolean;
    score: number;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}
Public API response separation
Never serialize MysteryCase directly. Build explicit response DTOs: -
PublicCaseDTO: title, difficulty, premise, setting, incident, public
timeline, public suspect fields, public evidence fields, status,
counts. - PublicEvidenceDTO: ID, type, title, timestamp, content,
media URL, alt text, discovered state, fictional label. -
PublicResultDTO: culprit ID/name, full reasoning, key evidence
explanations, suspect eliminations, score breakdown; returned only after
resolution. - GameStateDTO: status, discovered evidence IDs, hint
usage, question usage, and accusation state. - Never include solution,
privateMotive, privateSecret, relevance, implicatesSuspectIds,
or contradictsSuspectIds in active-case responses.

For MVP, each generated case has one game session. Keep the data model
extensible to multiple sessions per case, but do not build sharing or
multiplayer unless requested.
8. API contract
All endpoints are prefixed with /api. Use JSON requests and responses.
Return consistent error envelopes.
Success/error format
interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}
POST /api/cases
Request:
{
  "scenario": "A rare painting disappears during a private gallery event.",
  "difficulty": "medium",
  "length": "short"
}
Validation: scenario 30--1,000 characters after trimming; valid enum
values only.

Success 201:
{
  "caseId": "opaque-id",
  "sessionId": "opaque-id",
  "case": { "title": "...", "difficulty": "medium", "setting": "...", "incident": "...", "suspects": [], "evidence": [], "timeline": [] },
  "gameState": { "status": "active", "discoveredEvidenceIds": [], "hintsUsed": 0, "questionsUsed": 0 }
}
The response must contain only public DTOs.
GET /api/cases/:caseId
Returns public case and current game state. 404 CASE_NOT_FOUND for
unknown or expired IDs.
POST /api/cases/:caseId/evidence/:evidenceId/open
Marks the evidence as discovered on the server and returns the public
evidence detail plus updated state. If all evidence is visible from the
start, this endpoint still records discovery and supports progress
tracking.
POST /api/cases/:caseId/hints
Request: {}. Success:
{ "hint": { "index": 1, "text": "..." }, "gameState": { ... } }.
Return 409 HINT_LIMIT_REACHED after 3 hints or if case is resolved. A
hint index must not be client-controlled.
POST /api/cases/:caseId/interrogate
Request:
{ "suspectId": "s1", "question": "Why did you leave the gallery?" }.
Validate question length 1--300, suspect belongs to case, case active,
and question budget below 5. Success:
{ "suspectId": "s1", "answer": "...", "gameState": { ... } }.
POST /api/cases/:caseId/accuse
Request: { "suspectId": "s1" }. Success:
{
  "result": {
    "correct": true,
    "culprit": { "id": "s1", "name": "..." },
    "summary": "...",
    "reasoning": "...",
    "keyEvidence": [],
    "suspectEliminations": [],
    "score": 85,
    "scoreBreakdown": {
      "base": 100,
      "hintPenalty": 15,
      "questionPenalty": 0,
      "incorrectAccusationPenalty": 0,
      "final": 85
    }
  },
  "gameState": { "status": "resolved" }
}
Return the result only once the server has persisted resolution.
Repeated requests return the stored result and cannot change the
original accusation. An invalid suspect ID returns
400 INVALID_SUSPECT.
GET /api/cases/:caseId/result
- 409 CASE_NOT_RESOLVED while active.
- 200 with stored public result when resolved.
API error codes
Use stable codes including: - VALIDATION_ERROR - CASE_NOT_FOUND -
CASE_NOT_RESOLVED - CASE_ALREADY_RESOLVED - HINT_LIMIT_REACHED -
QUESTION_LIMIT_REACHED - INVALID_SUSPECT - INVALID_EVIDENCE -
GENERATION_FAILED - AI_PROVIDER_UNAVAILABLE - RATE_LIMITED -
INTERNAL_ERROR
9. Gemini prompt and generation requirements
Maintain prompts in versioned files, for example
server/src/prompts/mystery-v1.ts.
Generation prompt must require
- A self-contained fictional mystery based only on the supplied
  premise plus reasonable fictional additions.
- 3--5 distinct suspects.
- One and only one culprit ID, matching a generated suspect.
- A coherent chronology with explicit times or clear relative
  ordering.
- Evidence artifacts that are internally consistent.
- Multiple plausible suspects.
- Evidence that logically supports the culprit and rules out
  alternatives.
- A solution explainable solely through evidence shown to the player.
- No contradictory facts unless the contradiction itself is an
  intentional clue and is explained in the private solution.
- No private solution fields in public descriptions.
- No real personal data, real accusations, or claims that generated
  artifacts are authentic.
- JSON matching the exact schema.
Post-generation validation
Reject or repair output when: - Required fields are missing. - IDs are
duplicated or references point to nonexistent suspects/evidence. - The
culprit ID is not a valid suspect. - Suspect/evidence counts violate the
chosen case length. - The key evidence IDs are invalid. - Timeline and
evidence timestamps are obviously inconsistent. - The explanation relies
on evidence not included in the public case. - Public fields disclose
the culprit or private solution. - Text is empty, excessively long, or
contains malformed data.

Do not rely on a second model call as the only validation mechanism. Use
deterministic schema and referential-integrity checks.
10. Security, privacy, and abuse prevention
- Store GEMINI_API_KEY only in server environment variables.
- Never expose environment variables through Vite client prefixes or
  API responses.
- Add rate limiting to case creation, hints, and interrogation.
- Validate all route params, query params, and request bodies.
- Use Helmet or equivalent security headers.
- Configure CORS to allow only configured frontend origins in
  production.
- Set JSON body size limits.
- Sanitize/render user and model text as text; do not inject arbitrary
  model HTML.
- Do not execute model output, generated code, or HTML.
- Restrict media URLs to trusted provider/storage hosts; validate
  content type and size if uploads are ever added.
- Do not accept real chat logs, camera footage, or third-party account
  credentials in MVP.
- Clearly label all evidence and media as fictional and AI-generated.
- Do not store unnecessary personal data.
- Do not log API keys, full private solution objects, or sensitive
  request headers.
- Add a MongoDB TTL index or scheduled cleanup for expired
  cases/sessions, with documented limitations.
- Production errors must not reveal stack traces or secrets.
11. Error and loading behavior
- Case generation: show a progress indicator and explanatory status;
  prevent duplicate submission.
- Gemini quota/timeout: show a friendly retry message; preserve the
  scenario in the form.
- Invalid model output: retry once server-side, then return
  GENERATION_FAILED.
- MongoDB unavailable: return controlled 503 response.
- Invalid/expired case ID: show a not-found page with a route back to
  create a case.
- Hint/question limit reached: explain the limit and allow continued
  evidence review.
- Duplicate accusation: return the already-stored result.
- Network error: show a retry action without silently resetting the
  case.
- Never show raw stack traces or provider responses to the user.
12. Testing requirements
Unit tests
- Scenario and API validation.
- Gemini output schema validation and referential integrity.
- Public DTO excludes private fields.
- Score calculation for zero, one, and three hints; question
  penalties; incorrect accusation.
- Hint and question limits.
- Deterministic accusation checking.
- Case lifecycle transitions.
Integration tests
- Create case with Gemini mocked.
- Invalid Gemini response is retried and then fails safely.
- Fetch case never exposes solution fields.
- Open evidence updates state.
- Hint endpoint respects budget.
- Interrogation respects question budget and suspect membership.
- Accusation resolves correctly and persists result.
- Result endpoint rejects active cases.
- Expired or missing case returns correct error.
- Provider/database failures return stable error envelopes.
End-to-end tests
At least one Playwright or equivalent flow: 1. Open home page. 2. Enter
a valid premise and create a case. 3. Verify suspects and evidence are
displayed. 4. Open evidence and request a hint. 5. Submit an accusation.
6. Verify the result page and explanation. 7. Confirm a private solution
is not present in pre-accusation network responses.
Quality gates
- TypeScript typecheck passes.
- Lint passes.
- Unit/integration tests pass.
- Production client build passes.
- No secrets are committed.
- README setup instructions work on a clean checkout.
13. Environment variables
Create .env.example with placeholders only:
# Server
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai_mystery_room
GEMINI_API_KEY=
GEMINI_MODEL=
CASE_TTL_DAYS=7
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=30

# Client
VITE_API_BASE_URL=http://localhost:4000/api
Use a currently supported Gemini model configured through
GEMINI_MODEL; verify the model name against current Google
documentation during implementation. Do not commit a real key. Validate
required environment variables at server startup and fail fast with a
clear developer-facing message.
14. Local development and scripts
Root scripts should support: - npm install - npm run dev --- run
client and server concurrently. - npm run build --- build production
client and compile server. - npm run lint - npm run typecheck -
npm test - npm run test:e2e (if E2E tooling is configured)

Document separate commands if a workspace setup makes these names
impractical. Include MongoDB local setup or a hosted MongoDB Atlas
option.
15. Deployment requirements
- Deploy React frontend to a static hosting platform.
- Deploy Express API to a Node-compatible host.
- Use managed MongoDB or MongoDB Atlas for production.
- Configure GEMINI_API_KEY, GEMINI_MODEL, MONGODB_URI,
  CLIENT_ORIGIN, and VITE_API_BASE_URL in the appropriate
  deployment environments.
- Use HTTPS.
- Restrict CORS to the deployed frontend origin.
- Verify health endpoint, database connectivity, case generation,
  evidence browsing, hints, accusation, and result retrieval on the
  live deployment.
- Provide a health route such as GET /api/health returning service
  status without secrets.
- Document deployment steps and rollback/redeployment process in
  README.
- Do not claim deployment is complete until the public URL has been
  tested end-to-end.
16. Definition of done
The MVP is done only when all conditions are met: 1. A user can enter a
premise and create a valid case. 2. The case includes 3--5 suspects and
the required number of evidence artifacts. 3. Evidence types include
chat, document, physical clue, and camera representation; image
artifacts work with generated media or the documented fallback. 4. All
evidence is clearly labeled fictional. 5. Investigation state is
persisted in MongoDB. 6. Hints and interrogation obey server-enforced
limits. 7. The culprit and solution remain private before accusation. 8.
Accusation is checked deterministically on the server. 9. The result
explains the correct solution using evidence shown in the case. 10. All
score rules are tested. 11. Responsive layout and accessibility basics
are implemented. 12. Unit/integration tests and production build pass.
13. .env.example and README are complete. 14. The deployed website
completes the full user journey without critical errors.
17. Implementation order for Codex
Implement in this order and keep each phase buildable:

Phase 1 --- Foundation - Inspect repository; preserve useful
existing code. - Create client/server/shared structure with
TypeScript. - Add formatting, lint, typecheck, environment validation,
and health endpoint. - Add README and .env.example.

Phase 2 --- Data contracts and game logic - Define shared
schemas/types. - Implement MongoDB models and public DTO mappers. -
Implement scoring, lifecycle transitions, and privacy tests before
integrating Gemini.

Phase 3 --- Gemini case generation - Add versioned prompt and
structured generation. - Validate, repair once, and persist
case/session. - Add mocked integration tests.

Phase 4 --- API - Implement case retrieval, evidence discovery,
hints, interrogation, accusation, and result endpoints. - Add
validation, rate limits, error middleware, and tests.

Phase 5 --- Frontend - Implement landing page, case creation,
investigation workspace, suspect/evidence views, hints, interrogation,
accusation confirmation, and result page. - Connect typed API client and
handle loading/error states.

Phase 6 --- Verification - Run lint, typecheck, tests, and
production build. - Run E2E scenario. - Inspect network responses to
ensure private fields never leak. - Fix all critical issues before
deployment.

Phase 7 --- Deployment - Deploy backend, database, and frontend. -
Configure secrets in hosting dashboards. - Test the live user journey
and record the public URL in README.
18. Instructions to Codex
Read this entire SPEC.md before changing code. Treat it as the product
and engineering source of truth. First inspect the repository and report
a concise implementation plan. Then implement the phases in order
without stopping after generating a plan. Prefer simple, maintainable
code over unnecessary abstractions. Do not leave core flows as mockups
or TODOs. If a real external service is unavailable, provide a
documented local fallback and keep the integration boundary
production-ready. Do not fabricate successful test or deployment
results. After each phase, run relevant checks and fix failures. At
completion, summarize implemented features, commands run and their
actual outcomes, required environment variables, and remaining
limitations.