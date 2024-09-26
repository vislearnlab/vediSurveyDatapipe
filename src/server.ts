import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import 'dotenv/config';
import { WebSocketServer } from 'ws';
import { Extract, Insert } from './mongo'; 

const app = express();
const PORT = process.env.PORT || 9000;

let server;
console.log(process.cwd());

if (process.env.ENVIRONMENT === 'production') {
  // Location of credentials
  const credentials = process.env.CREDENTIALS_PATH || 'credentials/';
  const options = {
    key: fs.readFileSync(`${credentials}ssl_key.pem`),
    cert: fs.readFileSync(`${credentials}ssl_cert.pem`),
  }
  // setup server-side port using credentials
  server = https.createServer(options, app);
} else {
  // setup insecure http server if in development
  server = http.createServer(app);
}

export const wss = new WebSocketServer({ server });

app.use(express.static(__dirname));

app.get('/', (req: Request, res: Response) => {
  res.redirect(`/${process.env.VITE_BASE_PATH}`);
});

// Listen to incoming requests
app.get(`/${process.env.VITE_BASE_PATH}/*`, (req: Request, res: Response) => {
  const filePath = req.params[0];
  res.sendFile(path.join(__dirname, '..', 'dist', filePath));
});

app.get(`/${process.env.VITE_BASE_PATH}`, (req: Request, res: Response) => {
  // const prolificInformation = {
  //   prolificID: req.query.PROLIFIC_PID,
  //   sessionID: req.query.SESSION_ID,
  //   studyID: req.query.STUDY_ID
  // }
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/*', (req: Request, res: Response) => {
   res.send('Incorrect URL');
});

// Listen to port on the server
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

wss.on('connection', (ws: any) => {
  console.log("Listening to socket on server");
  ws.on('message', (message: any) => {
    const data = JSON.parse(message.toString());
      // insertion protocol on hearing 'insert' from client
    if (data.action === 'insert') {
      // server side console log
      console.log('server side: data received:\n ' + JSON.stringify(data.data));
      // call function to insert data into mongo 
      Insert(data.data);
    // extraction procotol on hearing 'extract' from client
    } else if (data.action === 'extract') {
      // call function to extract data from mongo
      Extract();
    }
  });
});
