# AI Mystery Room

AI Mystery Room is a detective mystery game where a player enters a story premise, the server generates a fictional case, and the player investigates suspects and evidence to identify the culprit.

## Features

- Landing page for case creation
- Adjustable difficulty and case length
- Investigation workspace with overview, suspects, evidence, and timeline
- Evidence discovery tracking
- Hints and interrogation flow
- Deterministic accusation checking on the server
- Final result screen with score breakdown
- In-memory fallback for local development when MongoDB/Gemini are unavailable
- Production-ready structure with typed server/client separation

## Tech stack

- React + TypeScript + Vite
- Express + TypeScript + Node.js
- MongoDB-ready Mongoose models with in-memory fallback
- Zod validation
- Gemini integration via the Google Gen AI SDK when configured

## Quick start

1. Install dependencies:
   npm install
2. Copy the example env file:
   copy .env.example .env
3. Start the app in development mode:
   npm run dev
4. Open the frontend at http://localhost:5173

The backend runs at http://localhost:4100/api.

## Environment variables

See `.env.example`.

Required variables for local development:
- `PORT`
- `CLIENT_ORIGIN`
- `MONGODB_URI`
- `GEMINI_MODEL`

`GEMINI_API_KEY` is optional for local mock generation. If it is absent, the server falls back to a deterministic local mystery generator so the app remains usable without external services.

## Local MongoDB

You can use a local MongoDB instance or MongoDB Atlas.

For local MongoDB:
- Install MongoDB Community Edition
- Start `mongod`
- Use `mongodb://127.0.0.1:27017/ai_mystery_room`

## Scripts

- `npm run dev` — run client and server together
- `npm run build` — build the client and compile the server
- `npm run lint` — runs the typecheck pipeline
- `npm run typecheck` — validate TypeScript across client and server
- `npm test` — run server tests
- `npm run test:e2e` — placeholder E2E runner (configured if Playwright is added)

## Notes

This project keeps a fictional-only investigation model. All generated evidence is clearly marked as fictional and should never be presented as authoritative real-world footage or records.
