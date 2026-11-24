import { handleBearPayWebhook } from '../server/webhook-handler'

export default {
  fetch(request: Request): Promise<Response> {
    return handleBearPayWebhook(request)
  },
}
