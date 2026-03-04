import { Auth} from "./Auth";

/**
 * Controller 基类 - Next.js 版本
 * 提供统一的请求处理、用户认证、API 访问等功能
 */
export class HttpClient {

    static async accessWithIDS(url: string, options?: any) {
        //把user信息放入header中
        try {
            const ids_header = await Auth.getIDS();
            options = options || {};
            options.headers = Object.assign({}, ids_header, options.headers || {});

            // 处理 data 参数（转换为 body）
            if (options.data && !options.body) {
                options.body = options.data;
                delete options.data;
            }

            // 如果有 body 参数，序列化为 JSON 并设置 Content-Type
            if (options.body && typeof options.body === 'object') {
                options.body = JSON.stringify(options.body);
                options.headers['Content-Type'] = 'application/json';
            }

            console.log("accessWithIDS url:", url);
            console.log("accessWithIDS options:", options);
            const response = await fetch(url, options);
            if (!response.ok) {
                console.error(`${url} http access error: ${response.status}`);
                return {};
            }
            const result = await response.json();

            console.log("accessWithIDS result:", result);

            if (result.code !== 200) {
                console.error(`${url} http access error: ${result.code}`);
                return result || {};
            }
            return result.data;
        } catch (error) {
            console.error(`An error occurred at URL: ${url}:`, error);
            return {};
        }
    }

    /** 后端服务GET访问 */
    static async get(url: string, options?: any) {
        return HttpClient.accessWithIDS(url, {method: "GET", data: options,});
    }
    /** 后端服务POST访问 */
    static async post(url: string, options?: any) {
        return HttpClient.accessWithIDS(url, {method: "POST", data: options,});
    }

    /** 后端服务PUT访问 */
    static async put(url: string, options?: any) {
        return HttpClient.accessWithIDS(url, {method: "PUT", data: options,});
    }
    /** 后端服务DELETE访问 */
    static async delete(url: string, options?: any) {
        return HttpClient.accessWithIDS(url, {method: "DELETE", data: options,});
    }

}
