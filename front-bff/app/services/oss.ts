import { prisma } from '@/app/lib/prisma';

export interface UserDto {
    account: string;
    name: string;
    email: string;
    id: string;
    role: string;
    hasKey: boolean;
}

export interface ProjectMember {
    id: string;
    org: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    account: string;
    name: string;
    email: string;
    projectId: string;
}

export interface ProjectMemberDto {
    status: number;
    message: string;
    items: ProjectMember[];
}

// Role name constants (matches Go's RoleName config)
export const RoleName = {
    CnBucketAdmin: '桶管理员',
    CnReadWrite: '读写',
    CnReadOnly: '只读',
    RoleProjectAdmin: 'project-admin',
    RoleProjectUser: 'project-user',
    BucketUser: 'bucket-user',
    OptionalBucketUser: 'optional-bucket-user',
    RoleBucketAdmin: 'oss-bucketadmin',
};

// Permission groups for role recognition (mirrors Go's GetRoleName)
const permissionGroups: Record<string, string[]> = {
    [RoleName.CnBucketAdmin]: ['s3:GetBucketPolicy', 's3:PutBucketPolicy', 's3:PutObject', 's3:GetBucketLocation'],
    [RoleName.CnReadWrite]: ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:GetBucketLocation', 's3:ListBucketMultipartUploads', 's3:AbortMultipartUpload'],
    [RoleName.CnReadOnly]: ['s3:GetObject', 's3:ListBucket', 's3:GetBucketLocation'],
};

// Role keys in priority order
const roleKeys = [RoleName.CnBucketAdmin, RoleName.CnReadWrite, RoleName.CnReadOnly];

export class OssService {

    /**
     * Parse permission strings like "[s3:GetObject s3:PutObject]" into a Set.
     */
    private parsePermissions(permissionStrs: string[]): Set<string> {
        const result = new Set<string>();
        for (const str of permissionStrs) {
            const trimmed = str.replace(/^\[/, '').replace(/\]$/, '');
            if (!trimmed) continue;
            for (const perm of trimmed.split(' ')) {
                if (perm) result.add(perm);
            }
        }
        return result;
    }

    /**
     * Get role name based on S3 permission set. Mirrors Go's GetRoleName.
     */
    public getRoleName(roles: string[]): string {
        const permissionSet = this.parsePermissions(roles);

        for (const key of roleKeys) {
            const requiredPerms = permissionGroups[key];
            if (requiredPerms.every(p => permissionSet.has(p))) {
                return key;
            }
        }
        return '';
    }

    // Equivalent to GetFullControlUser in Go
    public async getFullControlUser(members: ProjectMemberDto, orgId: string, projectId: string): Promise<UserDto[]> {
        const memberMap: Record<string, ProjectMember> = {};

        for (const member of members.items || []) {
            memberMap[member.account] = member;
        }

        const users: UserDto[] = [];
        const uid = `${orgId}$${projectId}`;

        try {
            const user = await prisma.ossUser.findUnique({ where: { uid } });
            if (!user) return [];

            const subusers = await prisma.ossSubuser.findMany({
                where: { userId: user.id, access: 'full' },
            });

            for (const subuser of subusers) {
                const member = memberMap[subuser.subuser];
                if (member) {
                    users.push({
                        id: member.account,
                        account: member.account,
                        name: member.name,
                        email: member.email,
                        role: RoleName.RoleProjectAdmin,
                        hasKey: false,
                    });
                }
            }
        } catch (e) {
            console.error('getFullControlUser error:', e);
        }

        return users;
    }

