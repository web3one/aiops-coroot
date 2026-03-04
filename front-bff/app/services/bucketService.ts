import { prisma } from '@/app/lib/prisma';

export interface BucketInfo {
    ID: string;
    name: string;
    size: number;
    objectNum: number;
    address: string;
    CreatedAt: string;
}

export class BucketService {

    constructor() { }

    /**
     * Ensure an OssUser exists for the given orgId/projectId. Returns the user record.
     */
    private async ensureUser(orgId: string, projectId: string) {
        const uid = `${orgId}$${projectId}`;
        return prisma.ossUser.upsert({
            where: { uid },
            create: {
                uid,
                orgId,
                projectId,
                displayName: projectId,
                email: `${projectId}@founder.com`,
            },
            update: {},
        });
    }

    /**
     * List all buckets for a tenant (orgId$projectId).
     */
    public async listBuckets(orgId: string, projectId: string): Promise<BucketInfo[]> {
        try {
            const user = await this.ensureUser(orgId, projectId);
            const buckets = await prisma.ossBucket.findMany({
                where: { ownerId: user.id },
                orderBy: { createdAt: 'desc' },
            });

            return buckets.map((b: any) => this.mapBucketInfo(b));
        } catch (error) {
            console.error('listBuckets error:', error);
            return [];
        }
    }

    /**
     * Get a single bucket's details.
     */
    public async getBucket(bucketName: string, orgId: string, projectId: string): Promise<BucketInfo | null> {
        try {
            const user = await this.ensureUser(orgId, projectId);
            const bucket = await prisma.ossBucket.findFirst({
                where: { name: bucketName, ownerId: user.id },
            });

            if (!bucket) return null;
            return this.mapBucketInfo(bucket);
        } catch (error) {
            console.error(`getBucket(${bucketName}) error:`, error);
            return null;
        }
    }

    /**
     * Create a new bucket.
     */
    public async createBucket(bucketName: string, orgId: string, projectId: string): Promise<boolean> {
        try {
            const user = await this.ensureUser(orgId, projectId);
            await prisma.ossBucket.create({
                data: {
                    name: bucketName,
                    ownerId: user.id,
                    size: 0,
                    objectNum: 0,
                },
            });
            return true;
        } catch (error) {
            console.error(`createBucket(${bucketName}) error:`, error);
            return false;
        }
    }

    /**
     * Delete a bucket.
     */
    public async deleteBucket(bucketName: string, orgId: string, projectId: string): Promise<{ success: boolean; msg?: string }> {
        try {
            const user = await this.ensureUser(orgId, projectId);
            await prisma.ossBucket.deleteMany({
                where: { name: bucketName, ownerId: user.id },
            });
            return { success: true };
        } catch (error: any) {
            console.error(`deleteBucket(${bucketName}) error:`, error);
            return { success: false, msg: error.message || '删除失败' };
        }
    }

    /**
     * Validate bucket name — check if it already exists.
     */
    public async validateBucket(bucketName: string, orgId: string, projectId: string): Promise<{ valid: boolean; msg?: string }> {
        try {
            const user = await this.ensureUser(orgId, projectId);
            const existing = await prisma.ossBucket.findFirst({
                where: { name: bucketName, ownerId: user.id },
            });
            if (existing) {
                return { valid: false, msg: `存储桶 "${bucketName}" 已存在` };
            }
            return { valid: true };
        } catch (error: any) {
            return { valid: false, msg: error.message || '验证失败' };
        }
    }

    /**
     * Get overview data — aggregate bucket count and size per user/project.
     */
    public async getOverview(orgId: string): Promise<any[]> {
        try {
            const users = await prisma.ossUser.findMany({
                where: { orgId },
                include: {
                    buckets: true,
                },
            });

            return users.map((user: any) => ({
                ID: user.id,
                project: user.displayName || user.projectId,
                bucketNum: user.buckets.length,
                size: Math.round(user.buckets.reduce((sum: number, b: any) => sum + b.size, 0) * 100) / 100,
            }));
        } catch (error) {
            console.error('getOverview error:', error);
            return [];
        }
    }

    /**
     * Map DB bucket record to BucketInfo.
     */
    private mapBucketInfo(bucket: any): BucketInfo {
        return {
            ID: bucket.name || bucket.id,
            name: bucket.name,
            size: Math.round(bucket.size * 100) / 100,
            objectNum: bucket.objectNum || 0,
            address: bucket.name,
            CreatedAt: bucket.createdAt?.toISOString() || '',
        };
    }
}

export const bucketService = new BucketService();
