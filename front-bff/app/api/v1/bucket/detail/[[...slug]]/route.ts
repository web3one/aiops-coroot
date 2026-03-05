import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { bucketService } from "@/app/services/bucketService";


async function bucketDetail(id: string) {
    const orgId = await Auth.getOrgId();
    const projectId = await Auth.getProjectId();
    const data = await bucketService.getBucket(id, orgId, projectId);
    const editable = await canEdit(id);

    if (!data) {
        return Base.error("存储桶不存在");
    }

    return Base.successWrapper({
        "bucket_detail_header": BaseUI.pageTitle(data.name),
        // 基本信息
        "bucket_detail_base": BaseUI.cardPanelWithEdit("基本信息", `${BaseUrl.BUCKET.pageDetail}${id}/edit`, [
            BaseUI.cardItem("智能体名称", data.name),
            BaseUI.cardItem("描述", data.description || ""),
            BaseUI.cardItem('对象', data.objectNum + '个'),
            BaseUI.cardItem("空间大小", data.size + " MB"),
            BaseUI.cardItemTime("创建时间", data.CreatedAt),
            BaseUI.cardItem('访问地址', data.address)
        ], editable),
    });
}

async function canEdit(id: string) {
    let isAdmin = await Auth.hasFullControl() || await Auth.isBucketAdmin(id)
    return isAdmin
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {
    const { searchParams } = new URL(req.url);
    let bucketId = searchParams.get('id') || '';

    const slugParams = await params;
    if (!bucketId && slugParams.slug && slugParams.slug.length > 1) {
        // Assume format is [...id, action] e.g. ['test3', 'build']
        bucketId = slugParams.slug[slugParams.slug.length - 2];
    }

    return await Base.handleGet(req, params, {
        build: async () => await bucketDetail(bucketId),
    });
}
