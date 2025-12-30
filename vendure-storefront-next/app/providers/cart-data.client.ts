import { graphql } from '@/app/providers/gql';
import { print } from 'graphql';
import { API_URL } from '@/app/constants';
import { GraphQLClient } from 'graphql-request';

const addItemToOrderMutation = graphql(`
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
`);

// Client-side request helper with credentials
const client = new GraphQLClient(API_URL, {
  fetch: (url, options) => fetch(url, { ...options, credentials: 'include' }),
});

export async function addItemToOrder(productVariantId: string, quantity: number) {
  const query = typeof addItemToOrderMutation === 'string' ? addItemToOrderMutation : print(addItemToOrderMutation);
  const response = await client.rawRequest(query, { productVariantId, quantity });

  // Capture token if returned in headers (common when using 'bearer' or when cookie is set but we want to be sure)
  const token = response.headers.get('vendure-auth-token');
  if (token) {
    document.cookie = `vendure-auth-token=${token}; path=/; SameSite=Lax`;
  }

  return response.data;
}
