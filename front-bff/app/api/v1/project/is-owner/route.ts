import { NextResponse } from 'next/server';
import { projectService } from '@/app/services/project';
import { ossService } from '@/app/services/oss';
import { Auth } from '@/app/utils/Auth';

export async function GET(request: Request) {
    try {
        const ids_header = await Auth.getIDS();
        const projectId = ids_header['Current-Project'] || '';
        const orgId = ids_header['Current-Org'] || '';
        const userId = ids_header['Account'] || '';

        const isAdmin = await projectService.isProjectOwner(orgId, projectId, userId, ids_header);

        return NextResponse.json({
            code: 200,
            msg: "查询成功",
            data: isAdmin
        });
    } catch (error: any) {
        console.error("GET /project/is-owner error", error);
        return NextResponse.json({ code: 500, msg: error.message, data: false }, { status: 500 });
    }
}
