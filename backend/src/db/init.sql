CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'agent'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    session_id VARCHAR(100) NOT NULL,
    message_content TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_sent_at
    ON chat_messages (session_id, sent_at);

-- Jeu de test minimal pour valider la PoC sans écran de login
INSERT INTO users (id, email, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'client.test@ycyw.fr', 'client'),
    ('22222222-2222-2222-2222-222222222222', 'agent.test@ycyw.fr', 'agent')
ON CONFLICT (id) DO NOTHING;