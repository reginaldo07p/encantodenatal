import { handleCheckout } from '../server/checkout-handler.js'

export default {
  fetch(request: Request): Promise<Response> {
    return handleCheckout(request)
  },
}
