"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const ioredis_1 = __importDefault(require("ioredis"));
const chat_1 = __importDefault(require("./plugins/chat"));
const conversations_1 = __importDefault(require("./routes/conversations"));
const business_1 = require("./routes/business");
const auth_1 = __importDefault(require("./routes/auth"));
const static_1 = __importDefault(require("@fastify/static"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config();
const app = (0, fastify_1.default)({ logger: true });
const redisClient = new ioredis_1.default(process.env.REDIS_URL ?? 'redis://localhost:6379');
const start = async () => {
    try {
        // ← Move your cors registration inside start
        // Other plugins
        await app.register(websocket_1.default);
        await app.register(jwt_1.default, { secret: process.env.JWT_SECRET || 'supersecret' });
        await app.register(rate_limit_1.default, { max: 20, timeWindow: '5s', redis: redisClient });
        await app.register(cors_1.default, {
            origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5174'],
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        });
        app.setNotFoundHandler((_req, reply) => {
            const indexPath = path_1.default.join(__dirname, '../client/dist/index.html');
            reply.type('text/html').send(fs_1.default.readFileSync(indexPath));
        });
        app.register(static_1.default, {
            root: path_1.default.join(__dirname, '../client/dist'),
            prefix: '/',
        });
        // Routes
        app.get('/health', async () => ({ status: 'ok' }));
        app.register(conversations_1.default);
        app.register(auth_1.default);
        app.register(business_1.businessRoutes);
        app.register(chat_1.default, { redis: redisClient });
        // Start listening
        const port = Number(process.env.PORT) || 3000;
        await app.listen({ port, host: '0.0.0.0' });
        console.log('Server running at http://localhost:3000');
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
