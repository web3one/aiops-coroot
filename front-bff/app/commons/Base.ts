import { NextResponse } from "next/server";

export type SlugParam = {
    slug?: string[]
}



export class Base {
    /** 后端接口根路径 */

    /** 从 url 中提取 project 并附加参数 cp */
    public static getUrlWithProjectAdded(url: string) {
        if (!url) return url;
        // 从第二段路径中提取 project
        const match = url.match(/^\/[^/]+\/(pmp-[a-z0-9]{26})/);
        const project = match ? match[1] : "";

        if (project && !url.includes("?cp=") && !url.includes("&cp=")) {
            return url + (url.includes("?") ? "&cp=" : "?cp=") + project;
        } else {
            return url;
        }
    }

    /** 检查数组中每个元素，把类link属性都做 url 附加参数的转换 */
    public static itemsUrlWithProjectAdded(items: any[]) {
        items.forEach((one: any) => {
            Object.keys(one).forEach((key: string) => {
                if (key == "link" || key.endsWith("Link")) {
                    one[key] = this.getUrlWithProjectAdded(one[key]);
                }
            });
        });
    }

    /** 返回成功结果 */
    static success(data?: any, print?: boolean): NextResponse {
        // 统一对ajax table 数据的 items 中的 link 属性加 cp 参数
        if (data === undefined) {
            console.info("[Base] Data is undefined");
            return this.nextSuccess({ errors: {} });
        }

        if (print) console.info("[Base]", JSON.stringify(data));


        if (data?.items) {
            this.itemsUrlWithProjectAdded(data.items);
        } else if (typeof data == "string") {
            // 返回的是跳转路径的，也增加参数
            data = this.getUrlWithProjectAdded(data);
        }

        console.info("Base success data:", data);

        return this.nextSuccess(data);
    }

    /** 返回亚马逊组件外层包装器 */
    static successWrapper(data: any, functions?: any, classes?: any[], print?: boolean): NextResponse {
        classes = classes || ["mb-4"];
        // 用 "class": ["mb-4"] 保证两个区块之间有分隔
        const result = {
            status: 0,
            message: '操作成功',
            data: {
                "aws": {
                    "#type": "aws_wrapper",
                    "#attributes": { "class": classes },
                    "#functions": functions,
                    "#children": [{
                        "#type": "aws_space_between",
                        "#direction": "vertical",
                        "#size": "m",
                        "#content": data,
                    }]
                }
            }
        }
        return this.nextSuccess(result);
    }

    /** 返回鲁班Form表单的函数地址 */
    static successForm(formId: string = 'formId', submit: string = 'submit', validate: string = 'validate', build: string = 'build'): NextResponse {
        return this.success({
            api_list: {
                getFormId: formId,
                submitForm: submit,
                validateForm: validate,
                buildForm: build
            }
        })
    }



