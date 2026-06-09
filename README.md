# Havenwood Mission Control

Havenwood Mission Control is a full-stack JavaScript web app for a 4-day Rover Scout summer camp experience inspired by a sci-fi mystery theme: `The Other Side: Operation Close the Gate`.

## Stack

- `client/`: React + Vite
- `server/`: Node.js + Express
- Persistence: local JSON files in `server/data`
- Styling: responsive CSS, mobile-first, dark mission-control UI

## Features

- Crew mobile flow with code-based access
- Crew dashboard with score, stability, mission tracking, and transmissions
- Mission archive grouped by day with answer submission for puzzle missions
- Leader dashboard for crew scoring and notes
- Member evaluation board with final title assignment
- Reports page with standings, awards, JSON export, and print-friendly layout

## Setup

Run from the project root:

```bash
npm install
npm run dev
```

This starts:

- React client at `http://localhost:5173`
- Express API at `http://localhost:4000`

## Other Commands

```bash
npm run client
npm run server
npm run build
npm test
```

## Authentication

- Crew codes:
  - `SIGNAL`
  - `LIGHT`
  - `GATE`
  - `TRACK`
- Leader password:
  - `close-the-gate`

Leader auth is intentionally simple and stored in `localStorage`.

## Data Files

The app persists changes directly into:

- `server/data/crews.json`
- `server/data/members.json`
- `server/data/missions.json`
- `server/data/evaluations.json`
- `server/data/settings.json`

## Notes

- No external database or paid services are required.
- Mission answers are normalized before checking, so case and extra spacing do not matter.
- Missions without answer fields are leader-verified and do not auto-complete from the crew UI.
