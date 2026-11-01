import type { CaseLength, Difficulty, EvidenceArtifact, MysteryCase, Suspect } from '../types.js';

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function generateMockMysteryCase(
  scenario: string,
  difficulty: Difficulty,
  length: CaseLength
): MysteryCase {
  const suspects: Suspect[] = [
    {
      id: 's1',
      name: 'Ava Rowan',
      role: 'Curator',
      publicBio: 'Ava manages the gallery archive and monitors visitor access during events.',
      publicAlibi: 'She was overseeing the donor lounge and speaking with volunteers until the theft was reported.',
      privateMotive: 'Ava had been quietly borrowing money to cover a past tax debt and feared the gallery would expose her accounting mistakes.',
      privateSecret: 'She previously altered a donor ledger to hide unpaid invoices.',
      statement: 'I kept the gallery secure, but I was under immense pressure after the accounting review.'
    },
    {
      id: 's2',
      name: 'Nolan Price',
      role: 'Security Lead',
      publicBio: 'Nolan supervises event security and protocol around the main exhibits.',
      publicAlibi: 'He spent the evening on the west entrance patrol and checked cameras before the alarm sounded.',
      privateMotive: 'He had been offered a promotion contingent on a clean audit and wanted to eliminate a rival insider whispering about his record.',
      privateSecret: 'He had been falsifying nightly incident logs to hide a prior breach.',
      statement: 'My team was stretched thin, but I never stopped watching the gallery floor.'
    },
    {
      id: 's3',
      name: 'Iris Hale',
      role: 'Art Restorer',
      publicBio: 'Iris restores old canvases and had been working on a portrait in the private wing.',
      publicAlibi: 'She was in the restoration studio, comparing pigment samples after a late morning appointment.',
      privateMotive: 'She had been quietly researching the painting’s provenance and believed it was stolen from her family years ago.',
      privateSecret: 'She had a notebook containing sketches of the missing forgery’s hidden markings.',
      statement: 'I am invested in old works, but the theft was not part of my plan.'
    },
    {
      id: 's4',
      name: 'Marcus Bell',
      role: 'Collector Liaison',
      publicBio: 'Marcus handles wealthy collectors and the donor guest list for exclusive previews.',
      publicAlibi: 'He was greeting donors and checking arrivals in the atrium, never leaving the public floor.',
      privateMotive: 'He wanted to pressure the gallery into financing a failing venture tied to a wealthy patron.',
      privateSecret: 'He had signed a side deal to move a duplicate painting without permission.',
      statement: 'I was in the atrium all night, with guests and paperwork in hand.'
    }
  ];

  const culpritId = 's1';
  const evidence: EvidenceArtifact[] = [
    {
      id: 'e1',
      type: 'document',
      title: 'Donation ledger excerpt',
      timestamp: '2025-04-19T19:15:00Z',
      content: 'A handwritten notation beside a donor entry reads: “A.R. settle ledger before audit.” The initials match Ava Rowan’s signature on the museum’s bookkeeping sheet.',
      mediaUrl: undefined,
      altText: undefined,
      relevance: 'This shows Ava was hiding financial pressure and created a motive tied to the gallery.',
      implicatesSuspectIds: ['s1'],
      contradictsSuspectIds: ['s2', 's4']
    },
    {
      id: 'e2',
      type: 'camera',
      title: 'Security clip from north corridor',
      timestamp: '2025-04-19T20:42:00Z',
      content: 'The hallway camera catches a figure in a charcoal overcoat slipping from the gallery wing with a wrapped frame. The person is short enough to match Ava’s height and is seen ducking under the maintenance sign.',
      mediaUrl: 'https://images.example.com/fictional-camera-clip.jpg',
      altText: 'Fictional security footage placeholder showing a person leaving a hallway with a wrapped frame.',
      relevance: 'The footage places the thief in the gallery after the public event ended.',
      implicatesSuspectIds: ['s1'],
      contradictsSuspectIds: ['s3', 's4']
    },
    {
      id: 'e3',
      type: 'chat',
      title: 'Private chat transcript',
      timestamp: '2025-04-19T19:00:00Z',
      content: 'Ava: “If the audit catches the ledger, I lose everything.”\nManager: “We need this resolved before the collectors arrive.”\nAva: “Then keep the room clear. I’ll handle the item tonight.”',
      mediaUrl: undefined,
      altText: undefined,
      relevance: 'The exchange reveals Ava had arranged access to the painting just before the heist.',
      implicatesSuspectIds: ['s1'],
      contradictsSuspectIds: ['s2', 's3']
    },
    {
      id: 'e4',
      type: 'physical',
      title: 'Stone dust and scuff marks',
      timestamp: '2025-04-19T20:45:00Z',
      content: 'A trail of dust and a small scuff mark leads from the donor lounge to the service passage. The trail matches the type used in Ava’s restored antique display cases.',
      mediaUrl: undefined,
      altText: undefined,
      relevance: 'This physically ties the route of the theft to Ava’s access zone.',
      implicatesSuspectIds: ['s1'],
      contradictsSuspectIds: ['s2', 's4']
    },
    {
      id: 'e5',
      type: 'audio_transcript',
      title: 'Audio transcript from the service hall',
      timestamp: '2025-04-19T20:39:00Z',
      content: 'Voice 1: “Keep the lights low. The donors are still in the atrium.”\nVoice 2: “I have the case number. Don’t let anyone near the archive door.”\nVoice 1: “I know exactly where to take it.”',
      mediaUrl: undefined,
      altText: undefined,
      relevance: 'The voices reference urgent access controls and imply Ava’s role in directing the theft.',
      implicatesSuspectIds: ['s1'],
      contradictsSuspectIds: ['s3', 's4']
    },
    {
      id: 'e6',
      type: 'image',
      title: 'Fictional gallery plan with annotations',
      timestamp: '2025-04-19T18:50:00Z',
      content: 'The annotated gallery map highlights a hidden service route that only the archive manager could access after hours, and the arrows lead straight to the donor lounge exit.',
      mediaUrl: 'https://images.example.com/fictional-gallery-map.png',
      altText: 'Fictional labeled floorplan with hidden service route highlighted.',
      relevance: 'The layout confirms Ava had the exact route and timing needed to make the theft vanish.',
      implicatesSuspectIds: ['s1'],
      contradictsSuspectIds: ['s2', 's4']
    }
  ];

  const timeline = [
    { id: 't1', timestamp: '2025-04-19T18:30:00Z', event: 'The gallery opens for the donor preview and attendees gather in the atrium.' },
    { id: 't2', timestamp: '2025-04-19T19:05:00Z', event: 'Ava signals the staff to keep the archive corridor clear for a quiet handoff.' },
    { id: 't3', timestamp: '2025-04-19T20:12:00Z', event: 'The missing painting is noticed missing from the north wall display.' },
    { id: 't4', timestamp: '2025-04-19T20:38:00Z', event: 'The corridor camera captures a wrapped frame leaving the gallery through the service route.' },
    { id: 't5', timestamp: '2025-04-19T20:55:00Z', event: 'The donor lounge staff confirm Ava was the last person with direct access to the archive records.' }
  ];

  const title = `${toTitleCase(scenario.split(' ').slice(0, 3).join(' '))} Mystery`;

  return {
    _id: crypto.randomUUID(),
    title,
    difficulty,
    length,
    premise: scenario,
    setting: 'The Grand Meridian Gallery, a high-security exhibition hall during a private charity preview.',
    incident: 'A rare painting disappears during an exclusive event, and investigators must determine who would have had the access, motive, and timing to hide it.',
    timeline,
    suspects,
    evidence,
    solution: {
      culpritId,
      summary: 'Ava Rowan orchestrated the theft using her access to the archive, her financial pressure, and the route that only she could direct.',
      reasoning: 'The financial ledger, whispered access arrangements, service route, and corridor footage all align around Ava. The conflicting stories of other suspects do not explain the hidden route and bookkeeping pressure as directly as Ava does.',
      keyEvidenceIds: ['e1', 'e3', 'e5'],
      suspectEliminations: [
        { suspectId: 's2', explanation: 'Nolan’s patrol record places him at the entry points, but his timeline does not explain the access route or the private ledger pressure.' },
        { suspectId: 's3', explanation: 'Iris was in the restoration wing and had a motive linked to provenance, but no evidence ties her to the service corridor or access controls.' },
        { suspectId: 's4', explanation: 'Marcus stayed in the atrium and dealt with donors, which contradicts the archive access and service-route movement.' }
      ]
    },
    promptVersion: 'mystery-v1',
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
  };
}
