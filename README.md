# The Last Outpost: Year 2200

The Last Outpost is a full-stack JavaScript camp app for a Rover survival camp set in the year 2200. A.R.K., the Autonomous Recovery Kernel, monitors factions, assignments, missions, breach alerts, repair missions, and the Human Override Index.

## Stack

- `client/`: React + Vite
- `server/`: Node.js + Express
- Database: MongoDB Atlas / MongoDB
- Language: JavaScript

## Local Setup

Create `.env` in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=lastOutpost
PORT=4000
VITE_API_BASE_URL=http://localhost:4000/api
```

Install dependencies and start the app:

```bash
npm install
npm run seed -w server
npm run dev
```

The client runs at `http://localhost:5173`. The API runs on the port in `.env`.

## Default Leader Accounts

- `commander` / `rebuild2200`
- `ark-controller` / `override2200`
- `outpost-marshal` / `holdtheline2200`

## Main Flows

- Public users can view the landing page, Survival Laws, A.R.K. Briefing, Human Override Index, sign up, and log in.
- Rovers can sign up, log in, view their profile, faction, role, rules, briefing, scoreboard, and missions.
- Leaders can manage Rovers, assign factions, assign roles, enter daily evaluations, add breach alerts, add repair missions, and view reports.
- Logged-in Rovers can view the Outpost Blueprint, marker details, access restrictions, and safety notes.
- Leaders can upload/replace the blueprint image, add/edit/delete markers, drag marker positions, hide restricted markers, and reset default marker positions.

## Seed Data

The seed script creates:

- Two factions: The Wardens and The Foragers
- Five faction roles
- Three leader accounts
- Empty Rover list
- Daily mission files
- Empty evaluation board
- Default Outpost Blueprint metadata and marker positions

Run this only when the database is empty:

```bash
npm run seed -w server
```

## Commands

```bash
npm run dev
npm run client
npm run server
npm run build
npm test
```
