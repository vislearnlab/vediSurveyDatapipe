import {Questions} from './survey/constants';
import 'vite/client';
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // MongoDB connection details, data is placed in the collection specified in the database
            MONGO_URL: string;
            DATABASE: string;
            COLLECTION: string;
            ENVIRONMENT: 'development' | 'production';
            // 'Vite' keyword added to the front of the variable names so they can be accessed in the front-end
            // Prolific codes used to end or screen out of current study
            VITE_SCREENED_OUT_CODE: string;
            VITE_COMPLETION_CODE: string;
            VITE_BASE_PATH: string;
            // Path to SSL credentials. Defaults to 'credentials/' in the base directory if not set
            CREDENTIALS_PATH?: string;
            // Port is set to 9000 by default. Please make sure you use a port that is not used by another service on the server
            PORT?: string;
        }
    }
    namespace Study {
        // Information provided by Prolific in the provided URL
        interface ProlificInformation {
            prolificID: string | null;
            sessionID: string | null;
            studyID: string | null;
        }
    }
    namespace VEDI {
        interface QuestionAnswerPair {
            [key: Questions]: string | string[];
        }
        interface SurveyData {
            prolificInformation?: ProlificInformation;
            // Ages in months
            childAge: number;
            childSiblingAges: number[];
            trialData: TrialData[];
        }
        type TrialData = QuestionAnswerPair &  {
            object: string;
            // Time taken to answer all survey questions related to given object
            reactionTime: number,
            trialIndex: number
        }
    }
}

export {}
