import { handleCheckout } from '../server/checkout-handler'

export default {
  fetch(request: Request): Promise<Response> {
    return handleCheckout(request)
  },
}
