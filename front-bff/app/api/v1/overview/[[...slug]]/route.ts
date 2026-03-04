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
        "overview-description": BaseUI.textContent("欢迎使用运维智能体！<br/>"
            + "本平台致力于为您提供智能、高效、全栈的 IT 运维排障与管理解决方案。", 'fs-6 lh-lg'),
        "overview-functions": BaseUI.grid([
            BaseUI.container(BaseUI.textContent("<h2>智能异常根因分析</h2>"
                + "<div>基于 eBPF 技术与全栈可观察性数据，自动为您构建微服务拓扑图，并运用强大的 AI 算法实现秒级异常检测与精准的根因定位。</div>", 'lh-lg'),
                undefined, undefined, "aione-overview-panel"),
            BaseUI.container(BaseUI.textContent("<h2>自动化告警与诊断</h2>"
                + "<div>提供开箱即用的告警规则与一键式系统诊断报告。支持对 CPU、内存、网络及数据库连接等各项关键指标的智能洞察。</div>", 'lh-lg'),
                undefined, undefined, "aione-overview-panel"),
            BaseUI.container(BaseUI.textContent("<h2>全景图谱可视</h2>"
                + "<div>全面覆盖各类基础设施节点的追踪视图，直观展示服务依赖关系并提供端到端的性能瓶颈分析能力，极大降低排障成本。</div>", 'lh-lg'),
                undefined, undefined, "aione-overview-panel"),
        ], [{ "default": 12, "xs": 4 }, { "default": 12, "xs": 4 }, { "default": 12, "xs": 4 }], "aione-overview-panels"),
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
