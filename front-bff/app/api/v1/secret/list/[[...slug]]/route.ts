import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { secretService } from "@/app/services/secretService";
import { extractAuthHeaders } from "@/app/services/headerUtils";
import { headers as nextHeaders } from "next/dist/server/request/headers";


async function getRequestContext() {
    const nextHeader = await nextHeaders();
    const orgId = nextHeader.get('Current-Org') || '';
    const projectId = nextHeader.get('Current-Project') || '';
    const userId = nextHeader.get('Current-User') || '';
    const headers = extractAuthHeaders(new Request('http://localhost', { headers: nextHeader }));
    return { orgId, projectId, userId, headers };
}

/**
 * 构建密钥列表页面
 */
async function buildSecretKeysList() {

    // 获取当前项目和组织信息
    const projectId = await Auth.getProjectId();
    const orgId = await Auth.getOrgId();

    // 获取密钥列表
    let response = await secretService.getKeys(orgId, projectId);
    let listData = response?.keys || [];

    // 表格表头
    const header = [
        BaseUI.tableHeader("accessKeyId", "Access Key ID"),
        BaseUI.tableHeader("createdAt", "创建时间"),
        BaseUI.tableHeader("status", "状态"),
    ];

    // 表格数据
    const data = listData.map((item: any) => ({
        id: item.accessKeyId || "",
        accessKeyId: item.accessKeyId || "",
        createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).replace(/\//g, "-") : "",
        status: item.status || "ENABLE",
    }));

    // 操作按钮
    const actions: any = {
        "secret_keys_button_refresh": BaseUI.refreshButton(),
    };

    actions["secret_keys_button_sync"] = BaseUI.button({
        title: "同步",
        variant: "primary",
    });

    return Base.successWrapper({
        // 告警列表
        ...BaseUI.tableWithActions(
            "secret_keys",
            "告警列表",
            actions,
            BaseUI.tableSelect(header, data, -1, [[1, "desc"]])
        ),
    });
}

/**
 * 提交表单
 */
async function submit(body: any) {
    // 同步密钥操作
    if (body.op === "secret_keys_button_sync") {
        const { orgId, projectId, userId, headers } = await getRequestContext();
        const result = await secretService.syncKeys(orgId, projectId, userId, headers);

        if (!result.success) {
            return Base.error(result.msg || "同步失败");
        }

        return Base.success();
    }

    return Base.success(null);
}

/**
 * 表单ID
 */
async function formId() {
    return Base.success(buildSecretKeysList.name);
}

/**
 * 表单验证
 */
async function validate(_body: any) {
    return Base.success(null);
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handleGet(req, params, {
        build: buildSecretKeysList,
        formId,
    });
}

export async function POST(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handlePost(req, params, {
        submit,
        validate
    });
}