    /** 从路径生成表单ID */
    static formIdFor(path: string): string {
        const normalized = path
            .replace(/^\//, '')
            .replace(/\//g, '_')
            .replace(/[^a-zA-Z0-9_\-]/g, '');
        return normalized || 'formId';
    }

    /** 从请求URL自动提取basePath */
    static extractBasePath(requestUrl: string, slug?: string[]): string {
        const segments = slug ?? [];
        let basePath = '';

        if (requestUrl) {
            try {
                const url = new URL(requestUrl);
                // 移除 /api/v1 前缀和 slug 部分,获取基础路径
                const pathParts = url.pathname.split('/').filter(Boolean);
                const apiIndex = pathParts.indexOf('api');
                if (apiIndex !== -1 && pathParts[apiIndex + 1] === 'v1') {
                    // 获取 /api/v1 之后到 slug 之前的部分
                    const slugLength = segments.length > 0 ? segments.length : 0;
                    const basePathParts = pathParts.slice(apiIndex + 2, pathParts.length - slugLength);
                    if (basePathParts.length > 0) {
                        basePath = '/' + basePathParts.join('/');
                    }
                }
            } catch (e) {
                // 如果 URL 解析失败,使用默认值
                console.error('Failed to parse URL:', e);
            }
        }

        return basePath;
    }

    /**
     * 通用的API路由处理函数
     * @param apiHandler 可选的自定义build处理函数
     */
    static async successFormApi(
        apiHandler?: () => Promise<any> | any
    ): Promise<any> {
        // 从请求 URL 自动提取 basePath
        // const basePath = this.extractBasePath(requestUrl || '', slug);
        // Full path constructed from base + slug
        // const fullPath = segments.length > 0 ? `${basePath}/${segments.join('/')}` : basePath;
        // const formId = this.formIdFor(fullPath.replace(/\/formId$/, ''));

        if (apiHandler) {
            return await apiHandler();
        }

        return this.success({})
    }

    static nextSuccess(data: unknown) {
        return NextResponse.json({
            status: 0,
            message: '操作成功',
            data
        });
    }

    static error(msg: string): NextResponse {
        return NextResponse.json({
            status: -1,
            message: msg,
            data: null
        })
    }

    /** 服务未开通错误 - 返回前端可渲染的 aws_alert 组件 */
    static serviceNotOpenError(): NextResponse {
        return this.successWrapper([
            {
                "#type": "aws_alert",
                "#dismissible": false,
                "#alert_type": "error",
                "#header": "服务未开通",
                "#content": "当前租户尚未开通对象存储服务，请联系服务管理员开通。",
                "#action": ""
            }
        ])
    }

    static async getSlugSegment(params: Promise<{ slug?: string[] }> | { slug?: string[] }): Promise<string> {
        const { slug } = await params;
        return slug?.at(-1) || '';
    }

    static async getFormBody(req: Request) {
        let body: any;
        const contentType = req.headers.get('content-type') || '';
        console.info("contentType:" + contentType)
        if (contentType.includes('application/json')) {
            body = await req.json();
        } else {
            const formData = await req.formData()
            body = Object.fromEntries(formData.entries())
        }
        return body;
    }

    static tableMultiSelected(valueStr: string): string[] {
        // project_list: '[{"id":"xxx","name":"xxx","description":"xxx"}]',
        const values = JSON.parse(valueStr || "[]");
        return values.map((v: any) => v.id);
    }


    static tableSelected(valueStr: string): string {
        // project_list: '[{"id":"xxx","name":"xxx","description":"xxx"}]',
        const values = JSON.parse(valueStr || "[]");
        return values.length > 0 ? values[0].id : "";
    }

    /**
     * 通用 GET 处理逻辑
     * @param req Request
     * @param params params
     * @param handlers { build, formId }
     */
    static async handleGet(
        req: Request,
        params: Promise<SlugParam>,
        handlers: {
            build: (searchParams?: any) => Promise<any>;
            formId?: () => Promise<any>;
        }
    ) {
        const slug = await this.getSlugSegment(params);
        console.info("HandleGet slug:", slug);
        if (slug === '') {
            return this.successForm();
        }
        if (slug === 'build') {
            // 检查服务是否开通（由 proxy.ts 通过 header 传递）
            const serviceOpen = req.headers.get('x-service-open')
            if (serviceOpen === 'false') {
                return this.serviceNotOpenError()
            }
            return await handlers.build();
        }
        if (slug === 'formId') {
            if (handlers.formId) {
                return await handlers.formId();
            }
            return this.success('default-form-id');
        }

        return this.error('Invalid request ' + req.url);
    }

    /**
     * 通用 POST 处理逻辑
     * @param req Request
     * @param params params
     * @param handlers { submit, validate }
     */
    static async handlePost(
        req: Request,
        params: Promise<SlugParam>,
        handlers: {
            submit: (body: any) => Promise<any>;
            validate: (body: any) => Promise<any>;
        }
    ) {
        const slug = await this.getSlugSegment(params);
        const body = await this.getFormBody(req);
        if (slug === 'submit') {
            return await handlers.submit(body);
        }
        if (slug === 'validate') {
            return await handlers.validate(body);
        }
        return this.error('Invalid request ' + req.url);
    }

}