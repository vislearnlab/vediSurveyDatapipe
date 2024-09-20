import 'jspsych/css/jspsych.css'
import './styles.css';
import '@jspsych/plugin-survey/css/survey.css'
import {initJsPsych} from 'jspsych';
import HtmlKeyboardResponsePlugin from '@jspsych/plugin-html-keyboard-response';
import HtmlButtonResponsePlugin from '@jspsych/plugin-html-button-response';
import Survey from '@jspsych/plugin-survey';
import { io } from 'socket.io-client';

const OBJECTS = ["ball", "cat", "bottle", "hand", "park", "lion", "spoon", "butterfly", "button"]//"staircase", "car", "lamp", "slide", "bucket", "kitchen", 

const socket = io();
const jsPsych = initJsPsych({
  show_progress_bar: true,
  auto_update_progress_bar: true,
  message_progress_bar: 'Survey Progress',
  on_finish:  function() {
    // window.location.href = "https://app.prolific.co/submissions/XXXXXXX" // commented out for testing
    window.location.href = "https://google.com"
    //jsPsych.data.displayData();
  }
});

const timeline = []

const instructions = {
  type: HtmlKeyboardResponsePlugin,
  stimulus: "<p>In this survey, you will answer questions relating to the home environment of your child. Press any key to begin.</p>"
}

const eligibilityCheck = {
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

const save_trial_to_database = function(trial_data: any){
  socket.emit('insert', trial_data)
}

const failedSurveyQuestion = {
  type: HtmlButtonResponsePlugin,
  choices: ["Continue"],
  stimulus: `<p>Sorry, you are not eligible for this study.</p> 
  <p>If something went wrong, please contact the researchers through the Prolific messaging system.</p>
             <p>Click 'Continue' to be redirected to Prolific.</p>`,
  on_finish: function(data:any) {
    jsPsych.finishTrial();
    window.location.href = "https://google.com";
  },
  post_trial_gap: 2000
}

const elibilityQuestion = {
  timeline: [failedSurveyQuestion],
  conditional_function: function(){
      // if participant does not have a child in the required age range
      const data = jsPsych.data.get().filterCustom((x: any) => Object.keys(x.response).includes("ChildEligibility")).values();
      return data.length > 0 && data[0].response.ChildEligibility == "No";
  }
}

const childAgeQuestion = {
  type: Survey,
  survey_json: {
    showQuestionNumbers: false,
    elements: [
      {
        type: 'text',
        title: 'How old is your child? Please enter as x;y where x is what age they are and y is the number of months it has been since they turned that age. If you have other children enter all of their ages separated by commas (e.g. 0;6,5;9)',
        name: 'ChildEligibility'
      }
    ]
  },
  post_trial_gap: 2000
}
const surveyProcedure = jsPsych.randomization.shuffle(surveyQuestions())

const finalBlock = {
  type: HtmlKeyboardResponsePlugin,
  stimulus: "<p>Thanks for answering our questions. Press any key to complete the experiment. Thank you!</p>"
}

timeline.push(instructions, eligibilityCheck, elibilityQuestion, childAgeQuestion, surveyProcedure, finalBlock);

jsPsych.run(timeline);

// Create a list of survey questions for each object defined in OBJECTS
function surveyQuestions() {
  let surveyTrials = [];
  for (let index = 0; index < OBJECTS.length; index++) {
    let survey_json = {
      showQuestionNumbers: false,
      elements:
        [
          {
            type: 'checkbox',
            title: `In what formats has your child seen a ${OBJECTS[index]}?`, 
            name: 'BallFormats', 
            choices: ['A drawing', 'A toy', 'A photo', 'A video', 'In real life', `Never seen a ${OBJECTS[index]}`], 
            isRequired: true
          },
          {
            type: 'radiogroup',
            title: `How many different types of a ${OBJECTS[index]} has your child seen in real life (for example: red ball, blue ball)?`, 
            name: 'FormatFrequency',
            transposeData: true,
            colCount: 0,
            choices: ['0', '1', '2', '<5', '<10', '10 or more'], 
            isRequired: true
          }, 
          {
            type: 'radiogroup',
            title: `How often has your child seen a ${OBJECTS[index]}`, 
            name: 'FormatFrequency',
            transposeData: true,
            colCount: 0,
            choices: ['Never', 'Once or twice', 'Every few months', 'Monthly', 'Weekly', 'Daily', 'Multiple times a day'], 
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