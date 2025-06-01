import WebSocket from 'ws';
import jwt from 'jsonwebtoken';

const token = jwt.sign({ id: '1', email: 'test@test.com', name: 'Test' }, 'supersecret');

test('WebSocket connects and receives typing status', (done) => {
  const ws = new WebSocket(`wss://servihub-chat.onrender.com/ws?conversationId=1&token=${token}`);

  ws.on('open', () => {
    ws.send(JSON.stringify({ type: 'typing', conversationId: 1 }));
  });

  ws.on('message', (data) => {
    const parsed = JSON.parse(data.toString());
    expect(parsed.type).toBe('typing');
    expect(parsed.conversationId).toBe(1);
    done();
    ws.close();
  });

  ws.on('error', (err) => done(err));
});
