import { handleOrderTracking } from '../server/order-tracking-handler.js'

export default {
  fetch(request: Request): Promise<Response> {
    return handleOrderTracking(request)
  },
}
