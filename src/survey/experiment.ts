import 'jspsych/css/jspsych.css'
import './assets/styles.css';
import '@jspsych/plugin-survey/css/survey.css'
import {initJsPsych} from 'jspsych';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import ExternalHtml from '@jspsych/plugin-external-html';
import Survey from '@jspsych/plugin-survey';
import {Questions} from './constants';

// Objects being used for the survey
const OBJECTS = ["ball", "cat", "bottle"]//, "hand", "park", "lion", "spoon", "butterfly", "button", "staircase", "car", "lamp", "slide", "bucket", "kitchen", 
const NON_SURVEY_QUESTIONS = 4;

const jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: true,
  message_progress_bar: 'Survey Progress',
  on_finish:  function(data: any) {
    saveSurveyToDatabase(data);
    window.location.href = import.meta.env.VITE_COMPLETION_CODE ? `https://app.prolific.com/submissions/complete?cc=${import.meta.env.VITE_COMPLETION_CODE}` : "https://www.google.com";
  }
}); 

const socket = function() {
  // WebSockets connection to the server
  const url = new URL(window.location.href);
  url.protocol = url.protocol.replace("http", "ws"); // uses wss:// if https:// and ws:// if http://
  url.pathname = url.pathname.replace(/\/$/, ""); // Remove trailing slash if it exists
  const ws = new window.WebSocket(`${url.href}/ws`); // /ws proxy set up in nginx
  ws.onopen = () => {
    console.log('Connected to the server');
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data.toString());
    console.log('Received data:', data);
  };
  return ws;
}

const consentTrial = function() {
  // Function to check if the consent checkbox is checked
  const check_consent = function(_elem: any) {
    if ((document.getElementById('consent_checkbox') as HTMLInputElement).checked) {
        return true;
    }
    else {
      // Display hidden error message
      (document.getElementById('error') as HTMLElement).style.display = 'block';
      window.scrollTo(0, document.body.scrollHeight);
      return false;
    }
  };
  
  const consent = {
    type: ExternalHtml,
    // Survey directory added when running in development mode
    url: new URL('./assets/consentPage.html', import.meta.url).href,
    cont_btn: "start",
    execute_script: true,
    check_fn: check_consent
  };
  return consent;  
}

const childEligibilityCheck = function() {
  let eligibilityCheck = {
    type: Survey,
    survey_json: {
      showQuestionNumbers: false,
      elements: [
        {
          type: 'boolean',
          title: 'Do you have a child between the ages of 6 months and 4 years old?',
          name: 'ChildEligibility',
          valueTrue: "Yes",
          valueFalse: "No",
          isRequired: true
        }
      ]
    }
  }
  
  // To be displayed if the participant fails the age eligibility check
  let failedSurveyQuestion = {
    type: HtmlButtonResponsePlugin,
    choices: ["Continue"],
    stimulus: `<p>Sorry, you are not eligible for this study.</p> 
    <p>If something went wrong, please contact the researchers through the Prolific messaging system.</p>
               <p>Click 'Continue' to be redirected to Prolific.</p>`,
    on_finish: function(_data:any) {
      console.log(import.meta.env.VITE_SCREENED_OUT_CODE)
      jsPsych.finishTrial();
      window.location.href = import.meta.env.VITE_SCREENED_OUT_CODE ? `https://app.prolific.com/submissions/complete?cc=${import.meta.env.VITE_SCREENED_OUT_CODE}` : "https://google.com";
    },
    post_trial_gap: 2000
  }
  
  // JSPsych element to check if participant has failed the eligibility check
  let elibilityQuestion = {
    timeline: [failedSurveyQuestion],
    conditional_function: function(){
      console.log(jsPsych.data.get());
        // Check if participant said they did not have a child in the required age range
        let data = jsPsych.data.get().filterCustom((x: any) => x.response && Object.keys(x.response).includes("ChildEligibility")).values();
        return data.length > 0 && data[0].response.ChildEligibility == "No";
    }
  }
  return [eligibilityCheck, elibilityQuestion];
}

