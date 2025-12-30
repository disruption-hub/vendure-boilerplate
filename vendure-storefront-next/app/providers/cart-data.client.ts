import { API_URL } from '@/app/constants';
import { GraphQLClient } from 'graphql-request';

// Raw GraphQL mutation string (bypassing codegen issues)
const addItemToOrderMutationString = `
  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
      ... on Order {
        id
        code
        state
        totalQuantity
        totalWithTax
        lines {
          id
          quantity
        }
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`;

// Client-side request helper with credentials
export const shopClient = new GraphQLClient(API_URL, {
  fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
});

export async function addItemToOrder(productVariantId: string, quantity: number) {
  const response = await shopClient.rawRequest<any>(addItemToOrderMutationString, { productVariantId, quantity });

  // Capture token if returned in headers (common when using 'bearer' or when cookie is set but we want to be sure)
  const token = response.headers.get('vendure-auth-token');
  if (token) {
    const isProd = !window.location.hostname.includes('localhost');
    const cookieSuffix = isProd ? '; SameSite=None; Secure' : '; SameSite=Lax';
    document.cookie = `vendure-auth-token=${token}; path=/${cookieSuffix}`;
  }

  return response.data?.addItemToOrder;
}
