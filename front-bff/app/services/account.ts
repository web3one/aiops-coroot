import { prisma } from '@/app/lib/prisma';
import { KeyData } from './key';

export class AccountService {

    /**
     * Create a full-control subuser for the given userId.
     */
    public async createFullControlUser(userId: string, tenant: string, project: string, userkeys: KeyData[]) {
        if (!tenant) return;
        const uid = `${tenant}$${project}`;

        try {
            // Ensure the user account exists
            const user = await prisma.ossUser.upsert({
                where: { uid },
                create: {
                    uid,
                    orgId: tenant,
                    projectId: project,
                    displayName: project,
                    email: `${project}@founder.com`,
                },
                update: {},
            });

            // Upsert subuser with full access
            await prisma.ossSubuser.upsert({
                where: {
                    userId_subuser: {
                        userId: user.id,
                        subuser: userId,
                    },
                },
                create: {
                    userId: user.id,
                    subuser: userId,
                    access: 'full',
                },
                update: {
                    access: 'full',
                },
            });

            // Add S3 keys
            for (const key of userkeys) {
                try {
                    await prisma.ossKey.upsert({
                        where: { accessKey: key.accessKeyId },
                        create: {
                            userId: user.id,
                            subuser: userId,
                            accessKey: key.accessKeyId,
                            secretKey: key.accessKeySecret,
                        },
                        update: {},
                    });
                } catch (e) {
                    console.error(`Failed to create key for ${userId}:`, e);
                }
            }
        } catch (error) {
            console.error('createFullControlUser error:', error);
            throw error;
        }
    }

    /**
     * Remove full-control from a subuser (set access to none).
     */
    public async removeFullControl(userId: string, tenant: string, project: string) {
        if (!tenant) return;
        const uid = `${tenant}$${project}`;

        try {
            const user = await prisma.ossUser.findUnique({ where: { uid } });
            if (!user) return;

            await prisma.ossSubuser.updateMany({
                where: {
                    userId: user.id,
                    subuser: userId,
                },
                data: { access: 'none' },
            });
        } catch (e) {
            console.error('removeFullControl error:', e);
            throw e;
        }
    }
}

export const accountService = new AccountService();
