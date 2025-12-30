import { graphql } from '@/app/providers/gql';
import { request } from 'graphql-request';
import { API_URL } from '@/app/constants';

const activeOrderQuery = graphql(`
  query ActiveOrder {
    activeOrder {
      id
      code
      state
      totalQuantity
      totalWithTax
      currencyCode
      lines {
        id
        productVariant {
          id
          name
          price
        }
        unitPriceWithTax
        quantity
        linePriceWithTax
      }
    }
  }
`);

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

export async function getActiveOrder() {
    const data = await request(API_URL, activeOrderQuery as any);
    return data.activeOrder;
}

export async function addItemToOrder(productVariantId: string, quantity: number) {
    return request(API_URL, addItemToOrderMutation as any, { productVariantId, quantity });
}
