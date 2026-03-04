import { prisma } from '@/app/lib/prisma';
import { keyService } from './key';

export interface SecretKey {
    accessKeyId: string;
    createdAt: string;
    status: string;
}

export class SecretService {

    /**
     * Get S3 keys for a tenant user from the database.
     */
    public async getKeys(orgId: string, projectId: string): Promise<{ keys: SecretKey[] }> {
        const uid = `${orgId}$${projectId}`;
        try {
            const user = await prisma.ossUser.findUnique({ where: { uid } });
            if (!user) return { keys: [] };

            const dbKeys = await prisma.ossKey.findMany({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
            });

            const keys: SecretKey[] = dbKeys.map(key => ({
                accessKeyId: key.accessKey,
                createdAt: key.createdAt.toISOString(),
                status: 'ENABLE',
            }));

            return { keys };
        } catch (error) {
            console.error('getKeys error:', error);
            return { keys: [] };
        }
    }

    /**
     * Sync keys from credential service to database.
     */
    public async syncKeys(orgId: string, projectId: string, userId: string, headers: Record<string, string>): Promise<{ success: boolean; msg?: string }> {
        try {
            // Get keys from credential service
            const credentialKeys = await keyService.getUserKey(userId, projectId, headers);

            const uid = `${orgId}$${projectId}`;

            // Ensure user exists
            const user = await prisma.ossUser.upsert({
                where: { uid },
                create: {
                    uid,
                    orgId,
                    projectId,
                    displayName: projectId,
                },
                update: {},
            });

            // Get existing keys
            const existingKeys = await prisma.ossKey.findMany({
                where: { userId: user.id },
            });
            const existingKeySet = new Set(existingKeys.map(k => k.accessKey));

            // Add missing keys
            for (const key of credentialKeys) {
                if (!existingKeySet.has(key.accessKeyId)) {
                    try {
                        await prisma.ossKey.create({
                            data: {
                                userId: user.id,
                                accessKey: key.accessKeyId,
                                secretKey: key.accessKeySecret,
                            },
                        });
                    } catch (e) {
                        console.error(`Failed to sync key ${key.accessKeyId}:`, e);
                    }
                }
            }

            return { success: true };
        } catch (error: any) {
            console.error('syncKeys error:', error);
            return { success: false, msg: error.message || '同步失败' };
        }
    }
}

export const secretService = new SecretService();
