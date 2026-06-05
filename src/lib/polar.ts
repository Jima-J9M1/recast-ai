import { Polar } from '@polar-sh/sdk'

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
})

export const POLAR_PRODUCTS = {
  starter: process.env.POLAR_STARTER_PRODUCT_ID!,
  pro: process.env.POLAR_PRO_PRODUCT_ID!,
}

export async function createCheckoutUrl(
  productId: string,
  userId: string,
  userEmail: string,
  successUrl: string
): Promise<string> {
  const checkout = await polar.checkouts.create({
    productId,
    customerEmail: userEmail,
    metadata: { userId },
    successUrl,
  })

  return checkout.url
}
