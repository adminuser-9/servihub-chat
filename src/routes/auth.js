"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const authRoutes = async (fastify) => {
    // Login route
    fastify.post('/api/login', async (req, reply) => {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!passwordMatch) {
            return reply.code(401).send({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id.toString(),
            email: user.email,
            name: user.name,
        }, JWT_SECRET, { expiresIn: '1d' });
        return { token };
    });
    // Register a customer or agent
    fastify.post('/api/register', async (req, reply) => {
        const { email, password, role } = req.body;
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            return reply.code(400).send({ error: 'Email already in use' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const newUser = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                name: role === 'AGENT' ? 'Agent' : 'Customer',
            },
        });
        return reply.code(201).send({ id: newUser.id.toString(), email: newUser.email });
    });
};
exports.default = authRoutes;
