import { createRequire } from "module";
import crypto from "crypto";

// Prisma isn't reliably available in this execution environment (missing runtime artifacts),
// so we fall back to an in-memory store that matches the subset of the Prisma API we use.
const require = createRequire(import.meta.url) as unknown as (id: string) => any;

function newId(): string {
  return crypto.randomUUID();
}

type User = { id: string; role: "consumer" | "clinician" | "admin" };
type Consent = { userId: string; storePHI: boolean };
type Conversation = { id: string; userId: string; mode: "consumer" | "clinician"; createdAt: Date; updatedAt: Date };
type Message = {
  id: string;
  conversationId: string;
  senderRole: "user" | "assistant";
  contentEncrypted?: string | null;
  contentDeidentified: string;
  createdAt: Date;
};
type AuditLog = { id: string; userId?: string; action: string; meta?: string | null; createdAt: Date };

function createInMemoryPrisma() {
  const users: User[] = [];
  const consents: Consent[] = [];
  const conversations: Conversation[] = [];
  const messages: Message[] = [];
  const auditLogs: AuditLog[] = [];

  return {
    user: {
      findFirst: async (args: any) => {
        const role = args?.where?.role;
        const select = args?.select;
        const u = users.find((x) => x.role === role);
        if (!u) return null;
        if (select?.id) return { id: u.id };
        return u;
      },
      create: async (args: any) => {
        const role = args?.data?.role as User["role"];
        const u: User = { id: newId(), role };
        users.push(u);
        return u;
      }
    },
    consent: {
      upsert: async (args: any) => {
        const userId = args?.where?.userId as string;
        const storePHI = args?.update?.storePHI ?? args?.create?.storePHI ?? false;
        const existing = consents.find((c) => c.userId === userId);
        if (existing) {
          existing.storePHI = storePHI;
          return existing;
        }
        const c: Consent = { userId, storePHI };
        consents.push(c);
        return c;
      },
      create: async (args: any) => {
        const userId = args?.data?.userId as string;
        const storePHI = args?.data?.storePHI as boolean;
        const existing = consents.find((c) => c.userId === userId);
        if (existing) {
          throw new Error("Consent already exists");
        }
        const c: Consent = { userId, storePHI };
        consents.push(c);
        return c;
      }
    },
    conversation: {
      create: async (args: any) => {
        const userId = args?.data?.userId as string;
        const mode = args?.data?.mode as Conversation["mode"];
        const now = new Date();
        const conv: Conversation = {
          id: newId(),
          userId,
          mode,
          createdAt: now,
          updatedAt: now
        };
        conversations.push(conv);
        return conv;
      },
      findFirst: async (args: any) => {
        const id = args?.where?.id as string;
        const includeMessages = Boolean(args?.include?.messages);
        const conv = conversations.find((c) => c.id === id) ?? null;
        if (!conv) return null;
        if (!includeMessages) return conv;
        const convMessages = messages.filter((m) => m.conversationId === id);
        return {
          ...conv,
          messages: convMessages
        };
      }
    },
    message: {
      create: async (args: any) => {
        const conversationId = args?.data?.conversationId as string;
        const senderRole = args?.data?.senderRole as Message["senderRole"];
        const contentEncrypted = args?.data?.contentEncrypted ?? null;
        const contentDeidentified = args?.data?.contentDeidentified as string;
        const msg: Message = {
          id: newId(),
          conversationId,
          senderRole,
          contentEncrypted,
          contentDeidentified,
          createdAt: new Date()
        };
        messages.push(msg);
        return msg;
      }
    },
    auditLog: {
      create: async (args: any) => {
        const entry: AuditLog = {
          id: newId(),
          userId: args?.data?.userId as string | undefined,
          action: args?.data?.action as string,
          meta: (args?.data?.meta as string | undefined) ?? null,
          createdAt: new Date()
        };
        auditLogs.push(entry);
        return entry;
      }
    }
  };
}

let prisma: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const mod = require("@prisma/client");
  const PrismaClient = mod?.PrismaClient;
  if (!PrismaClient) throw new Error("PrismaClient constructor not found");

  const globalForPrisma = globalThis as unknown as { prisma?: any };
  prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
    });
  if (!globalForPrisma.prisma) globalForPrisma.prisma = prisma;
} catch (e) {
  // eslint-disable-next-line no-console
  console.warn("[api] Prisma unavailable; using in-memory store.");
  prisma = createInMemoryPrisma();
}

export { prisma };

