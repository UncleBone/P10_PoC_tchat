import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { initConnections } from './config/clients.js';
import { setupChatSocket } from './sockets/chatSocket.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const port = process.env.PORT || 3001;

initConnections()
  .then(async () => {
    await setupChatSocket(io);
    server.listen(port, () => {
      console.log(`Serveur PoC tchat démarré sur http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Échec de démarrage du backend:', err);
    process.exit(1);
  });