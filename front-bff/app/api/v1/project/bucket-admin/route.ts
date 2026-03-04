import { NextResponse } from 'next/server';
import { ossService, RoleName } from '@/app/services/oss';
import { policyService } from '@/app/services/policy';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bucket = searchParams.get('bucket');

        const projectId = request.headers.get('Current-Project') || '';
        const orgId = request.headers.get('Current-Org') || '';
        const userId = request.headers.get('Current-User') || '';

        let isBucketAdmin = false;

        if (bucket) {
            const policyMap = await policyService.getPolicyWithName(bucket, orgId, projectId);
            isBucketAdmin = ossService.isBucketAdmin(policyMap, orgId, projectId, userId);
        }

        return NextResponse.json({
            code: 200,
            msg: "查询成功",
            data: isBucketAdmin
        });
    } catch (error: any) {
        console.error("GET /project/bucket-admin error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: false }, { status: 500 });
    }
}
