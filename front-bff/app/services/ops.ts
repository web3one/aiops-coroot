import { extractAuthHeaders } from './headerUtils';

export class OpsService {
    private opsUrl: string;
    private managerUrl: string;

    constructor() {
        this.opsUrl = process.env.OPS_URL || 'https://ops-dev-api.dc4-faas.fzyun.io';
        this.managerUrl = process.env.MANAGER_URL || 'https://manager-dev-api.dc4-faas.fzyun.io';
    }

    /**
     * Get organization storage limit.
     * Mirrors Go's GetOrgLimit.
     * 
     * NOTE (#6): The Go code uses `e.DataPermission.OpoOrgId` (ops platform org ID),
     * which may differ from `Current-Org`. The caller should pass the correct orgId,
     * typically from the `Opo-Org-Id` header or `Current-Org` header.
     */
    public async getOrgLimit(orgId: string, headers: Record<string, string>): Promise<number> {
        const url = `${this.opsUrl}/api/v1/organizations/${orgId}/limits/external?serviceId=oss`;

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) return 0;

            const result = await response.json();
            for (const item of result.items || []) {
                if (item.name === 'size') {
                    return parseInt(item.value, 10) || 0;
                }
            }
        } catch (error) {
            console.error('getOrgLimit error:', error);
        }
        return 0;
    }

    /**
     * Get project-level storage limit, considering org limit and existing buckets.
     * Mirrors Go's GetProjectLimit.
     */
    public async getProjectLimit(buckets: number, orgLimit: number, projectId: string, orgId: string, headers: Record<string, string>): Promise<number> {
        const url = `${this.managerUrl}/api/v1/limits/external?serviceId=oss&projectId=${projectId}&orgId=${orgId}`;

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) return Math.max(0, orgLimit - buckets);

            const result = await response.json();
            for (const item of result.items || []) {
                if (item.name === 'size') {
                    const size = parseInt(item.value, 10) || 0;
                    return Math.min(orgLimit - buckets, size);
                }
            }
        } catch (error) {
            console.error('getProjectLimit error:', error);
        }
        return Math.max(0, orgLimit - buckets);
    }
}

export const opsService = new OpsService();
