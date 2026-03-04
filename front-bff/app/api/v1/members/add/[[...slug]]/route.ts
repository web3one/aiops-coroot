import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { projectService } from "@/app/services/project";
import { policyService } from "@/app/services/policy";
import { ossService } from "@/app/services/oss";
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

async function getRoles() {
    return [
        { "value": "oss-bucketadmin", "label": "桶管理员" },
        { "value": "oss-readwrite", "label": "读写成员" },
        { "value": "oss-readonly", "label": "只读成员" },
    ];
}

async function buildMemberAddForm(bucketId: string) {
    const { orgId, projectId, headers } = await getRequestContext();

    // 角色列表
    const roles = await getRoles();

    // 获取可选成员列表（未分配角色的成员）
    const projectMemberDto = await projectService.getProjectMember(projectId, headers);
    const policyMap = await policyService.getPolicyWithName(bucketId, orgId, projectId);
    const listMembers = ossService.getOptionalUser(projectMemberDto, policyMap, orgId, projectId);

    // 过滤出尚未设置角色的成员列表，并过滤只保留姓名/账户/id
    const data = listMembers
        .map(({ name, account }: any) => ({ id: account, name, account }));

    // 显示添加成员的表单
    const header = [
        BaseUI.tableHeader("name", "姓名"),
        BaseUI.tableHeader("account", "账户"),
    ];
    const linkPrefix = `${BaseUrl.SETTINGS.pageMembersDetail}${bucketId}`;

    return Base.successWrapper({
        "member_table": BaseUI.tableWithActions(FORM_NAME, "可选成员",
            { "member_button_refresh": BaseUI.refreshButton() },
            BaseUI.tableSelect(header, data, 1, [[2, "asc"]]),
        ),
        'member_role': BaseUI.container({
            'member_role': BaseUI.radioField('member_role', '角色', roles[0].value, '', roles),
        }, '角色设置', undefined, undefined, "为选中的成员设置角色。"),
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

    const { orgId, projectId } = await getRequestContext();

    const submitData = {
        ...params,
        bucketId: body.bucketId
    };
    console.info("[form submit]", submitData);

    await policyService.setBucketPolicy(body.bucketId, params.id, params.role, orgId, projectId);

    const linkPrefix = `${BaseUrl.SETTINGS.pageMembersDetail}`;
    return Base.success(linkPrefix + body.bucketId);
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


async function validate(body: any) {
    return Base.success(null);
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    const { searchParams } = new URL(req.url);
    const bucketId = searchParams.get('bucketId') || '';
    return await Base.handleGet(req, params, {
        build: async () => await buildMemberAddForm(bucketId),
        formId,
    });
}

export async function POST(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handlePost(req, params, {
        submit,
        validate
    });
}
