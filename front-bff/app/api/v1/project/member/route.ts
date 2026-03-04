import { NextResponse } from 'next/server';
import { projectService } from '@/app/services/project';
import { ossService, RoleName } from '@/app/services/oss';
import { accountService } from '@/app/services/account';
import { keyService } from '@/app/services/key';
import { policyService } from '@/app/services/policy';
import { extractAuthHeaders } from '@/app/services/headerUtils';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const usertype = searchParams.get('usertype');
        const bucket = searchParams.get('bucket');

        const projectId = request.headers.get('Current-Project') || '';
        const orgId = request.headers.get('Current-Org') || '';
        const headers = extractAuthHeaders(request);

        const projectMemberDto = await projectService.getProjectMember(projectId, headers);

        let members: any[] = [];

        if (usertype === RoleName.RoleProjectAdmin) {
            members = await ossService.getFullControlUser(projectMemberDto, orgId, projectId);
        } else if (usertype === RoleName.RoleProjectUser) {
            members = await ossService.getAvailableUsers(projectMemberDto, orgId, projectId);
        } else if (usertype === RoleName.BucketUser && bucket) {
            const policyMap = await policyService.getPolicyWithName(bucket, orgId, projectId);
            await ossService.loadAvailableKeys(projectId, orgId);
            members = ossService.getBucketUsers(projectMemberDto, policyMap, orgId, projectId);
        } else if (usertype === RoleName.OptionalBucketUser && bucket) {
            const policyMap = await policyService.getPolicyWithName(bucket, orgId, projectId);
            members = ossService.getOptionalUser(projectMemberDto, policyMap, orgId, projectId);
        }

        return NextResponse.json({
            code: 200,
            msg: "查询成功",
            data: members
        });
    } catch (error: any) {
        console.error("GET /project/member error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: null }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const ids: string[] = body.id || [];

        const projectId = request.headers.get('Current-Project') || '';
        const orgId = request.headers.get('Current-Org') || '';
        const headers = extractAuthHeaders(request);

        for (const userId of ids) {
            // Fetch user's access keys from credential service
            const keys = await keyService.getUserKey(userId, projectId, headers);
            await accountService.createFullControlUser(userId, orgId, projectId, keys);
        }

        return NextResponse.json({
            code: 200,
            msg: "创建成功",
            data: body
        });
    } catch (error: any) {
        console.error("POST /project/member error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: null }, { status: 500 });
    }
}
