import { NextResponse } from 'next/server';
import { projectService } from '@/app/services/project';
import { ossService, RoleName } from '@/app/services/oss';
import { policyService } from '@/app/services/policy';
import { extractAuthHeaders } from '@/app/services/headerUtils';
import { bucketService } from '@/app/services/bucketService';

export async function GET(request: Request) {
    try {
        const projectId = request.headers.get('Current-Project') || '';
        const orgId = request.headers.get('Current-Org') || '';
        const headers = extractAuthHeaders(request);

        const projectMemberDto = await projectService.getProjectMember(projectId, headers);

        // Fetch buckets directly from database via bucketService
        const bucketListData = await bucketService.listBuckets(orgId, projectId);

        // Load key availability
        await ossService.loadAvailableKeys(projectId, orgId);

        // For each bucket, fetch policy and assign members with roles
        const results: any[] = [];
        for (const bucket of bucketListData) {
            const policyMap = await policyService.getPolicyWithName(bucket.name, orgId, projectId);
            const members = ossService.getBucketUsers(projectMemberDto, policyMap, orgId, projectId);

            // Group members by role
            const adminNames: string[] = [];
            const writeNames: string[] = [];
            const readNames: string[] = [];

            for (const member of members) {
                switch (member.role) {
                    case RoleName.CnBucketAdmin:
                        adminNames.push(member.name);
                        break;
                    case RoleName.CnReadWrite:
                        writeNames.push(member.name);
                        break;
                    case RoleName.CnReadOnly:
                        readNames.push(member.name);
                        break;
                }
            }

            results.push({
                ...bucket,
                adminMember: adminNames.join(','),
                writeMember: writeNames.join(','),
                readMember: readNames.join(','),
            });
        }

        return NextResponse.json({
            code: 200,
            msg: "查询成功",
            data: results
        });
    } catch (error: any) {
        console.error("GET /project/bucketMember error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: null }, { status: 500 });
    }
}
