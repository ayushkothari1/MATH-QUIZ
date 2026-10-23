# Simple Math Quiz

A responsive math quiz built with vanilla JavaScript and Express. Questions are generated on demand by the backend; answers stay on the server and are checked when submitted.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

```sh
npm install
npm start
```

Open <http://localhost:3000>. For development with automatic server restarts, use `npm run dev`. Set `PORT` in the environment to change the listening port.

Keep that terminal running while using the quiz. If you open `index.html` directly or use a local preview such as VS Code Live Server, the frontend now sends API requests to `http://localhost:3000`. The backend permits requests from localhost for that development setup. For a separate deployed frontend, set `CORS_ORIGIN` to its exact origin and set `window.MATH_QUIZ_API_URL` before `script.js` to the backend base URL.

## API

### `GET /api/question?category=mixed&difficulty=easy`

Supported categories: `addition`, `subtraction`, `multiplication`, `division`, and `mixed`. Supported difficulties: `easy`, `medium`, and `hard`. Defaults are `mixed` and `easy`.

Returns a generated question without its answer:

```json
{
  "id": "question-uuid",
  "question": "Hey, what will be 12 + 8?",
  "category": "addition",
  "operation": "addition",
  "difficulty": "easy"
}
```

### `POST /api/answer`

Submit a numeric answer for a generated question:

```json
{ "questionId": "question-uuid", "answer": 20 }
```

Returns `{ "correct": true }` or `{ "correct": false }`. A question ID is single use and expires after 30 minutes. Invalid settings and malformed submissions return a JSON error with an appropriate HTTP status.

## Checks

```sh
npm test
npm run build
```