    // Equivalent to GetAvailableUsers in Go
    public async getAvailableUsers(members: ProjectMemberDto, orgId: string, projectId: string): Promise<UserDto[]> {
        const uid = `${orgId}$${projectId}`;
        const users: UserDto[] = [];
        const adminSet = new Set<string>();

        try {
            const user = await prisma.ossUser.findUnique({ where: { uid } });
            if (user) {
                const subusers = await prisma.ossSubuser.findMany({
                    where: { userId: user.id, access: 'full' },
                });
                for (const sub of subusers) {
                    adminSet.add(sub.subuser);
                }
            }
        } catch (e) {
            console.error('getAvailableUsers error:', e);
        }

        for (const member of members.items || []) {
            if (!adminSet.has(member.account)) {
                users.push({
                    id: member.account,
                    account: member.account,
                    name: member.name,
                    email: member.email,
                    role: RoleName.RoleProjectUser,
                    hasKey: false,
                });
            }
        }

        return users;
    }

    // Equivalent to HasFullControl in Go
    public async hasFullControl(orgId: string, projectId: string, userId: string): Promise<boolean> {
        const uid = `${orgId}$${projectId}`;

        try {
            const user = await prisma.ossUser.findUnique({ where: { uid } });
            if (!user) return false;

            // Check if the subuser exists with 'full' access
            const subuser = await prisma.ossSubuser.findFirst({
                where: { userId: user.id, subuser: userId, access: 'full' },
            });
            if (subuser) return true;

            return false;
        } catch (e) {
            console.error('hasFullControl error:', e);
        }
        return false;
    }

    /**
     * Get bucket users with their roles based on bucket policy.
     */
    public getBucketUsers(members: ProjectMemberDto, policyMap: Record<string, string[]>, orgId: string, projectId: string): UserDto[] {
        const users: UserDto[] = [];
        const keyMap = this.getAvailableKeySync(projectId, orgId);

        for (const member of members.items || []) {
            const account = `[arn:aws:iam::${orgId}:user/${projectId}:${member.account}]`;
            const uid = `${orgId}$${projectId}:${member.account}`;

            if (policyMap[account]) {
                users.push({
                    id: member.account,
                    account: member.account,
                    name: member.name,
                    email: '',
                    role: this.getRoleName(policyMap[account]),
                    hasKey: keyMap[uid] || false,
                });
            }
        }

        return users;
    }

    /**
     * Get optional (unassigned) users that are not in the bucket policy.
     */
    public getOptionalUser(members: ProjectMemberDto, policyMap: Record<string, string[]>, orgId: string, projectId: string): UserDto[] {
        const users: UserDto[] = [];

        for (const member of members.items || []) {
            const account = `[arn:aws:iam::${orgId}:user/${projectId}:${member.account}]`;
            const role = policyMap[account];
            if (role && this.getRoleName(role) !== '') {
                continue;
            }
            users.push({
                id: member.account,
                account: member.account,
                name: member.name,
                email: '',
                role: '',
                hasKey: false,
            });
        }

        return users;
    }

    /**
     * Check if the current user is a bucket admin based on bucket policy.
     */
    public isBucketAdmin(policyMap: Record<string, string[]>, orgId: string, projectId: string, userId: string): boolean {
        const account = `[arn:aws:iam::${orgId}:user/${projectId}:${userId}]`;
        const role = policyMap[account];
        if (role) {
            return this.getRoleName(role) === RoleName.CnBucketAdmin;
        }
        return false;
    }

    /**
     * Key availability cache.
     */
    private availableKeyCache: Record<string, boolean> = {};

    private getAvailableKeySync(projectId: string, orgId: string): Record<string, boolean> {
        return this.availableKeyCache;
    }

    /**
     * Populate the key availability map from the database.
     */
    public async loadAvailableKeys(projectId: string, orgId: string): Promise<void> {
        const keyMap: Record<string, boolean> = {};
        const uid = `${orgId}$${projectId}`;

        try {
            const user = await prisma.ossUser.findUnique({ where: { uid } });
            if (user) {
                const keys = await prisma.ossKey.findMany({
                    where: { userId: user.id },
                });
                for (const key of keys) {
                    const keyUser = key.subuser ? `${uid}:${key.subuser}` : uid;
                    keyMap[keyUser] = true;
                }
            }
        } catch (e) {
            console.error('loadAvailableKeys error:', e);
        }
        this.availableKeyCache = keyMap;
    }
}

export const ossService = new OssService();
