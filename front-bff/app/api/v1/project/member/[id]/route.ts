import { NextResponse } from 'next/server';
import { accountService } from '@/app/services/account';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const projectId = request.headers.get('Current-Project') || '';
        const orgId = request.headers.get('Current-Org') || '';

        await accountService.removeFullControl(id, orgId, projectId);

        return NextResponse.json({
            code: 200,
            msg: "删除成功",
            data: null
        });
    } catch (error: any) {
        console.error(`DELETE /project/member/[id] error:`, error);
        return NextResponse.json({ code: 500, msg: error.message, data: null }, { status: 500 });
    }
}
