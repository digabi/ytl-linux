import { STATUS_CODE, STATUS_TEXT } from '@std/http'

export function fakeDiscoveryResponse(status: (typeof STATUS_CODE)[keyof typeof STATUS_CODE], body: unknown) {
  return new Response(JSON.stringify(body), {
    status: status,
    statusText: STATUS_TEXT[status],
    headers: {
      'content-type': 'application/json'
    }
  })
}
