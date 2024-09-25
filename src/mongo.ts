import { MongoClient } from 'mongodb';
import assert from 'assert';
import { wss } from './server';
import 'dotenv/config';

const mongoURL: string = process.env.MONGO_URL; 
const databaseName: string = process.env.DATABASE;
const collectionName: string = process.env.COLLECTION; 

// Still need to figure out use-case for Extract function
const Extract = async (): Promise<void> => {
  try {
    // connect to mongo server
    const client = await MongoClient.connect(mongoURL);
    // establish which collection we're using (which is in a database)
    const collection = client.db(databaseName).collection(collectionName);
    // extract all documents from collection
    const docs = await collection.find().toArray();
    // set index of random document
    const random_document = Math.floor(Math.random() * docs.length);
    // server side console log
    console.log('server side: document extracted from mongodb:\n', docs[random_document]);
    // send document to client (this part should be handled in server.ts)
    wss.emit('return_document_from_database', docs[random_document]);
    client.close();
  } catch (err) {
    console.error('Error connecting to MongoDB or fetching documents:', err);
  }
};

const Insert = async (document: object): Promise<void> => {
    try {
      const client = await MongoClient.connect(mongoURL);
      const collection = client.db(databaseName).collection(collectionName);
      const result = await collection.insertOne(document);
      assert.strictEqual(true, result.acknowledged);
      console.log('Document inserted successfully:', document);
      client.close();
    } catch (err) {
      console.error('Error connecting to MongoDB or inserting document:', err);
    }
  };
  

export { Extract, Insert };