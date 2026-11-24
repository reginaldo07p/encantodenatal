import { handleBearPayWebhook } from '../server/webhook-handler.js'

export default {
  fetch(request: Request): Promise<Response> {
    return handleBearPayWebhook(request)
  },
}
