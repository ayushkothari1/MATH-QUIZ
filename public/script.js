const settingsForm = document.querySelector("#settings");
const quizPanel = document.querySelector("#quiz-panel");
const questionElement = document.querySelector("#question");
const answerForm = document.querySelector("#answer-form");
const answerInput = document.querySelector("#answer");
const submitButton = document.querySelector("#submit-answer");
const nextButton = document.querySelector("#next-btn");
const feedback = document.querySelector("#feedback");
const errorMessage = document.querySelector("#error");
const loadingMessage = document.querySelector("#loading");
const progressElement = document.querySelector("#progress");
const progressFill = document.querySelector("#progress-fill");
const scoreElement = document.querySelector("#score");
const isLocalPreview = window.location.protocol === "file:" ||
  (["localhost", "127.0.0.1"].includes(window.location.hostname) && window.location.port !== "3000");
const apiBase = window.MATH_QUIZ_API_URL || (isLocalPreview ? "http://localhost:3000" : "");

async function apiFetch(path, options) {
  const response = await fetch(`${apiBase}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("The API did not return JSON. Start the backend with npm start.");
  }
  const data = await response.json();
  return { response, data };
}

let questionCount = 10;
let questionNumber = 0;
let score = 0;
let currentQuestionId = null;
let answered = false;

function showError(message) {
  errorMessage.textContent = message;
}

async function requestQuestion() {
  loadingMessage.hidden = false;
  quizPanel.hidden = false;
  answerForm.hidden = true;
  nextButton.hidden = true;
  showError("");
  feedback.textContent = "";
  feedback.className = "";
  const params = new URLSearchParams({
    category: document.querySelector("#category").value,
    difficulty: document.querySelector("#difficulty").value,
  });

  try {
    const { response, data } = await apiFetch(`/api/question?${params}`);
    if (!response.ok) throw new Error(data.error || "Could not get a question.");
    currentQuestionId = data.id;
    questionElement.textContent = data.question;
    questionNumber += 1;
    progressElement.textContent = `Question ${questionNumber} of ${questionCount}`;
    progressFill.style.width = `${((questionNumber - 1) / questionCount) * 100}%`;
    answerInput.value = "";
    answerForm.hidden = false;
    answerInput.focus();
  } catch (error) {
    showError(`${error.message} Check the server connection and try again.`);
    questionElement.textContent = "We couldn't load your question.";
    nextButton.textContent = "Try again";
    nextButton.hidden = false;
  } finally {
    loadingMessage.hidden = true;
  }
}

function startQuiz(event) {
  if (event) event.preventDefault();
  questionCount = Number(document.querySelector("#question-count").value);
  questionNumber = 0;
  score = 0;
  currentQuestionId = null;
  answered = false;
  scoreElement.textContent = "Score: 0";
  progressFill.style.width = "0%";
  nextButton.textContent = "Next question";
  settingsForm.hidden = true;
  quizPanel.hidden = false;
  requestQuestion();
}

settingsForm.addEventListener("submit", startQuiz);

answerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (answered || !currentQuestionId) return;
  const answer = Number(answerInput.value);
  if (!Number.isFinite(answer)) {
    showError("Enter a valid number for your answer.");
    return;
  }

  submitButton.disabled = true;
  showError("");
  try {
    const { response, data: result } = await apiFetch("/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: currentQuestionId, answer }),
    });
    if (!response.ok) throw new Error(result.error || "Could not check your answer.");
    answered = true;
    if (result.correct) {
      score += 1;
      feedback.textContent = "That's right! Great work.";
      feedback.className = "correct";
    } else {
      feedback.textContent = "Not quite. Keep going, you'll get the next one!";
      feedback.className = "incorrect";
    }
    scoreElement.textContent = `Score: ${score}`;
    progressFill.style.width = `${(questionNumber / questionCount) * 100}%`;
    answerForm.hidden = true;
    nextButton.textContent = questionNumber === questionCount ? "See results" : "Next question";
    nextButton.hidden = false;
    nextButton.focus();
  } catch (error) {
    showError(error.message);
  } finally {
    submitButton.disabled = false;
  }
});

nextButton.addEventListener("click", () => {
  if (!currentQuestionId && questionNumber === 0) return requestQuestion();
  if (questionNumber < questionCount) {
    answered = false;
    requestQuestion();
    return;
  }

  questionElement.textContent = `You scored ${score} out of ${questionCount}. ${score === questionCount ? "Perfect score!" : "Nice work practicing!"}`;
  progressElement.textContent = "Quiz complete";
  progressFill.style.width = "100%";
  feedback.textContent = "Choose your settings and start a fresh quiz whenever you're ready.";
  feedback.className = "correct";
  nextButton.hidden = true;
  settingsForm.hidden = false;
  settingsForm.querySelector(".start-btn").textContent = "Play again";
  currentQuestionId = null;
});
