// src/plugins/chat.ts
import { FastifyPluginAsync } from 'fastify';
//import websocket from '@fastify/websocket';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface ChatMessage {
  conversationId: string;
  senderId: string;
  body: string;
}

const chatPlugin: FastifyPluginAsync = async (fastify) => {
 // fastify.register(websocket);

  fastify.get('/ws', { websocket: true }, async (connection, req) => {
    const { socket } = connection;

    // ✅ 1. Extract JWT from Sec-WebSocket-Protocol (WS doesn't allow headers)
    const token = req.headers['sec-websocket-protocol'];
    if (!token || typeof token !== 'string') {
      socket.close(1008, 'Missing JWT');
      return;
    }

    let user: any;
    try {
      user = await fastify.jwt.verify(token);
      socket.send(JSON.stringify({ type: 'welcome', user }));
    } catch (err) {
      socket.close(1008, 'Invalid JWT');
      return;
    }

    // ✅ 2. Subscribe to this user's conversations
    const sub = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    const channel = `chat:user:${user.id}`; // or use conversationId dynamically

    await sub.subscribe(channel);
    sub.on('message', (_, payload) => {
      socket.send(payload);
    });

    // ✅ 3. Listen for incoming messages and publish
    socket.on('message', (data: Buffer) => {
      try {
        const msg: ChatMessage = JSON.parse(data.toString());

        // ✅ Real implementation should validate msg fields here

        // Publish to conversation channel
        redis.publish(`chat:${msg.conversationId}`, JSON.stringify(msg));
      } catch (err) {
        socket.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    // ✅ 4. Clean up on disconnect
    socket.on('close', () => {
      sub.disconnect();
    });
  });
};

export default chatPlugin;
