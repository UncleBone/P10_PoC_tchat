import crypto from 'crypto';
import { db } from '../config/clients.js';
import { publishChatMessage, subscribeChatMessages } from '../events/chatBus.js';

export async function setupChatSocket(io) {
  // Abonnement unique au bus d'événements pour diffuser vers les sockets
  await subscribeChatMessages((message) => {
    io.to(message.session_id).emit('chat:message', message);
  });

  io.on('connection', (socket) => {
    console.log(`Socket connecté : ${socket.id}`);

    // Rejoindre une conversation (session_id) et charger l'historique récent
    socket.on('chat:join', async ({ session_id }) => {
      if (!session_id) return;
      socket.join(session_id);

      const { rows } = await db.query(
        `SELECT m.id, m.user_id, u.role, m.session_id, m.message_content, m.sent_at
         FROM chat_messages m
         JOIN users u ON u.id = m.user_id
         WHERE m.session_id = $1
         ORDER BY m.sent_at ASC
         LIMIT 50`,
        [session_id]
      );

      socket.emit('chat:history', rows);
    });

    // Réception d'un nouveau message
    socket.on('chat:send', async ({ session_id, user_id, message_content }) => {
      if (!session_id || !user_id || !message_content?.trim()) return;

      const messageId = crypto.randomUUID();

      const { rows } = await db.query(
        `INSERT INTO chat_messages (id, user_id, session_id, message_content)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, session_id, message_content, sent_at`,
        [messageId, user_id, session_id, message_content.trim()]
      );

      const userRes = await db.query('SELECT role FROM users WHERE id = $1', [user_id]);
      const role = userRes.rows[0]?.role || 'client';

      const eventPayload = {
        ...rows[0],
        role,
      };

      await publishChatMessage(eventPayload);
    });

    socket.on('disconnect', () => {
      console.log(`Socket déconnecté : ${socket.id}`);
    });
  });
}