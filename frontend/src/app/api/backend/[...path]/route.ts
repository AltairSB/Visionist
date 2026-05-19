import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = (process.env.BACKEND_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
const PROXY_TIMEOUT_MS = 120_000

const FORWARD_REQUEST_HEADERS = [
  'authorization',
  'content-type',
  'x-guest-session-id',
] as const

const FORWARD_RESPONSE_HEADERS = ['content-type'] as const

export const maxDuration = 120

type RouteContext = {
  params: Promise<{ path: string[] }>
}

const buildBackendUrl = (pathSegments: string[], search: string) => {
  const path = pathSegments.join('/')
  return `${BACKEND_URL}/${path}${search}`
}

const proxyRequest = async (request: NextRequest, context: RouteContext) => {
  const { path } = await context.params
  const targetUrl = buildBackendUrl(path, request.nextUrl.search)

  const headers = new Headers()
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) {
      headers.set(name, value)
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer()
  }

  let backendResponse: Response

  try {
    backendResponse = await fetch(targetUrl, init)
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === 'TimeoutError' || error.name === 'AbortError')

    return NextResponse.json(
      {
        detail: isTimeout
          ? 'Görsel analizi zaman aşımına uğradı. Daha küçük bir fotoğraf deneyin veya biraz sonra tekrarlayın.'
          : 'Backend’e bağlanılamadı. uvicorn’un 8000 portunda çalıştığından emin olun.',
      },
      { status: isTimeout ? 504 : 502 },
    )
  }

  const responseHeaders = new Headers()
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = backendResponse.headers.get(name)
    if (value) {
      responseHeaders.set(name, value)
    }
  }

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers: responseHeaders,
  })
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PATCH = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
