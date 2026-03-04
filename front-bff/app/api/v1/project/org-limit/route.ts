import { NextResponse } from 'next/server';
import { opsService } from '@/app/services/ops';
import { extractAuthHeaders } from '@/app/services/headerUtils';

export async function GET(request: Request) {
    try {
        // NOTE (#6): Use Opo-Org-Id if available, fallback to Current-Org.
        // Go code uses OpoOrgId for this endpoint.
        const orgId = request.headers.get('Opo-Org-Id') || request.headers.get('Current-Org') || '';
        const headers = extractAuthHeaders(request);

        const limit = await opsService.getOrgLimit(orgId, headers);

        return NextResponse.json({
            code: 200,
            msg: "查询成功",
            data: limit
        });
    } catch (error: any) {
        console.error("GET /project/org-limit error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: 0 }, { status: 500 });
    }
}
