import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/v1:
 *   get:
 *     summary: Get API status
 *     description: Returns the API status
 *     responses:
 *       200:
 *         description: Success
 */
export async function GET() {
  return NextResponse.json({
    status: 0,
    message: '操作成功',
    data: { endpoint: '/api/v1', method: 'GET' }
  });
}
