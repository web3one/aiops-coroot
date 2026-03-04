/**
 * KeyService — fetches user access keys from the credential API.
 * Mirrors Go's `project/service/key.go` → `GetUserKey`.
 */

export interface KeyData {
    id: string;
    org: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    projectId: string;
    accountName: string;
    accessKeyId: string;
    accessKeySecret: string;
    status: string;
}

export class KeyService {
    private keyUrl: string;

    constructor() {
        this.keyUrl = process.env.KEY_URL || 'https://credential-dev-api.dc4-faas.fzyun.io';
    }

    /**
     * Get user's enabled access keys from the credential service.
     * Mirrors Go's `GetUserKey(userId)`.
     */
    public async getUserKey(userId: string, projectId: string, headers: HeadersInit): Promise<KeyData[]> {
        const url = `${this.keyUrl}/api/v1/users/${userId}/access-keys/external?projectId=${projectId}`;

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                console.error(`getUserKey error: ${response.status}`);
                return [];
            }

            const result = await response.json();
            const enabledKeys: KeyData[] = [];
            for (const item of result.items || []) {
                if (item.status === 'ENABLE') {
                    enabledKeys.push(item);
                }
            }
            return enabledKeys;
        } catch (error) {
            console.error('getUserKey error:', error);
            return [];
        }
    }
}

export const keyService = new KeyService();
