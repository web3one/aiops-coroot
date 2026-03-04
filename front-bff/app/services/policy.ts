import { prisma } from '@/app/lib/prisma';

/**
 * PolicyService — manages bucket policies in PostgreSQL.
 */
export class PolicyService {

    /**
     * Get bucket policy map: { "[arn:aws:iam::orgId:user/projectId:account]": ["[perm1 perm2]", ...] }
     */
    public async getPolicyWithName(bucketName: string, orgId: string, projectId: string): Promise<Record<string, string[]>> {
        const policyMap: Record<string, string[]> = {};

        try {
            const uid = `${orgId}$${projectId}`;
            const policies = await prisma.ossBucketPolicy.findMany({
                where: {
                    bucket: {
                        name: bucketName,
                        owner: { uid },
                    },
                },
            });

            for (const policy of policies) {
                // actions is stored as JSON string of action array
                const actions: string[] = JSON.parse(policy.actions);
                const actionsStr = `[${actions.join(' ')}]`;
                const key = `[${policy.principal}]`;
                if (!policyMap[key]) {
                    policyMap[key] = [];
                }
                policyMap[key].push(actionsStr);
            }
        } catch (e) {
            console.error(`getPolicyWithName(${bucketName}) error:`, e);
        }

        return policyMap;
    }

    /**
     * Role name to S3 actions mapping.
     */
    private roleActions: Record<string, string[]> = {
        'oss-bucketadmin': ['s3:GetBucketPolicy', 's3:PutBucketPolicy', 's3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket', 's3:GetBucketLocation', 's3:ListBucketMultipartUploads', 's3:AbortMultipartUpload'],
        'oss-readwrite': ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:GetBucketLocation', 's3:ListBucketMultipartUploads', 's3:AbortMultipartUpload'],
        'oss-readonly': ['s3:GetObject', 's3:ListBucket', 's3:GetBucketLocation'],
    };

    /**
     * Set bucket policy for given users with a specific role.
     */
    public async setBucketPolicy(
        bucketName: string,
        userIds: string[],
        role: string,
        orgId: string,
        projectId: string,
    ): Promise<void> {
        const actions = this.roleActions[role];
        if (!actions) {
            console.error(`Unknown role: ${role}`);
            return;
        }

        const uid = `${orgId}$${projectId}`;
        const bucket = await prisma.ossBucket.findFirst({
            where: { name: bucketName, owner: { uid } },
        });

        if (!bucket) {
            console.error(`setBucketPolicy: bucket ${bucketName} not found`);
            return;
        }

        for (const userId of userIds) {
            const principal = `arn:aws:iam::${orgId}:user/${projectId}:${userId}`;
            await prisma.ossBucketPolicy.upsert({
                where: {
                    bucketId_principal: {
                        bucketId: bucket.id,
                        principal,
                    },
                },
                create: {
                    bucketId: bucket.id,
                    principal,
                    actions: JSON.stringify(actions),
                },
                update: {
                    actions: JSON.stringify(actions),
                },
            });
        }
    }

    /**
     * Remove a user from the bucket policy.
     */
    public async deleteBySubuser(
        bucketName: string,
        userId: string,
        orgId: string,
        projectId: string,
    ): Promise<void> {
        const uid = `${orgId}$${projectId}`;
        const bucket = await prisma.ossBucket.findFirst({
            where: { name: bucketName, owner: { uid } },
        });

        if (!bucket) return;

        const principal = `arn:aws:iam::${orgId}:user/${projectId}:${userId}`;
        await prisma.ossBucketPolicy.deleteMany({
            where: {
                bucketId: bucket.id,
                principal,
            },
        });
    }
}

export const policyService = new PolicyService();
