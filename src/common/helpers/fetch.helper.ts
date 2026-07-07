import { userAgents, type Endpoints } from '#common/constants'
import { ApiContextEnum } from '#common/enums'
import { HTTPException } from 'hono/http-exception'

type EndpointValue = (typeof Endpoints)[keyof typeof Endpoints]

interface FetchParams {
  endpoint: EndpointValue
  params: Record<string, string | number>
  context?: ApiContextEnum
}

interface FetchResponse<T> {
  data: T
  ok: Response['ok']
}

export const useFetch = async <T>({ endpoint, params, context }: FetchParams): Promise<FetchResponse<T>> => {
  const url = new URL('https://www.jiosaavn.com/api.php')

  url.searchParams.append('__call', endpoint.toString())
  url.searchParams.append('_format', 'json')
  url.searchParams.append('_marker', '0')
  url.searchParams.append('api_version', '4')
  url.searchParams.append('ctx', context || 'web6dot0')

  Object.keys(params).forEach((key) => url.searchParams.append(key, String(params[key])))

  let selectedUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)]
  if (context === ApiContextEnum.ANDROID) {
    const mobileUserAgents = userAgents.filter(
      (ua) => ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')
    )
    if (mobileUserAgents.length > 0) {
      selectedUserAgent = mobileUserAgents[Math.floor(Math.random() * mobileUserAgents.length)]
    } else {
      selectedUserAgent =
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/537.36'
    }
  }

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json', 'User-Agent': selectedUserAgent }
  })

  if (!response.ok) {
    throw new HTTPException(response.status as any, {
      message: `upstream request failed with status ${response.status}`
    })
  }

  let data: T
  try {
    const text = await response.text()
    data = JSON.parse(text) as T
  } catch (err) {
    throw new HTTPException(500, {
      message: 'failed to parse upstream response: invalid JSON'
    })
  }

  return { data, ok: response.ok }
}
