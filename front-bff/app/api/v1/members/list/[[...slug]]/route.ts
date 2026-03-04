import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { bucketService } from "@/app/services/bucketService";
import { projectService } from "@/app/services/project";
import { policyService } from "@/app/services/policy";
import { ossService, RoleName } from "@/app/services/oss";
import { extractAuthHeaders } from "@/app/services/headerUtils";
import { headers as nextHeaders } from "next/dist/server/request/headers";


async function getRequestContext() {
    const nextHeader = await nextHeaders();
    const orgId = nextHeader.get('Current-Org') || '';
    const projectId = nextHeader.get('Current-Project') || '';
    const headers = extractAuthHeaders(new Request('http://localhost', { headers: nextHeader }));
    return { orgId, projectId, headers };
}

async function listMembers() {
    const { orgId, projectId, headers } = await getRequestContext();

    // Get all buckets
    const bucketListData = await bucketService.listBuckets(orgId, projectId);

    // Get project members
    const projectMemberDto = await projectService.getProjectMember(projectId, headers);

    // Load key availability
    await ossService.loadAvailableKeys(projectId, orgId);

    // For each bucket, fetch policy and assign members with roles
    const result: any[] = [];
    for (const bucket of bucketListData) {
        const policyMap = await policyService.getPolicyWithName(bucket.name, orgId, projectId);
        const members = ossService.getBucketUsers(projectMemberDto, policyMap, orgId, projectId);

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

        result.push({
            ID: bucket.ID,
            name: bucket.name,
            adminMember: adminNames.join(',') || '',
            writeMember: writeNames.join(',') || '',
            readMember: readNames.join(',') || '',
        });
    }

    const header = [
        BaseUI.tableHeader("name", "智能体", BaseUI.tableLink("{item.name}", "item.link")),
        BaseUI.tableHeader("writeMember", "读写人员"),
        BaseUI.tableHeader("readMember", "只读人员"),
        BaseUI.tableHeader("adminMember", "管理员"),
    ];
    const data = result.map((item: any) => ({
        id: item.ID,
        name: item.name,
        link: BaseUrl.SETTINGS.pageMembersDetail + `${item.ID}`,
        writeMember: item.writeMember || "无",
        readMember: item.readMember || "无",
        adminMember: item.adminMember || "无",
    }));

    // 排序：writeMember 有值的在前，"无" 的排在最后
    data.sort((a: any, b: any) => {
        if (a.writeMember === "无" && b.writeMember !== "无") return 1;
        if (a.writeMember !== "无" && b.writeMember === "无") return -1;
        return a.writeMember.localeCompare(b.writeMember);
    });

    return Base.successWrapper(BaseUI.tableWithActions(
        listMembers.name, "成员",
        await buttons("1", "datastore", listMembers.name, listMembers.name),
        // disorder_columns: [2] 禁用 writeMember 列的前端排序
        BaseUI.tableSelect(header, data, -1, undefined, undefined, [2]),
    ));
}

async function buttons(project: string, type: string, idPrefix: string, linkPrefix: string): Promise<object> {
    // 读用户权限
    idPrefix = idPrefix + "_button_";

    const result: any = {};
    result[`${idPrefix}refresh`] = BaseUI.refreshButton();
    return result;
}


async function submit(body: any) {
    const id = Base.tableSelected(body[listMembers.name])
    if (body.op === `${listMembers.name}_button_delete`) {
        const { orgId, projectId } = await getRequestContext();
        const result = await bucketService.deleteBucket(id, orgId, projectId);
        if (!result.success) {
            return Base.error(result.msg || '删除失败');
        }
    }
    return Base.success(`${BaseUrl.BUCKET.pageMain}`);
}


async function formId() {
    return Base.success(listMembers.name);
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    const { searchParams } = new URL(req.url);
    const bucketId = searchParams.get('bucketId') || '';
    return await Base.handleGet(req, params, {
        build: async () => await listMembers(),
    });

}


export async function POST(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handlePost(req, params, {
        submit,
        validate
    });
}

async function validate(body: any) {
    console.info("start validate ---", body)
    return Base.success({ errors: {} });
}
