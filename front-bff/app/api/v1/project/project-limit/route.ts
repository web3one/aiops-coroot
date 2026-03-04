import { NextResponse } from 'next/server';
import { opsService } from '@/app/services/ops';
import { extractAuthHeaders } from '@/app/services/headerUtils';
import { bucketService } from '@/app/services/bucketService';

export async function GET(request: Request) {
    try {
        // NOTE (#6): Use Opo-Org-Id if available, fallback to Current-Org
        const orgId = request.headers.get('Opo-Org-Id') || request.headers.get('Current-Org') || '';
        const projectId = request.headers.get('Current-Project') || '';
        const headers = extractAuthHeaders(request);

        const orgSize = await opsService.getOrgLimit(orgId, headers);

        // Get actual bucket count from database via bucketService
        const bucketListData = await bucketService.listBuckets(orgId, projectId);
        const bucketsCount = Array.isArray(bucketListData) ? bucketListData.length : 0;

        const limit = await opsService.getProjectLimit(bucketsCount, orgSize, projectId, orgId, headers);

        return NextResponse.json({
            code: 200,
            msg: "查询成功",
            data: limit
        });
    } catch (error: any) {
        console.error("GET /project/project-limit error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: 0 }, { status: 500 });
    }
}
