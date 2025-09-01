//Global variables
let answers = {};
let i = 1;
let archetypeData = {};


//Start - Initialisation
$(function () {
  $.get("./quiz_data/questions.json", function (quizData) {
    display(quizData);
  });

  $.get("./quiz_data/archetypes.json", function (data) {
    archetypeData = data; ////Assign JSON content
  })

  ButtonControl();
});

function ButtonControl() {
  startButtonControl();
  welcomeButtonControl();
  backToQuizButtonControl();
  endQuizButtonControl();
}

//////////// BUTTON CONTROL /////////////
function startButtonControl() {
  $("#start-button").click(function () {
    $("#start-page").css("display", "none");
    $("#welcome-page").css("display", "flex");
  });
}

function welcomeButtonControl() {
  $("#welcome-button").click(function () {
    $("#welcome-page").css("display", "none");
    $("#quiz-page").css("display", "flex");
  });
}

function backToQuizButtonControl() {
  $("#back-to-quiz-button")
    .off("click")
    .on("click", function () {
      $("#end-quiz-page").css("display", "none");
      $("#quiz-page").css("display", "flex");
      console.log("Back to quiz - question 10");
    });
}

function endQuizButtonControl() {
  $("#end-quiz-button")
    .off("click")
    .on("click", function () {
      $("#end-quiz-page").css("display", "none");
      $("#result-page").css("display", "flex");
      console.log("Receive your order!");


      analyzeAnswer();
    });
}

//////////////// Display Questions //////////////
function display(quizData) {
  let questionNumber = `<p>${quizData.questions[i].order}</p>`;
  let questionStory = `<p>${quizData.questions[i].story}</p>`;
  let questionIllustration = `<img src="${quizData.questions[i].illustration}"/>`;
  let questionAsk = `${quizData.questions[i].ask}`;

  let questionAnswers = "";
  for (let a = 0; a < quizData.questions[i].answers.length; a++) {
    questionAnswers += `<div class="button" answer="${a}">
            <img class="not-hover-img" src="./design/buttons/multiple-options/${a}.png"/>
            <img class="hover-img" src="./design/buttons/multiple-options/${a}-hover.png"/>
            <p>${quizData.questions[i].answers[a]}</p>
          </div>`;
  }

  $("#question-number").html(questionNumber);
  $("#question-story").html(questionStory);
  $("#question-illustration").html(questionIllustration);
  $("#question-ask").html(questionAsk);
  $("#answer-container").html(questionAnswers);

  /////Click on an answer option/////
  $("#answer-container .button").each(function () {
    $(this).click(function () {
      let answer = $(this).attr("answer");
      let answer_points = quizData.questions[i].points[answer];
      answers[`question_${i}`] = answer_points;
      console.log(answers);
      ////Question Number Limit
      if (i < 10) {
        i += 1;
        display(quizData);
      } else {
        console.log("No more question");
        $("#quiz-page").css("display", "none");
        $("#end-quiz-page").css("display", "flex");
      }
    });
  });

  progressButtonControl(quizData);
  retakeButtonControl(quizData);
}

//////// Progress Button ///////
function progressButtonControl(quizData) {
  $("#back-button")
    .off("click")
    .on("click", function () {
      // If on question 1 → go back to home
      if (i === 1) {
        $("#start-page").css("display", "flex");
        $("#quiz-page").css("display", "none");
        answers = {}; // reset answers
        console.log("Returned home, answers reset");
      }
      // If on question > 1 and an answer exists → go back one step
      else if (i > 1) {
        i -= 1;
        console.log("Moved back to question", i);
        display(quizData);
      }
    });
}

//////// Retake Button ///////
function retakeButtonControl(quizData) {
  $("#retake-button")
    .off("click")
    .on("click", function () {
      $("#result-page").css("display", "none");
      $("#start-page").css("display", "flex");
      answers = {};
      i = 1;
      display(quizData);
      console.log("Retake quiz, answers reset");
    });
}


function analyzeAnswer() {
  /// Accumulate answers
  let final_answers = Object.values(answers).reduce((q, { attachment, gratification, emotions, depth }) => {
    // Sum attachment and depth
    q.attachment += attachment;
    q.depth += depth;

    // Merge gratification
    for (let key in gratification) {
      q.gratification[key] = (q.gratification[key] || 0) + gratification[key];
    }

    // Collect emotions
    emotions.forEach(e => q.emotions.add(e));

    // Return accumulated result
    return q;
  }, { attachment: 0, gratification: {}, emotions: new Set(), depth: 0});

  console.log(final_answers)

  //// Categorize archetype
  let user_archetype = {};
  //Attachment

  let user_attachment = final_answers.attachment;
  if (user_attachment<34) {
    user_archetype.attachment = 'avoidant';
  } else if (user_attachment>66) {
    user_archetype.attachment = 'anxious';
  } else {
    user_archetype.attachment = 'secure';
  };

  //Gratification
  let user_gratification = Object.entries(final_answers.gratification)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
  user_archetype.gratification = user_gratification;


  //Emotion Range
  let user_range = final_answers.emotions.size;
  if (user_range < 3) {
    user_archetype.range = 'narrow';
  } else if (user_range > 4) {
    user_archetype.range = 'broad';
  } else {
    user_archetype.range = 'moderate'
  }  


  //Emotion Depth
  let user_depth = final_answers.depth / 10;
  if (user_depth <2.1) {
    user_archetype.depth = 'low';
  } else if (user_depth >3.5) {
    user_archetype.depth = 'high';
  } else {
    user_archetype.depth = 'medium'
  }

  console.log(user_archetype)

  analyzeArchetype(user_archetype, archetypeData)
}

function analyzeArchetype(user_archetype, archetypeData) {
  ////Attachment
  let archetype_scores = {};

  $.each(archetypeData, function(type, attrs) {
    archetype_scores[type] = 0;

    // Matching attachment, depth, range -> + 20% each
    if (attrs.attachment.includes(user_archetype.attachment)) {
      archetype_scores[type] += 25;
    };

    if (attrs.depth.includes(user_archetype.depth)) {
      archetype_scores[type] += 15;
    };

    if (attrs.range.includes(user_archetype.range)) {
      archetype_scores[type] += 15;
    };

    // Matching gratifications (top 3) : top 1 -> + 20%, top 2 -> + 15%, top 3 -> + 5%

    ///// (user - type)
    ///// 20% Top 1-1
    if (user_archetype.gratification[0] === attrs.gratification[0]) {
      archetype_scores[type] += 25;
    };

    ///// 15% Top 1-2 OR Top 2-1/2
    if (user_archetype.gratification[0] === attrs.gratification[1] || user_archetype.gratification[1] === attrs.gratification[0] || user_archetype.gratification[1] === attrs.gratification[1]) {
      archetype_scores[type] += 15;
    }

    ///// 5% Either User or Type Top 3
    if (user_archetype.gratification[0] === attrs.gratification[2]) {
      archetype_scores[type] += 5;
    }

    if (user_archetype.gratification[1] === attrs.gratification[2]) {
      archetype_scores[type] += 5;
    }


    if (attrs.gratification.includes(user_archetype.gratification[2])) {
      archetype_scores[type] += 5;
    }
  })

  let user_archetype_result = Object.keys(archetype_scores).reduce((a,b) => archetype_scores[a] > archetype_scores[b] ? a:b);
  console.log(archetype_scores)


  let user_archetype_illustration_result = `<img src="${archetypeData[user_archetype_result].illustration}"/>`;
  $("#result-illustration").html(user_archetype_illustration_result);
}
