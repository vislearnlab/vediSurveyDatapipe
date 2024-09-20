import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 9000;

// Location of credentials
const credentials = '../credentials'
const options = {
  key: fs.readFileSync(`${credentials}ssl_key.pem`),
  cert: fs.readFileSync(`${credentials}ssl_cert.pem`),
}

// setup server-side port using credentials
const server = https.createServer(options, app);
const io = new SocketIOServer(server);

app.use(express.static(__dirname));

// Listen to incoming requests
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Listen to port on the server
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});