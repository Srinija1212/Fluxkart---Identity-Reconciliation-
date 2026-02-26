# Bitespeed Backend Task - Identity Reconciliation

This project implements the `/identify` endpoint for reconciling shopper identities across multiple emails/phone numbers.

## Stack
- Node.js + TypeScript
- Express
- Prisma ORM
- SQLite (SQL relational database)
- Vitest + Supertest
- Docker + Docker Compose

## Hosted Endpoint
- Add your live URL here after deployment: `https://<your-app>/identify`

## Data Model
Prisma model mirrors the task spec:

- `id` (Int, PK, auto-increment)
- `phoneNumber` (String, nullable)
- `email` (String, nullable)
- `linkedId` (Int, nullable)
- `linkPrecedence` (`primary | secondary`)
- `createdAt`, `updatedAt`, `deletedAt`

## Reconciliation Rules Implemented
- If no matching contact exists by `email` or `phoneNumber`, create a new `primary`.
- If one linked group exists and request introduces new contact info, create a new `secondary`.
- If request connects multiple `primary` contacts, the oldest primary stays primary and newer primaries become secondary.
- Always return the consolidated response shape with:
  - `primaryContatctId` (kept as task-specified key spelling)
  - `emails` (primary email first)
  - `phoneNumbers` (primary phone first)
  - `secondaryContactIds`

## Run Locally (without Docker)
1. Install dependencies:
```bash
npm install
```
2. Create env file:
```powershell
Copy-Item .env.example .env
```
3. Generate Prisma client + sync DB:
```bash
npm run prisma:generate
npm run prisma:push
```
4. Start dev server:
```bash
npm run dev
```

Server runs on `http://localhost:3000`.

## Run with Docker
```bash
docker compose up --build
```

Server runs on `http://localhost:3000`.

## API Contract
### Endpoint
`POST /identify`

### Request Body
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

`email` and `phoneNumber` are optional individually, but at least one must be present.

### Success Response (200)
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

### Validation Error (400)
If both `email` and `phoneNumber` are missing/empty.

## Quick Postman Tests
Use `POST http://localhost:3000/identify` with JSON body.

1. New primary
```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

2. Secondary creation
```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

3. Lookup with only phone
```json
{
  "phoneNumber": "123456"
}
```

4. Lookup with only email
```json
{
  "email": "mcfly@hillvalley.edu"
}
```

## Run Tests
```bash
npm test
```

Covered scenarios:
- new primary creation
- secondary creation for new information
- idempotent repeat requests
- primary merge behavior
- request validation
