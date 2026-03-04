import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { projectService } from "@/app/services/project";
import { ossService } from "@/app/services/oss";
import { accountService } from "@/app/services/account";
import { extractAuthHeaders } from "@/app/services/headerUtils";
import { headers as nextHeaders } from "next/dist/server/request/headers";


async function getRequestContext() {
    const nextHeader = await nextHeaders();
    const orgId = nextHeader.get('Current-Org') || '';
    const projectId = nextHeader.get('Current-Project') || '';
    const headers = extractAuthHeaders(new Request('http://localhost', { headers: nextHeader }));
    return { orgId, projectId, headers };
}

/**
 * 构建项目设置页面
 */
async function listAdmin() {
    const { orgId, projectId, headers } = await getRequestContext();

    // 获取项目管理员列表（full-control users）
    const projectMemberDto = await projectService.getProjectMember(projectId, headers);
    let listData = await ossService.getFullControlUser(projectMemberDto, orgId, projectId);
    if (!listData) listData = [];

    // 表格表头
    const header = [
        BaseUI.tableHeader("account", "账户名"),
        BaseUI.tableHeader("name", "姓名"),
        BaseUI.tableHeader("email", "邮箱")
    ];

    // 表格数据
    const data = listData.map((item: any) => ({
        id: item.id,
        account: item.account,
        name: item.name,
        email: item.email,
    }));


    return Base.successWrapper({
        ...BaseUI.tableWithActions(
            listAdmin.name,
            "服务管理员",
            await buttons(),
            BaseUI.tableSelect(header, data, 0, [])
        ),
    });
}


async function buttons(): Promise<object> {
    let isAdmin = await Auth.isProjectOwner();
    console.log('isAdmin---------------:', isAdmin);
    const idPrefix = listAdmin.name + "_button_";
    const result: any = {};
    result[`${idPrefix}refresh`] = BaseUI.refreshButton();
    if (isAdmin) {
        result[`${idPrefix}delete`] = BaseUI.deleteButton(listAdmin.name);
    }
    if (isAdmin) {
        result[`${idPrefix}created`] = BaseUI.linkButton("添加", '/setting-admin/add');
    }
    return result;
}


async function submit(body: any) {
    const id = Base.tableSelected(body[listAdmin.name]);
    const idPrefix = listAdmin.name + "_button_";
    if (id && body.op === `${idPrefix}delete`) {
        const { orgId, projectId } = await getRequestContext();
        try {
            await accountService.removeFullControl(id, orgId, projectId);
        } catch (e: any) {
            return Base.error(e.message || '删除失败');
        }
    }
    return Base.success(null);
}


async function formId() {
    return Base.success(listAdmin.name);
}


async function validate(_body: any) {
    return Base.success(null);
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handleGet(req, params, {
        build: listAdmin,
        formId,
    });
}

export async function POST(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handlePost(req, params, {
        submit,
        validate
    });
}
