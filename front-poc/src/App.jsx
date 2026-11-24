import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

const TEST_USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    label: 'Client',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    label: 'Agent',
  },
];

export default function App() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sessionId, setSessionId] = useState('session-demo-1');
  const [userId, setUserId] = useState(TEST_USERS[0].id);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');

  // Connexion unique au serveur WebSocket
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => setConnected(true));
    newSocket.on('disconnect', () => setConnected(false));

    newSocket.on('chat:history', (historyRows) => {
      setMessages(historyRows);
    });

    newSocket.on('chat:message', (incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Rejoindre la session dès que la socket est prête ou que sessionId change
  useEffect(() => {
    if (!socket || !connected || !sessionId.trim()) return;
    setMessages([]);
    socket.emit('chat:join', { session_id: sessionId.trim() });
  }, [socket, connected, sessionId]);

  function handleSend(e) {
    e.preventDefault();
    if (!socket || !draft.trim() || !sessionId.trim()) return;

    socket.emit('chat:send', {
      session_id: sessionId.trim(),
      user_id: userId,
      message_content: draft.trim(),
    });

    setDraft('');
  }

  return (
    <main style={{ maxWidth: 800, margin: '1rem auto', fontFamily: 'sans-serif' }}>
      <h1>PoC Tchat — Your Car Your Way</h1>
      <p>
        Statut WebSocket :{' '}
        <strong>{connected ? 'Connecté (3001)' : 'Déconnecté'}</strong>
      </p>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <label>
          Session ID :{' '}
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          />
        </label>

        <label>
          Expéditeur :{' '}
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {TEST_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        style={{
          border: '1px solid #ccc',
          padding: '1rem',
          minHeight: 240,
          maxHeight: 360,
          overflowY: 'auto',
          marginBottom: '1rem',
          background: '#fafafa',
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: '#666' }}>Aucun message pour cette session.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: '0.75rem' }}>
              <strong>[{msg.role}]</strong> <span>{msg.message_content}</span>
              <div style={{ fontSize: '0.75rem', color: '#777' }}>
                {new Date(msg.sent_at).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrire un message..."
          style={{ flex: 1, padding: '0.5rem' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Envoyer
        </button>
      </form>
    </main>
  );
}