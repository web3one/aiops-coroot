import { Base, SlugParam } from "@/app/commons/Base";
import { BaseUI } from "@/app/commons/BaseUI";
import { BaseUrl } from "@/app/commons/BaseUrl";
import { Auth } from "@/app/utils/Auth";
import { bucketService } from "@/app/services/bucketService";


async function overview() {
    const orgId = await Auth.getOrgId();
    const listData = await bucketService.getOverview(orgId);
    console.info("bucket overview data ---", listData);
    const header = [
        BaseUI.tableHeader("name", "项目名称"),
        BaseUI.tableHeader("bucketNum", "智能体"),
        BaseUI.tableHeader("size", "数据空间(MB)"),
    ];
    const data = listData.map((item: any) => ({
        id: item.ID,
        name: item.project,
        link: BaseUrl.BUCKET.pageDetail + `${item.ID}`,
        bucketNum: item.bucketNum,
        size: item.size,
    }));

    return Base.successWrapper({
        "overview-description": BaseUI.textContent("欢迎使用 Cloud Hawk 智能运维平台！<br/>"
            + "融合深度可观测性与智能分析能力，为您提供全栈、一体化的 IT 运维管理与故障排查解决方案。", 'fs-6 lh-lg'),
        "overview-functions": BaseUI.grid([
            BaseUI.container(BaseUI.textContent("<h2>智能异常根因分析</h2>"
                + "<div>自动构建微服务拓扑图，实时感知系统运行态势。结合多维度可观测性数据与智能分析引擎，实现秒级异常检测与精准根因定位，大幅缩短故障恢复时间。</div>", 'lh-lg'),
                undefined, undefined, "aione-overview-panel"),
            BaseUI.container(BaseUI.textContent("<h2>全景图谱与追踪</h2>"
                + "<div>全面覆盖基础设施、容器与应用各层级，直观展示服务依赖关系与调用链路，提供端到端的性能瓶颈分析，助您快速洞察问题全貌。</div>", 'lh-lg'),
                undefined, undefined, "aione-overview-panel"),
            BaseUI.container(BaseUI.textContent("<h2>自治运维智能体</h2>"
                + "<div>突破传统对话式限制，赋予大模型感知与执行的真实能力。可自主调用 API 接口、执行诊断代码、读取分析日志文件及监控系统状态变化，实现从问题发现到修复的闭环自动化。</div>", 'lh-lg'),
                undefined, undefined, "aione-overview-panel"),
        ], [
            { "default": 12, "xs": 4 },
            { "default": 12, "xs": 4 },
            { "default": 12, "xs": 4 }
        ], "aione-overview-panels"),
        "overview-tables": BaseUI.tableWithActions(
            overview.name, "项目一览",
            await buttons("1", "datastore", overview.name, overview.name),
            BaseUI.tableSelect(header, data, -1, [[header.length, "desc"]]), ''
        )
    });


}

async function buttons(project: string, type: string, idPrefix: string, linkPrefix: string): Promise<object> {
    // 读用户权限
    //let isAdmin = await AuthController.isProjectAdmin();
    idPrefix = idPrefix + "_button_";
    return {};
}



async function formId() {
    return Base.success(overview.name);
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {

    return await Base.handleGet(req, params, {
        build: overview,
    });

}
