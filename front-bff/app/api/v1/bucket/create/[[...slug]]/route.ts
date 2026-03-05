import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { bucketService } from "@/app/services/bucketService";


async function createBucket(id?: string) {
    const formContent = await getFormContent(id || '');
    const linkPrefix = `${BaseUrl.BUCKET.pageMain}/${id}`;
    return Base.successWrapper({
        'bucket_header': BaseUI.pageTitle(!id ? '创建智能体' : '编辑智能体'),
        'bucket_info': BaseUI.cardPanel('基本信息', BaseUI.cardContent(formContent),),
        'bucket_buttons': BaseUI.formButtons({
            'bucket_button_cancel': BaseUI.linkButtonLight('取消', id ? `${BaseUrl.BUCKET.pageMain}/detail/${id}` : `${linkPrefix}`),
            'bucket_button_save': BaseUI.submitButton((!id ? '创建' : "保存"))
        })
    });
}

async function submit(body: any) {
    const params = await submitParams(body)
    console.info("[form submit]", params)

    const orgId = await Auth.getOrgId();
    const projectId = await Auth.getProjectId();

    if (params.id) {
        // Update — bucket update is limited; just log it
        console.info("[bucket update]", params.id, params);
    } else {
        // Create
        const success = await bucketService.createBucket(params.name, orgId, projectId, params.description);
        if (!success) {
            return Base.error("创建智能体失败");
        }
    }
    return Base.success(`${BaseUrl.BUCKET.pageMain}`);
}

async function submitParams(body: any) {
    return {
        id: body.bucketId,
        projectId: body.project,
        name: body.name,
        description: body.description,
    };
}

async function getFormContent(id: string) {
    let data: any = null
    if (id != '') {
        const orgId = await Auth.getOrgId();
        const projectId = await Auth.getProjectId();
        data = await bucketService.getBucket(id, orgId, projectId);
    }
    return {
        'name': BaseUI.textField({
            id: 'name',
            title: '名称',
            constraint_text: BaseUI.validatePattern.idPattern.message,
            value: data?.name,
            attributes: { 'pattern': BaseUI.validatePattern.idPattern.pattern },
            readonly: id != '',
        }),
        'description': BaseUI.textArea('description', '描述', '',
            BaseUI.validatePattern.description.message, data?.description,
            { 'pattern': BaseUI.validatePattern.description.pattern }, false),
    };
}


export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {

    const { searchParams } = new URL(req.url);
    const bucketId = searchParams.get('bucketId') || '';
    return await Base.handleGet(req, params, {
        build: async () => await createBucket(bucketId),
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
    const name = (body.name || '').toString().trim();
    const errors: any = {};

    if (name.length === 0) {
        errors.bucket_content_name = "名称不能为空。";
    }

    if (Object.keys(errors).length > 0) {
        return Base.success({ errors });
    }

    // Additional validation can be added here
    if (body.bucketId == undefined) {
        const orgId = await Auth.getOrgId();
        const projectId = await Auth.getProjectId();
        const result = await bucketService.validateBucket(name, orgId, projectId);
        if (!result.valid) {
            return Base.success({ "errors": { "error": result.msg } })
        }
    }
    return Base.success({ errors: {} });
}
