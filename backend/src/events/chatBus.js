import { redisPub, redisSub } from '../config/clients.js';

const CHANNEL = process.env.CHAT_CHANNEL || 'ycyw:chat:messages';

export async function publishChatMessage(payload) {
  await redisPub.publish(CHANNEL, JSON.stringify(payload));
}

export async function subscribeChatMessages(onMessage) {
  await redisSub.subscribe(CHANNEL, (rawMessage) => {
    try {
      const parsed = JSON.parse(rawMessage);
      onMessage(parsed);
    } catch (err) {
      console.error('Erreur de parsing événement tchat:', err);
    }
  });
}