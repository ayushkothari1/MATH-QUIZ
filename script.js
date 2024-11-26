const questions = [
  {
    question: "What is the value of 5 + 3 × 2?",
    answers: [
      { text: "16", correct: false },
      { text: "11", correct: true },
      { text: "13", correct: false },
      { text: "8", correct: false },
    ],
  },
  {
    question: "What is the square root of 49?",
    answers: [
      { text: "6", correct: false },
      { text: "7", correct: true },
      { text: "9", correct: false },
      { text: "5", correct: false },
    ],
  },
  {
    question: "Which of the following is the solution to 2x + 4 = 12?",
    answers: [
      { text: "x = 6", correct: false },
      { text: "x = 4", correct: true },
      { text: "x = 2", correct: false },
      { text: "x = 8", correct: false },
    ],
  },
  {
    question: "What is the result of 15 ÷ 3 × 5?",
    answers: [
      { text: "15", correct: false },
      { text: "20", correct: false },
      { text: "30", correct: false },
      { text: "25", correct: true },
    ],
  },
  {
    question: "What is 25% of 200?",
    answers: [
      { text: "50", correct: true },
      { text: "25", correct: false },
      { text: "75", correct: false },
      { text: "100", correct: false },
    ],
  },
  {
    question:
      "Which of the following is the perimeter of a rectangle with length 8 cm and width 5 cm?",
    answers: [
      { text: "30 cm", correct: false },
      { text: "16 cm", correct: false },
      { text: "26 cm", correct: true },
      { text: "40 cm", correct: false },
    ],
  },
  {
    question: "What is the value of 3^3?",
    answers: [
      { text: "27", correct: true },
      { text: "9", correct: false },
      { text: "18", correct: false },
      { text: "33", correct: false },
    ],
  },
  {
    question:
      "If a triangle has sides of 5 cm, 12 cm, and 13 cm, what is the area of the triangle?",
    answers: [
      { text: "30 cm²", correct: true },
      { text: "25 cm²", correct: false },
      { text: "60 cm²", correct: false },
      { text: "60 cm", correct: false },
    ],
  },
  {
    question: "How many degrees are in a straight angle?",
    answers: [
      { text: "180°", correct: true },
      { text: "90°", correct: false },
      { text: "360°", correct: false },
      { text: "45°", correct: false },
    ],
  },
  {
    question: "What is the value of pi (π) to two decimal places?",
    answers: [
      { text: "3.14", correct: true },
      { text: "3.16", correct: false },
      { text: "3.12", correct: false },
      { text: "3.10", correct: false },
    ],
  },
];
const container = document.querySelector(".container");
const questionElement = document.querySelector("#question");
const answerButtons = document.querySelector("#answer-buttons");
const nextButton = document.querySelector("#next-btn");

let currentQuestionIndex = 0;
let score = 0;

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  nextButton.innerHTML = "Next";
  showQuestion();
}

function showQuestion() {
  resetState();
  let currentQuestion = questions[currentQuestionIndex];
  let questionNo = currentQuestionIndex + 1;
  questionElement.innerHTML = questionNo + ". " + currentQuestion.question;

  currentQuestion.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.innerHTML = answer.text;
    button.classList.add("btn");
    answerButtons.appendChild(button);
    if (answer.correct) {
      button.dataset.correct = answer.correct;
    }
    button.addEventListener("click", selectAnswer);
  });
}

function resetState() {
  nextButton.style.display = "none";
  while (answerButtons.firstChild) {
    answerButtons.removeChild(answerButtons.firstChild);
  }
}
startQuiz();

function selectAnswer(e) {
  const selectBtn = e.target;
  const isCorrect = selectBtn.dataset.correct === "true";
  if (isCorrect) {
    selectBtn.classList.add("correct");
    score++;
  } else {
    selectBtn.classList.add("incorrect");
  }
  Array.from(answerButtons.children).forEach((button) => {
    if (button.dataset.correct === "true") {
      button.classList.add("correct");
    }
    button.disabled = true;
  });
  nextButton.style.display = "block";
}

function showScore() {
  resetState();
  if (score >= 9) {
    questionElement.innerHTML = `Excellent! You scored ${score} out of ${questions.length}!`;
  } else if (score >= 6) {
    questionElement.innerHTML = `Nice! You scored ${score} out of ${questions.length}!`;
  } else if (score >= 4) {
    questionElement.innerHTML = `Average! You scored ${score} out of ${questions.length}!`;
  } else {
    questionElement.innerHTML = `poor! You scored ${score} out of ${questions.length}!`;
  }
  nextButton.innerHTML = "Play Again";
  nextButton.style.display = "block";
}

function handleNextButton() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showScore();
  }
}

nextButton.addEventListener("click", () => {
  if (currentQuestionIndex < questions.length) {
    handleNextButton();
  } else {
    startQuiz();
  }
});
