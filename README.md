# Bitespeed Backend Task - Identity Reconciliation

This is my solution for the Bitespeed backend assignment.

It exposes the required `POST /identify` API and also includes a small browser UI at `/` so the flow can be tested without Postman.

## Tech Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- SQLite (SQL relational DB)
- Vitest + Supertest
- Docker + Docker Compose

## Project Structure

```text
src/
  app.ts
  server.ts
  routes/identify.ts
  services/identity.ts
  validation/identify.ts
  middleware/error-handler.ts
prisma/
  schema.prisma
public/
  index.html
  styles.css
  app.js
tests/
  identify.test.ts
```

## API

### Endpoint

`POST /identify`

### Request Body

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

Notes:

- `email` is optional
- `phoneNumber` is optional
- at least one of them must be present

### Success Response

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

`primaryContatctId` key is intentionally kept with this spelling to match the assignment spec.

## Reconciliation Behavior Implemented

1. No match by email/phone -> create a new `primary` contact.
2. Match found + incoming request has new info -> create a new `secondary` contact.
3. If request connects two previously separate primaries -> oldest primary stays primary, newer primary becomes secondary.
4. Response always returns consolidated emails, phone numbers, and secondary contact ids for that identity cluster.

## Run Locally (Command Prompt)

```cmd
cd /d C:\Users\HP\Downloads\assignment-bitespeed
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:push
npm run dev
```

Default URL:

- UI: `http://localhost:3000/`
- Health: `http://localhost:3000/health`
- API: `http://localhost:3000/identify`

If port 3000 is busy:

```cmd
set PORT=3001
npm run dev
```

## Run with Docker

```cmd
cd /d C:\Users\HP\Downloads\assignment-bitespeed
docker compose up -d --build
```

Stop:

```cmd
docker compose down
```

Docker URL with current compose config:

- UI: `http://localhost:3001/`
- API: `http://localhost:3001/identify`

## Postman Quick Checks

Use `POST http://localhost:<port>/identify` with `raw` JSON body.

1. Create primary

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

2. Create secondary

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

3. Lookup by phone

```json
{
  "phoneNumber": "123456"
}
```

4. Lookup by email

```json
{
  "email": "mcfly@hillvalley.edu"
}
```

## Tests

Run:

```cmd
npm test
```

Current tests cover:

- new primary creation
- secondary creation
- repeat request idempotency
- merge of two primaries
- validation error when both fields are missing

## Assignment Requirement Checklist

- [x] `POST /identify` implemented
- [x] JSON body input (`email`, `phoneNumber`) implemented
- [x] Relational SQL database used
- [x] Contact linking by shared email/phone implemented
- [x] Oldest record treated as primary
- [x] Secondary creation when new linked info comes in
- [x] Primary can become secondary when two primaries are connected
- [x] Consolidated response format implemented
- [x] Code pushed in small meaningful commits (local git history ready)
- [x] Hosted endpoint URL added in README (see below)

## Hosted Endpoint

Add after deployment:

`https://bitespeed-identity-reconciliation-yki0.onrender.com/identify`

## Git History (local)

Commits:

- `chore: bootstrap typescript express service with prisma schema`
- `feat: implement /identify reconciliation flow with transactional merging`
- `test: add coverage for reconciliation scenarios and dockerized runbook`
- `chore: ignore local sqlite test artifacts`
- `feat: add browser interface for /identify endpoint`
