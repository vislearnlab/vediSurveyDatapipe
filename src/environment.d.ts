declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGO_URL: string;
            DATABASE: string;
            COLLECTION: string;
            PORT?: string;
        }
    }
}

export {}