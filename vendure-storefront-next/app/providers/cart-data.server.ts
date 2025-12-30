import { graphql } from '@/app/providers/gql';
import { serverRequest } from '@/app/utils/server-request';

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

export async function getActiveOrder() {
    const data = await serverRequest<{ activeOrder: any }>(activeOrderQuery);
    return data.activeOrder;
}
