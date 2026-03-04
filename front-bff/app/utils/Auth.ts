import { headers as nextHeaders } from "next/dist/server/request/headers";
import { ossService } from "@/app/services/oss";
import { projectService } from "@/app/services/project";
import { policyService } from "@/app/services/policy";



/**
 * 认证工具类 - Next.js 版本
 */
export class Auth {

    /** 从 IDS Token中解析出用户相关 */
    private static getAuth(authorization: string) {
        try {
            const token = Buffer.from(authorization.split('.')[1], 'base64');
            return JSON.parse(token.toString('utf8'))
        } catch (e) {
            const error = e as Error;
            console.error(`[getAuth] error: ${error.message}`);
            return {}
        }
    }

    /** 读 IDS Token */
    private static getAuthorization(headers: Headers): string {
        let authorization = headers.get('Authorization') || '';
        if (!authorization) {
            const access = headers.get('Access-Token') || '';
            authorization = access ? 'Bearer ' + access : '';
        }
        return authorization;
    }


    public static async getIDS() {
        const headers: Record<string, string> = {};

        const nextHeader = await nextHeaders();

        const authorization = this.getAuthorization(nextHeader);
        const authMap = this.getAuth(authorization);
        const currentRegion = nextHeader.get('Current-Region') || '';
        const currentGroup = nextHeader.get('Current-Group') || '';
        const currentOrg = nextHeader.get('Current-Org') || '';
        const currentProject = nextHeader.get('Current-Project') || '';
        const acceptLanguage = nextHeader.get('Accept-Language') || 'zh';

        headers['Account'] = authMap['preferred_username'] || '';
        headers['Current-Region'] = currentRegion;
        headers['Current-Group'] = currentGroup;
        headers['Authorization'] = authorization;
        headers['Current-Project'] = currentProject;
        headers['Current-Org'] = currentOrg;
        headers['Accept-Language'] = acceptLanguage;

        return headers;
    }

    /** 获取当前登录用户的 Account */
    public static async getUserAccount(): Promise<string> {
        const ids = await this.getIDS();
        return ids['Account'] || '';
    }

    /** 检查当前用户是否是指定桶的管理员 */
    public static async isBucketAdmin(bucketId: string) {
        const ids = await this.getIDS();
        const projectId = ids['Current-Project'] || '';
        const orgId = ids['Current-Org'] || '';
        const userId = ids['Account'] || '';

        if (!bucketId || !projectId || !orgId || !userId) return false;

        try {
            const policyMap = await policyService.getPolicyWithName(bucketId, orgId, projectId);
            return ossService.isBucketAdmin(policyMap, orgId, projectId, userId);
        } catch (e) {
            console.error('isBucketAdmin error:', e);
            return false;
        }
    }

    /** 检查当前用户是否是项目 Owner */
    public static async isProjectOwner() {
        const ids = await this.getIDS();
        const projectId = ids['Current-Project'] || '';
        const orgId = ids['Current-Org'] || '';
        const userId = ids['Account'] || '';
        const headers = ids;

        console.log('isProjectOwner projectId:', projectId);
        console.log('isProjectOwner orgId:', orgId);
        console.log('isProjectOwner userId:', userId);
        if (!projectId || !orgId || !userId) return false;

        try {
            return await projectService.isProjectOwner(orgId, projectId, userId, headers);
        } catch (e) {
            console.error('isProjectOwner error:', e);
            return false;
        }
    }

    /** 检查当前用户是否拥有 Full Control 权限 */
    public static async hasFullControl() {
        const ids = await this.getIDS();
        const projectId = ids['Current-Project'] || '';
        const orgId = ids['Current-Org'] || '';
        const userId = ids['Account'] || '';
        const headers = ids;

        if (!projectId || !orgId || !userId) return false;

        try {
            // Strictly check the DB for explicit 'full' access subuser record
            return await ossService.hasFullControl(orgId, projectId, userId);
        } catch (e) {
            console.error('hasFullControl error:', e);
            return false;
        }
    }

    public static async getProjectId(): Promise<string> {
        const nextHeader = await nextHeaders();
        return nextHeader.get('Current-Project') || '';
    }

    public static async getOrgId(): Promise<string> {
        const nextHeader = await nextHeaders();
        return nextHeader.get('Current-Org') || '';
    }

}
