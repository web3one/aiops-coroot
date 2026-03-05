import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { bucketService } from "@/app/services/bucketService";


async function listBucket() {
    const orgId = await Auth.getOrgId();
    const projectId = await Auth.getProjectId();
    const listData = await bucketService.listBuckets(orgId, projectId);
    const header = [
        BaseUI.tableHeader("name", "名称", BaseUI.tableLink("{item.name}", "item.link", true)),
        BaseUI.tableHeaderDescription(),
        BaseUI.tableHeaderCreated(),
        BaseUI.tableHeader("agent", "操作", BaseUI.tableLink("编辑", "item.edit_link")),
    ];
    const data = listData.map((item: any) => ({
        id: item.ID,
        name: item.name,
        link: `https://openclaw.logs.bj1.fzyun.io/?token=aiops2026`,
        edit_link: BaseUrl.BUCKET.pageDetail + `${item.ID}`,
        description: item.description || "",
        created: item.CreatedAt,
    }));

    return Base.successWrapper(BaseUI.tableWithActions(
        listBucket.name, "智能体",
        await buttons(listBucket.name),
        BaseUI.tableSelect(header, data, 0, [[header.length, "desc"]]),
    ));
}

async function buttons(idPrefix: string): Promise<object> {
    // 读用户权限
    let isAdmin = await Auth.hasFullControl()
    idPrefix = idPrefix + "_button_";

    const result: any = {};
    result[`${idPrefix}refresh`] = BaseUI.refreshButton();

    if (isAdmin) {
        result[`${idPrefix}delete`] = BaseUI.deleteButton(listBucket.name);
    }
    if (isAdmin) {
        result[`${idPrefix}created`] = BaseUI.linkButton('创建', `bucket/create`);
    }
    return result;
}


async function submit(body: any) {
    const id = Base.tableSelected(body[listBucket.name])
    if (body.op === `${listBucket.name}_button_delete`) {
        const orgId = await Auth.getOrgId();
        const projectId = await Auth.getProjectId();
        // Need to get bucket name from ID - for now using ID as name
        const result = await bucketService.deleteBucket(id, orgId, projectId);
        if (!result.success) {
            return Base.error(result.msg || '删除失败')
        }
    }
    return Base.success(`${BaseUrl.BUCKET.pageMain}`);
}


async function formId() {
    return Base.success(listBucket.name);
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    return await Base.handleGet(req, params, {
        build: listBucket,
        formId: formId
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
    return Base.success();
}