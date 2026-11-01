import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type Tab = 'overview' | 'suspects' | 'evidence' | 'timeline';

type CaseResponse = {
  case: {
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    premise: string;
    setting: string;
    incident: string;
    timeline: Array<{ id: string; timestamp: string; event: string }>;
    suspects: Array<{ id: string; name: string; role: string; publicBio: string; publicAlibi: string; statement: string }>;
    evidence: Array<{
      id: string;
      type: string;
      title: string;
      timestamp?: string;
      content: string;
      mediaUrl?: string;
      altText?: string;
      discovered: boolean;
      fictionalLabel: string;
    }>;
    status: string;
    counts: { suspects: number; evidence: number; discovered: number };
  };
  gameState: {
    status: string;
    discoveredEvidenceIds: string[];
    hintsUsed: number;
    questionsUsed: number;
    accusation?: { suspectId: string; correct: boolean; score: number; submittedAt: string };
  };
};

type ResultResponse = {
  result: {
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
  };
  gameState: { status: string; discoveredEvidenceIds: string[]; hintsUsed: number; questionsUsed: number };
};

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    },
    ...options
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = data?.error?.message ?? 'Request failed';
    throw new Error(message);
  }

  return data as T;
}

function HomePage() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('A rare painting disappears during a private gallery event.');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [length, setLength] = useState<'short' | 'standard'>('short');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (scenario.trim().length < 30 || scenario.trim().length > 1000) {
      setError('Scenario must be between 30 and 1000 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ caseId: string; sessionId: string; case: unknown; gameState: unknown }>('/cases', {
        method: 'POST',
        body: JSON.stringify({ scenario: scenario.trim(), difficulty, length })
      });
      navigate(`/case/${data.caseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create a case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell">
      <section className="card hero-card">
        <p className="eyebrow">Fictional investigation game</p>
        <h1>AI Mystery Room</h1>
        <p className="lead">
          Build a mystery from any premise, inspect the clues, and identify the culprit before the case is solved.
        </p>

        <form className="case-form" onSubmit={handleSubmit}>
          <label htmlFor="scenario">Scenario</label>
          <textarea
            id="scenario"
            rows={6}
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            minLength={30}
            maxLength={1000}
          />
          <div className="field-meta">
            <span>{scenario.trim().length}/1000</span>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="difficulty">Difficulty</label>
              <select id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as 'easy' | 'medium' | 'hard')}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label htmlFor="length">Case Length</label>
              <select id="length" value={length} onChange={(event) => setLength(event.target.value as 'short' | 'standard')}>
                <option value="short">Short</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          <button type="submit" disabled={loading}>{loading ? 'Creating case...' : 'Create Mystery'}</button>
        </form>
      </section>
    </main>
  );
}

function CasePage() {
  const navigate = useNavigate();
  const { caseId } = useParams();
  const [tab, setTab] = useState<Tab>('overview');
  const [caseData, setCaseData] = useState<CaseResponse['case'] | null>(null);
  const [gameState, setGameState] = useState<CaseResponse['gameState'] | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [hintText, setHintText] = useState('');
  const [interrogationLog, setInterrogationLog] = useState<Array<{ suspectId: string; question: string; answer: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedEvidence = useMemo(
    () => caseData?.evidence.find((item) => item.id === selectedEvidenceId) ?? caseData?.evidence[0] ?? null,
    [caseData, selectedEvidenceId]
  );

  const selectedSuspect = useMemo(
    () => caseData?.suspects.find((item) => item.id === selectedSuspectId) ?? caseData?.suspects[0] ?? null,
    [caseData, selectedSuspectId]
  );

  const fetchCase = async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const data = await apiFetch<CaseResponse>(`/cases/${caseId}`);
      setCaseData(data.case);
      setGameState(data.gameState);
      setSelectedEvidenceId(data.case.evidence[0]?.id ?? null);
      setSelectedSuspectId(data.case.suspects[0]?.id ?? null);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load the case.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const handleOpenEvidence = async (evidenceId: string) => {
    if (!caseId) return;
    try {
      const response = await apiFetch<{ evidence: { id: string; discovered: boolean }; gameState: CaseResponse['gameState'] }>(`/cases/${caseId}/evidence/${evidenceId}/open`, {
        method: 'POST'
      });
      setGameState(response.gameState);
      setSelectedEvidenceId(evidenceId);
      if (caseData) {
        setCaseData({
          ...caseData,
          evidence: caseData.evidence.map((item) =>
            item.id === evidenceId ? { ...item, discovered: true } : item
          )
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open evidence.');
    }
  };

  const handleHint = async () => {
    if (!caseId) return;
    try {
      const data = await apiFetch<{ hint: { index: number; text: string }; gameState: CaseResponse['gameState'] }>('/cases/' + caseId + '/hints', {
        method: 'POST'
      });
      setHintText(data.hint.text);
      setGameState(data.gameState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hint unavailable.');
    }
  };

  const handleInterrogate = async () => {
    if (!caseId || !selectedSuspectId || !questionText.trim()) return;
    try {
      const data = await apiFetch<{ suspectId: string; answer: string; gameState: CaseResponse['gameState'] }>('/cases/' + caseId + '/interrogate', {
        method: 'POST',
        body: JSON.stringify({ suspectId: selectedSuspectId, question: questionText.trim() })
      });
      setInterrogationLog((current) => [
        ...current,
        { suspectId: data.suspectId, question: questionText.trim(), answer: data.answer }
      ]);
      setQuestionText('');
      setGameState(data.gameState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to interrogate suspect.');
    }
  };

  const handleAccuse = async () => {
    if (!caseId || !selectedSuspectId) return;
    try {
      const data = await apiFetch<{ result: ResultResponse['result']; gameState: CaseResponse['gameState'] }>('/cases/' + caseId + '/accuse', {
        method: 'POST',
        body: JSON.stringify({ suspectId: selectedSuspectId })
      });
      setGameState(data.gameState);
      navigate(`/case/${caseId}/result`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit accusation.');
    }
  };

  if (loading) {
    return <div className="page-shell"><div className="card loading-card">Loading case...</div></div>;
  }

  if (!caseData || error && !gameState) {
    return <div className="page-shell"><div className="card loading-card">{error || 'Case not found.'}</div></div>;
  }

  return (
    <main className="page-shell case-page-shell">
      <div className="topbar card">
        <div>
          <p className="eyebrow">Fictional case</p>
          <h2>{caseData.title}</h2>
        </div>
        <div className="stats-strip">
          <span>Difficulty: {caseData.difficulty}</span>
          <span>Evidence: {caseData.counts.discovered}/{caseData.counts.evidence}</span>
          <span>Hints: {gameState?.hintsUsed ?? 0}/3</span>
          <span>Questions: {gameState?.questionsUsed ?? 0}/5</span>
        </div>
      </div>

      <div className="workspace-grid">
        <aside className="card sidebar">
          <h3>Investigation</h3>
          <nav className="tab-nav">
            {(['overview', 'suspects', 'evidence', 'timeline'] as Tab[]).map((item) => (
              <button key={item} className={tab === item ? 'tab active' : 'tab'} onClick={() => setTab(item)}>
                {item[0].toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>

          <div className="sidebar-section">
            <h4>Suspects</h4>
            {caseData.suspects.map((suspect) => (
              <button
                key={suspect.id}
                className={selectedSuspectId === suspect.id ? 'suspect-list-item active' : 'suspect-list-item'}
                onClick={() => setSelectedSuspectId(suspect.id)}
              >
                {suspect.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="card content-panel">
          {error ? <div className="error-box">{error}</div> : null}

          {tab === 'overview' ? (
            <div>
              <h3>Case overview</h3>
              <p className="incident-summary">{caseData.incident}</p>
              <div className="overview-grid">
                <div>
                  <h4>Setting</h4>
                  <p>{caseData.setting}</p>
                </div>
                <div>
                  <h4>Premise</h4>
                  <p>{caseData.premise}</p>
                </div>
              </div>
              <div className="panel-box">
                <h4>Selected suspect</h4>
                {selectedSuspect ? (
                  <>
                    <p><strong>{selectedSuspect.name}</strong> — {selectedSuspect.role}</p>
                    <p>{selectedSuspect.publicBio}</p>
                    <p><em>Public alibi:</em> {selectedSuspect.publicAlibi}</p>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === 'suspects' ? (
            <div>
              <h3>Suspects</h3>
              <div className="suspect-list">
                {caseData.suspects.map((suspect) => (
                  <article key={suspect.id} className={selectedSuspectId === suspect.id ? 'suspect-card active' : 'suspect-card'}>
                    <div className="suspect-header">
                      <h4>{suspect.name}</h4>
                      <button className="mini-button" onClick={() => setSelectedSuspectId(suspect.id)}>Select</button>
                    </div>
                    <p><strong>{suspect.role}</strong></p>
                    <p>{suspect.publicBio}</p>
                    <p><em>Alibi:</em> {suspect.publicAlibi}</p>
                    <p><em>Statement:</em> {suspect.statement}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {tab === 'evidence' ? (
            <div>
              <h3>Evidence</h3>
              <div className="evidence-list">
                {caseData.evidence.map((item) => (
                  <button key={item.id} className={selectedEvidenceId === item.id ? 'evidence-card active' : 'evidence-card'} onClick={() => { setSelectedEvidenceId(item.id); if (!item.discovered) handleOpenEvidence(item.id); }}>
                    <div className="evidence-meta">
                      <span>{item.type}</span>
                      <span>{item.discovered ? 'Discovered' : 'Locked'}</span>
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.content.slice(0, 120)}{item.content.length > 120 ? '…' : ''}</p>
                  </button>
                ))}
              </div>

              {selectedEvidence ? (
                <div className="panel-box evidence-detail">
                  <div className="panel-head">
                    <h4>{selectedEvidence.title}</h4>
                    <span>{selectedEvidence.fictionalLabel}</span>
                  </div>
                  <p className="meta-line">{selectedEvidence.type} • {selectedEvidence.timestamp ?? 'Time unknown'}</p>
                  <p>{selectedEvidence.content}</p>
                  {selectedEvidence.mediaUrl ? <img src={selectedEvidence.mediaUrl} alt={selectedEvidence.altText ?? selectedEvidence.title} className="evidence-image" /> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'timeline' ? (
            <div>
              <h3>Timeline</h3>
              <ul className="timeline-list">
                {caseData.timeline.map((event) => (
                  <li key={event.id} className="timeline-item">
                    <span>{event.timestamp}</span>
                    <p>{event.event}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <div className="bottom-panel card">
        <div className="action-group">
          <button onClick={handleHint} disabled={(gameState?.hintsUsed ?? 0) >= 3 || gameState?.status === 'resolved'}>Request hint</button>
          {hintText ? <div className="hint-box">{hintText}</div> : null}
        </div>

        <div className="action-group interrogate-box">
          <h4>Interrogate suspect</h4>
          <div className="question-form">
            <select value={selectedSuspectId ?? ''} onChange={(event) => setSelectedSuspectId(event.target.value)}>
              {caseData.suspects.map((suspect) => (
                <option key={suspect.id} value={suspect.id}>{suspect.name}</option>
              ))}
            </select>
            <input value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="Ask a question..." maxLength={300} />
            <button onClick={handleInterrogate} disabled={(gameState?.questionsUsed ?? 0) >= 5}>Ask</button>
          </div>
          <div className="log-list">
            {interrogationLog.map((entry, index) => (
              <div key={`${entry.suspectId}-${index}`} className="log-item">
                <strong>Q:</strong> {entry.question}
                <div><strong>A:</strong> {entry.answer}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="action-group accuse-box">
          <h4>Final accusation</h4>
          <select value={selectedSuspectId ?? ''} onChange={(event) => setSelectedSuspectId(event.target.value)}>
            {caseData.suspects.map((suspect) => (
              <option key={suspect.id} value={suspect.id}>{suspect.name}</option>
            ))}
          </select>
          <button className="danger-button" onClick={handleAccuse}>Accuse selected suspect</button>
        </div>
      </div>
    </main>
  );
}

function ResultPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultResponse['result'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResult() {
      if (!caseId) return;
      try {
        const data = await apiFetch<ResultResponse>(`/cases/${caseId}/result`);
        setResult(data.result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Result not available.');
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [caseId]);

  if (loading) return <div className="page-shell"><div className="card loading-card">Loading result...</div></div>;
  if (!result) return <div className="page-shell"><div className="card loading-card">{error || 'No result found.'}</div></div>;

  return (
    <main className="page-shell result-page">
      <div className="card result-card">
        <p className="eyebrow">Case resolved</p>
        <h2>{result.correct ? 'Correct accusation!' : 'Not this time'}</h2>
        <p className="result-summary">{result.summary}</p>
        <div className="score-box">
          <strong>Final score: {result.score}</strong>
          <span>Base: {result.scoreBreakdown.base}</span>
          <span>Hint penalty: {result.scoreBreakdown.hintPenalty}</span>
          <span>Question penalty: {result.scoreBreakdown.questionPenalty}</span>
        </div>

        <div className="panel-box">
          <h4>Reasoning</h4>
          <p>{result.reasoning}</p>
        </div>

        <div className="panel-box">
          <h4>Key evidence</h4>
          <ul>
            {result.keyEvidence.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong> — {item.explanation}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel-box">
          <h4>Suspect eliminations</h4>
          <ul>
            {result.suspectEliminations.map((item) => (
              <li key={item.suspectId}>{item.explanation}</li>
            ))}
          </ul>
        </div>

        <div className="action-row">
          <button onClick={() => navigate('/')}>Start another case</button>
        </div>
      </div>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="card loading-card">
        <h2>Page not found</h2>
        <Link to="/">Return home</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/case/:caseId" element={<CasePage />} />
      <Route path="/case/:caseId/result" element={<ResultPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