// Create a list of survey questions for each object defined in OBJECTS
function surveyQuestions() {
  let surveyTrials = [];
  for (let index = 0; index < OBJECTS.length; index++) {
    let survey_json = {
      showQuestionNumbers: false,
      elements:
        [
            {
              "type": "html",
              "name": "rendered-html",
              "html": '<div id="myprompt" style="position: absolute; white-space: nowrap; max-width: 100%; top: 10%; left: 50%; transform: translateX(-50%); text-align: center;">If you are unsure of your answers to any of the questions below please provide your best guess.</div>',
            },
          {
            type: 'checkbox',
            title: `In what formats do you think your child has seen a ${OBJECTS[index]}?`, 
            name: 'FormatsSeen', 
            choices: ['A drawing', 'A toy', 'A photo', 'A video', 'In real life', `Never seen a ${OBJECTS[index]}`], 
            isRequired: true
          },
          {
            type: 'radiogroup',
            title: `How often do you think your child has seen a ${OBJECTS[index]} (across all formats)`, 
            name: 'Frequency',
            transposeData: true,
            colCount: 0,
            choices: ['Never', 'Once or twice', 'Every few months', 'Monthly', 'Weekly', 'Daily', 'Multiple times a day'], 
            isRequired: true
          },
          {
            type: 'radiogroup',
            title: `How many different types of a ${OBJECTS[index]} do you think your child has seen in real life (for example: red ${OBJECTS[index]}, blue ${OBJECTS[index]})?`, 
            name: 'RealExemplarCount',
            transposeData: true,
            colCount: 0,
            choices: ['0', '1', '2', '<5', '<10', '10 or more'], 
            isRequired: true
          }, 
          {
            type: 'radiogroup',
            title: `How many times do you think your child has seen a ${OBJECTS[index]} (across all formats)`, 
            name: 'TotalCount', 
            colCount: 0,
            choices: ['0', '1', '2', '<5', '<10', '<25', '25 or more'], 
            isRequired: true
          }
      ]  
    }
    surveyTrials.push({
      type: Survey,
      survey_json: survey_json,
      data: {
        'object': OBJECTS[index]                                                      
      }
    });
  }
  return surveyTrials;
}

// To run the whole JSPsych experiment
const run = function(jsPsych: any) {
  let timeline = []
  let instructions = {
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>In this survey, you will answer questions relating to the home environment of your child. Press any key to begin.</p>"
  }
  let childAgeQuestion = {
    type: Survey,
    survey_json: {
      showQuestionNumbers: false,
      elements: [
        {
          type: 'text',
          title: 'How old is this child? Please enter as x;y where x is what age they are and y is the number of months it has been since they turned that age. If you have other children enter all of their ages separated by commas, starting with the child in question (e.g. 1;6,5;9)',
          name: 'ChildAge'
        }
      ]
    },
    post_trial_gap: 2000
  }
  let surveyProcedure = jsPsych.randomization.shuffle(surveyQuestions())
  let finalBlock = {
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p>Thanks for answering our questions. Press any key to complete the experiment. Thank you!</p>"
  }
  timeline.push(consentTrial(), instructions, ...childEligibilityCheck(), childAgeQuestion, surveyProcedure, finalBlock);
  jsPsych.run(timeline);
}

const ws = socket(); 
run(jsPsych);

// Logic to save survey data to database
const saveSurveyToDatabase = function(rawSurveyData: any){
  let [childAge, childSiblingAges] = agesInMonths(rawSurveyData);
  let trials = rawSurveyData.filterCustom((x: any) => Object.keys(x).includes("object")).values();
  console.log(trials);
  let surveyData: VEDI.SurveyData = {
    prolificInformation: prolificInformation(),
    childAge: childAge,
    childSiblingAges: childSiblingAges,
    trialData: trials.map((trial: any) => ({
      object: trial.object,
      trialIndex: trial.trial_index - NON_SURVEY_QUESTIONS,
      reactionTime: trial.rt,
      ...Object.fromEntries(Object.entries(trial.response).filter(([k,_v]) => Object.keys(Questions).includes(k)))
    }))
  }
  ws.send(JSON.stringify({ action: 'insert', data: surveyData }))
}

const prolificInformation = function():Study.ProlificInformation {
  // Information that Prolific provides in the URL to tie user back to their study
  const urlParams = new URLSearchParams(window.location.search);
  return {
    prolificID: urlParams.get('PROLIFIC_PID'),
    studyID: urlParams.get('STUDY_ID'),
    sessionID: urlParams.get('SESSION_ID')
  };
}

const agesInMonths = function(rawSurveyData: any){
  let rawAgeData = rawSurveyData.filterCustom((x: any) => x.response && Object.keys(x.response).includes("ChildAge")).values()[0].response.ChildAge;
  console.log(rawAgeData);
  let childAge:null|number = null;
  let childSiblingAges = null;
  try {
    let childAges = rawAgeData.split(",");
    // Mapping the surveyed child's age to months
    childAge = ageInMonths(childAges[0]); 
    if (childAges.length > 1) {
      childSiblingAges = childAges.slice(1).map((x: string) => ageInMonths(x));
    }
  }
  catch (err) {
    console.log(`Error parsing child age: ${err}\nUsing default null value for child ages`);
  }
  return [childAge, childSiblingAges];
}

const ageInMonths = function(ageString: string){
  const [years, months] = ageString.split(";").map(Number);
  return years * 12 + months;
}
