const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const questions = new Map();
const QUESTION_TTL_MS = 30 * 60 * 1000;

const operations = ['addition', 'subtraction', 'multiplication', 'division'];
const categories = [...operations, 'mixed'];
const difficulties = ['easy', 'medium', 'hard'];
const ranges = {
  easy: { min: 1, max: 10, multiplyMax: 10 },
  medium: { min: 10, max: 99, multiplyMax: 20 },
  hard: { min: 100, max: 999, multiplyMax: 99 },
};
const templates = {
  addition: [
    (a, b) => `Hey, what will be ${a} + ${b}?`,
    (a, b) => `Can you help me solve ${a} + ${b}?`,
    (a, b) => `What do you get when you add ${a} and ${b}?`,
    (a, b) => `Can you calculate ${a} + ${b}?`,
  ],
  subtraction: [
    (a, b) => `Hey, what is ${a} - ${b}?`,
    (a, b) => `What do you get when you subtract ${b} from ${a}?`,
    (a, b) => `Can you help me work out ${a} minus ${b}?`,
    (a, b) => `Can you calculate ${a} - ${b}?`,
  ],
  multiplication: [
    (a, b) => `Hey, what is ${a} × ${b}?`,
    (a, b) => `Can you calculate ${a} × ${b}?`,
    (a, b) => `What do you get when you multiply ${a} by ${b}?`,
    (a, b) => `Can you help me solve ${a} times ${b}?`,
  ],
  division: [
    (a, b) => `Hey! If you divide ${a} by ${b}, what is the answer?`,
    (a, b) => `Can you calculate ${a} ÷ ${b}?`,
    (a, b) => `What do you get when you divide ${a} by ${b}?`,
    (a, b) => `Can you help me work out ${a} divided by ${b}?`,
  ],
};

function randomInt(min, max) {
  return crypto.randomInt(min, max + 1);
}

function generateQuestion(category, difficulty) {
  if (!categories.includes(category)) throw new TypeError('Invalid category');
  if (!difficulties.includes(difficulty)) throw new TypeError('Invalid difficulty');
  const range = ranges[difficulty];
  const operation = category === 'mixed' ? operations[randomInt(0, operations.length - 1)] : category;
  let a;
  let b;
  let answer;

  if (operation === 'division') {
    const divisorMax = difficulty === 'hard' ? 99 : difficulty === 'medium' ? 20 : 10;
    b = randomInt(1, divisorMax);
    const quotient = randomInt(range.min, range.max);
    a = b * quotient;
    answer = quotient;
  } else if (operation === 'multiplication') {
    a = randomInt(1, range.multiplyMax);
    b = randomInt(1, range.multiplyMax);
    answer = a * b;
  } else {
    a = randomInt(range.min, range.max);
    b = randomInt(range.min, range.max);
    if (operation === 'subtraction' && b > a) [a, b] = [b, a];
    answer = operation === 'addition' ? a + b : a - b;
  }

  const choices = templates[operation];
  return {
    id: crypto.randomUUID(),
    question: choices[randomInt(0, choices.length - 1)](a, b),
    category,
    operation,
    difficulty,
    answer,
  };
}

app.use(express.json({ limit: '1kb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const localOrigin = origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const configuredOrigin = process.env.CORS_ORIGIN && origin === process.env.CORS_ORIGIN;
  if (localOrigin || configuredOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/question', (req, res) => {
  const category = req.query.category || 'mixed';
  const difficulty = req.query.difficulty || 'easy';
  if (!categories.includes(category) || !difficulties.includes(difficulty)) {
    return res.status(400).json({ error: 'Category or difficulty is invalid.' });
  }
  const question = generateQuestion(category, difficulty);
  questions.set(question.id, { answer: question.answer, createdAt: Date.now() });
  for (const [id, record] of questions) {
    if (Date.now() - record.createdAt > QUESTION_TTL_MS) questions.delete(id);
  }
  return res.json({
    id: question.id,
    question: question.question,
    category: question.category,
    operation: question.operation,
    difficulty: question.difficulty,
  });
});

app.post('/api/answer', (req, res) => {
  const { questionId, answer } = req.body || {};
  if (typeof questionId !== 'string' || typeof answer !== 'number' || !Number.isFinite(answer)) {
    return res.status(400).json({ error: 'Provide a questionId and a numeric answer.' });
  }
  const record = questions.get(questionId);
  if (!record || Date.now() - record.createdAt > QUESTION_TTL_MS) {
    questions.delete(questionId);
    return res.status(404).json({ error: 'Question not found or expired. Please get a new question.' });
  }
  questions.delete(questionId);
  return res.json({ correct: answer === record.answer });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Math Quiz is running at http://localhost:${PORT}`));
}

module.exports = { app, generateQuestion, categories, difficulties };
