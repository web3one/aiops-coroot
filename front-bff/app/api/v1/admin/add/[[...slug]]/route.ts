import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { projectService } from "@/app/services/project";
import { ossService } from "@/app/services/oss";
import { accountService } from "@/app/services/account";
import { keyService } from "@/app/services/key";
import { extractAuthHeaders } from "@/app/services/headerUtils";
import { headers as nextHeaders } from "next/dist/server/request/headers";

const FORM_NAME = "project_member";

async function getRequestContext() {
    const nextHeader = await nextHeaders();
    const orgId = nextHeader.get('Current-Org') || '';
    const projectId = nextHeader.get('Current-Project') || '';
    const headers = extractAuthHeaders(new Request('http://localhost', { headers: nextHeader }));
    return { orgId, projectId, headers };
}

async function buildProjectMemberAdminForm() {
    const { orgId, projectId, headers } = await getRequestContext();

    // 读出项目的所有可用成员（非管理员）
    const projectMemberDto = await projectService.getProjectMember(projectId, headers);
    const listMembers = await ossService.getAvailableUsers(projectMemberDto, orgId, projectId);

    // 过滤出尚未设置角色的成员列表，并过滤只保留姓名/账户/id
    const data = listMembers
        .map(({ name, account }: any) => ({ id: account, name, account }));

    // 显示添加成员的表单
    const header = [
        BaseUI.tableHeader("name", "姓名"),
        BaseUI.tableHeader("account", "账户"),
    ];
    const linkPrefix = `${BaseUrl.SETTINGS.pageAdminList}`;

    return Base.successWrapper({
        "member_table": BaseUI.tableWithActions(FORM_NAME, "可选成员",
            { "member_button_refresh": BaseUI.refreshButton() },
            BaseUI.tableSelect(header, data, 1, [[2, "asc"]]),
        ),
        'member_buttons': BaseUI.formButtons({
            'member_button_cancel': BaseUI.linkButtonLight('取消', `${linkPrefix}`),
            'member_button_save': BaseUI.submitButton("保存")
        }),
    });
}

async function submit(body: any) {
    const params = submitParams(body);

    console.info("[form submit params]", body);

    if (!params.id?.length) {
        return Base.error("请选择成员");
    }

    console.info("[form submit]", params);

    const { orgId, projectId, headers } = await getRequestContext();

    // Create full-control subuser for each selected member
    for (const userId of params.id) {
        const keys = await keyService.getUserKey(userId, projectId, headers);
        await accountService.createFullControlUser(userId, orgId, projectId, keys);
    }

    return Base.success(`${`${BaseUrl.SETTINGS.pageAdminList}`}`);
}

function submitParams(body: any) {
    return {
        id: Base.tableMultiSelected(body[FORM_NAME]),
        projectId: body.project,
        role: body.member_role,
    };
}

async function formId() {
    return Base.success(FORM_NAME + "_form");
}

async function validate(_body: any) {
    return Base.success(null);
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handleGet(req, params, {
        build: async () => await buildProjectMemberAdminForm(),
        formId,
    });
}

export async function POST(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handlePost(req, params, {
        submit,
        validate
    });
}
