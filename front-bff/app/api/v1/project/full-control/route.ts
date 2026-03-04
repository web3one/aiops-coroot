import { NextResponse } from 'next/server';
import { ossService } from '@/app/services/oss';

export async function GET(request: Request) {
    try {
        const projectId = request.headers.get('Current-Project') || '';
        const orgId = request.headers.get('Current-Org') || '';
        const userId = request.headers.get('Current-User') || '';

        const hasFullControl = await ossService.hasFullControl(orgId, projectId, userId);

        return NextResponse.json({
            code: 200,
            msg: "查询成功",
            data: hasFullControl
        });
    } catch (error: any) {
        console.error("GET /project/full-control error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: false }, { status: 500 });
    }
}
