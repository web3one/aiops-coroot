import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from './app/lib/prisma'

/**
 * Next.js 全局代理 - 实现类似 Midway 的全局拦截器功能
 * 用于在访问接口时自动确保租户用户存在
 */
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    // menu 请求不过滤
    if (pathname.startsWith('/api/v1/menu')) {
        return NextResponse.next()
    }

    try {
        // 获取租户信息
        const currentOrg = request.headers.get('Current-Org')
        const currentProject = request.headers.get('Current-Project')

        // 代理拦截器仅透传，不再自动创建租户用户
    } catch (error) {
        console.error('proxy 初始化用户失败:', error)
        // 发生错误时继续处理请求，避免阻塞
    }
    return NextResponse.next()
}

// 配置需要拦截的路径
export const config = {
    matcher: [
        '/api/v1/:path*',
    ]
}
