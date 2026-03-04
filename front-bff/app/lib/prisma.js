"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
var client_1 = require("@prisma/client");
var adapter_pg_1 = require("@prisma/adapter-pg");
var pg_1 = require("pg");
var globalForPrisma = global;
function createPrismaClient() {
    var connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    console.log('Prisma connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'));
    var pool = new pg_1.default.Pool({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false },
    });
    var adapter = new adapter_pg_1.PrismaPg(pool);
    return new client_1.PrismaClient({ adapter: adapter });
}
var prisma = globalForPrisma.prisma || createPrismaClient();
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
