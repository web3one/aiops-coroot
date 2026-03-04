import { Base, SlugParam } from "@/app/commons/Base";

// Helper functions
function urlFirstPart(path: string) {
    // 计算路径中 '/' 的数量
    const slashCount = path.split('/').length - 1 || 0;

    // 如果 '/' 数量少于3个，直接返回原路径
    if (slashCount < 3) return path;

    // 找到前两个 '/' 的位置
    const slashIndex2 = path.indexOf('/', path.indexOf('/') + 1);
    const slashIndex3 = path.indexOf('/', slashIndex2 + 1);

    // 返回前3个 '/' 之间的部分
    return path.substring(0, slashIndex3);
}

function menuItem(text: string, href: string, project?: string) {
    href = project ? `${href}/${project}?cp=${project}` : href;
    return {
        "type": "link",
        "text": text,
        "href": href,
    };
}

function secondMenuGroup(project: string) {
    if (!project) return [];
    return [
        menuItem("成员", "/members/list"),
        menuItem("服务管理员", "/setting-admin/list"),
    ];
}

function firstMenuGroup(project: string) {
    if (!project) return [
        menuItem("概览", "/oss-overview"),
    ];
    return [
        menuItem("概览", "/oss-overview"),
        { "type": "divider" },
        menuItem("智能体", "/bucket"),
        menuItem("告警管理", "/secret/list"),
    ];
}

async function build_menu(currentPath: string, project: string) {
    if (!currentPath) return Base.error('Missing current-path parameter');

    currentPath = urlFirstPart(currentPath);
    if (currentPath.includes("{project}")) {
        currentPath = currentPath.replaceAll("{project}", project);
        currentPath = Base.getUrlWithProjectAdded(currentPath);
    }

    // 组织返回数据
    return Base.success({
        "aws": {
            "#type": "aws_wrapper",
            "#const_define": [{
                "value": "nav",
                "set_value": "set_nav",
                "default": currentPath,
            }],
            "#children": [
                {
                    "#type": "aws_side_navigation",
                    "#active_href": "nav",
                    "#default_value": currentPath,
                    "#items": firstMenuGroup(project)
                },
                {
                    "#type": "aws_side_navigation",
                    "#active_href": "nav",
                    "#default_value": currentPath,
                    "#items": secondMenuGroup(project)
                },
            ]
        }
    });
}

export async function GET(req: Request, { params }: { params: Promise<SlugParam> }) {

    const slug = await Base.getSlugSegment(params);
    if (slug === '') {
        const url = new URL(req.url);
        const currentPath = url.searchParams.get('current-path') || '';
        const project = url.searchParams.get('project') || url.searchParams.get('cp') || '';
        return await build_menu(currentPath, project);
    }
    return Base.error('获取导航菜单失败 ' + req.url);
}
