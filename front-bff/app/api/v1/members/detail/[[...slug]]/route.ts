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

async function memberDetail(id: string) {
    const { orgId, projectId, headers } = await getRequestContext();

    // Get bucket info
    const bucket_data = await bucketService.getBucket(id, orgId, projectId);

    // Get bucket members with roles
    const projectMemberDto = await projectService.getProjectMember(projectId, headers);
    const policyMap = await policyService.getPolicyWithName(id, orgId, projectId);
    await ossService.loadAvailableKeys(projectId, orgId);
    const bucketUsers = ossService.getBucketUsers(projectMemberDto, policyMap, orgId, projectId);

    const header = [
        BaseUI.tableHeader("account", "账户名"),
        BaseUI.tableHeader("name", "姓名"),
        BaseUI.tableHeader("role", "角色"),
    ];

    const data = bucketUsers.map((item: any) => ({
        id: item.account,
        account: item.account,
        name: item.name,
        role: item.role,
        link: BaseUrl.SETTINGS.pageMembersDetail + `${item.id}`,
    }));

    return Base.successWrapper({
        "detail_base": BaseUI.cardPanelWithEdit("智能体", ``, [
            BaseUI.cardItem("名称", bucket_data?.name || ''),
            BaseUI.cardItem('对象', (bucket_data?.objectNum || 0) + '个'),
            BaseUI.cardItem("空间大小", (bucket_data?.size || 0) + " MB"),
        ], false),
        "detail_outside": BaseUI.tableWithActions(
            memberDetail.name, "成员",
            await buttons(id),
            BaseUI.tableSelect(header, data, 0, [[header.length, "desc"]]),
        ),
    })
}

async function buttons(id: string): Promise<object> {
    const url = `${BaseUrl.SETTINGS.pageAddMember}${id}`
    // 读用户权限
    let isAdmin = await Auth.hasFullControl() || await Auth.isBucketAdmin(id)
    let idPrefix = memberDetail.name + "_button_";
    const result: any = {};
    result[`${idPrefix}refresh`] = BaseUI.refreshButton();
    if (isAdmin) {
        result[`${idPrefix}delete`] = BaseUI.deleteButton(memberDetail.name);
    }
    if (isAdmin) {
        result[`${idPrefix}created`] = BaseUI.linkButton('添加', url);
    }
    return result;
}




async function submit(body: any) {
    const id = Base.tableSelected(body[memberDetail.name])
    console.info("[form submit] delete member:", body);

    if (id && body.op === `${memberDetail.name}_button_delete`) {
        const { orgId, projectId } = await getRequestContext();
        await policyService.deleteBySubuser(body.id, id, orgId, projectId);
    }
    const linkPrefix = `${BaseUrl.SETTINGS.pageMembersDetail}`;
    return Base.success(linkPrefix + body.id);
}

async function validate(body: any) {
    console.info("start validate ---", body)
    return Base.success();
}


export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    const { searchParams } = new URL(req.url);
    const bucketId = searchParams.get('id') || '';
    return await Base.handleGet(req, params, {
        build: async () => await memberDetail(bucketId),
    });
}

export async function POST(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handlePost(req, params, {
        submit,
        validate
    });
}
