/**
 * Extract only the necessary authentication headers from the incoming request.
 * Prevents leaking internal headers (Host, Content-Length, etc.) to external APIs.
 */
export function extractAuthHeaders(request: Request): Record<string, string> {
    const headers: Record<string, string> = {};

    // Auth headers
    const authorization = request.headers.get('Authorization');
    if (authorization) headers['Authorization'] = authorization;

    // Cookie for session-based auth
    const cookie = request.headers.get('Cookie');
    if (cookie) headers['Cookie'] = cookie;

    // Custom headers used by the platform
    const currentOrg = request.headers.get('Current-Org');
    if (currentOrg) headers['Current-Org'] = currentOrg;

    const currentProject = request.headers.get('Current-Project');
    if (currentProject) headers['Current-Project'] = currentProject;

    const currentUser = request.headers.get('Current-User');
    if (currentUser) headers['Current-User'] = currentUser;

    // OpoOrgId — the ops platform org id (may differ from Current-Org)
    const opoOrgId = request.headers.get('Opo-Org-Id');
    if (opoOrgId) headers['Opo-Org-Id'] = opoOrgId;

    return headers;
}
