import { Questions } from './survey/experiment';
import 'vite/client';
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URL: string;
            DATABASE: string;
            COLLECTION: string;
            VITE_BASE_PATH: string;
            NODE_ENV: 'development' | 'production';
            SCREENED_OUT_CODE: string;
            COMPLETION_CODE: string;
            CREDENTIALS_PATH?: string;
            PORT?: string;
        }
    }
    namespace Study {
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
            prolificInformation: ProlificInformation;
            // Age in months
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