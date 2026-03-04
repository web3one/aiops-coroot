import { ProjectMemberDto } from './oss';
import { extractAuthHeaders } from './headerUtils';

export class ProjectService {
    private projectUrl: string;

    constructor() {
        this.projectUrl = process.env.PROJECT_URL || 'https://project-dev-api.dc4-faas.fzyun.io';
    }

    public async getProjectMember(projectId: string, headers: Record<string, string>): Promise<ProjectMemberDto> {
        const url = `${this.projectUrl}/api/v1/members?projectId=${projectId}`;

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) return { status: response.status, message: 'error', items: [] };

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('getProjectMember error:', error);
        }
        return { status: 500, message: 'network error', items: [] };
    }

    public async isProjectOwner(orgId: string, projectId: string, userId: string, headers: Record<string, string>): Promise<boolean> {
        const url = `${this.projectUrl}/api/v1/users/${userId}/resources`;

        try {
            console.log('isProjectOwner url:', url);
            console.log('isProjectOwner headers:', headers);
            const response = await fetch(url, { headers });
            if (!response.ok) return false;

            const result = await response.json();
            for (const userRole of result.items || []) {
                if (userRole.res && userRole.res.includes(projectId) && userRole.res.includes(orgId)) {
                    for (const role of userRole.roles || []) {
                        if (role === 'oss-owner' || role === 'project-owner') {
                            return true;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('isProjectOwner error:', error);
        }
        return false;
    }
}

export const projectService = new ProjectService();
