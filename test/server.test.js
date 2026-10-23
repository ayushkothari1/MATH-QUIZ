const test = require('node:test');
const assert = require('node:assert/strict');
const { app, generateQuestion, categories, difficulties } = require('../server');

test('generator creates natural language questions for every operation and difficulty', () => {
  for (const category of categories) {
    for (const difficulty of difficulties) {
      const generated = generateQuestion(category, difficulty);
      assert.ok(generated.id);
      assert.ok(generated.question.endsWith('?'));
      assert.equal(generated.category, category);
      assert.equal(generated.difficulty, difficulty);
      assert.equal(typeof generated.answer, 'number');
      assert.ok(['addition', 'subtraction', 'multiplication', 'division'].includes(generated.operation));
      const [a, b] = generated.question.match(/\d+/g).map(Number);
      const expected = {
        addition: a + b,
        subtraction: Math.max(a, b) - Math.min(a, b),
        multiplication: a * b,
        division: a / b,
      }[generated.operation];
      assert.equal(generated.answer, expected);
      if (generated.operation === 'division') assert.equal(Number.isInteger(expected), true);
    }
  }
});

test('generator rejects unsupported settings', () => {
  assert.throws(() => generateQuestion('geometry', 'easy'), /Invalid category/);
  assert.throws(() => generateQuestion('addition', 'expert'), /Invalid difficulty/);
});

test('API hides answers, validates them once, and handles invalid input', async (t) => {
  const server = app.listen(0);
  t.after(() => server.close());
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const invalidSettings = await fetch(`${base}/api/question?category=magic&difficulty=easy`);
  assert.equal(invalidSettings.status, 400);

  const response = await fetch(`${base}/api/question?category=addition&difficulty=easy`);
  assert.equal(response.status, 200);
  const question = await response.json();
  assert.equal(question.category, 'addition');
  assert.equal(question.difficulty, 'easy');
  assert.equal(Object.hasOwn(question, 'answer'), false);
  assert.equal(Object.hasOwn(question, 'correctAnswer'), false);

  const malformed = await fetch(`${base}/api/answer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad json',
  });
  assert.equal(malformed.status, 400);

  const invalidAnswer = await fetch(`${base}/api/answer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: question.id, answer: '5' }),
  });
  assert.equal(invalidAnswer.status, 400);

  const checked = await fetch(`${base}/api/answer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: question.id, answer: 0 }),
  });
  assert.equal(checked.status, 200);
  assert.equal(typeof (await checked.json()).correct, 'boolean');

  const reused = await fetch(`${base}/api/answer`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: question.id, answer: 0 }),
  });
  assert.equal(reused.status, 404);
});
