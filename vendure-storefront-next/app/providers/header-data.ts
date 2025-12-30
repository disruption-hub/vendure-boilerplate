import { graphql } from '@/app/providers/gql';
import { serverRequest } from '@/app/utils/server-request';

const headerQuery = graphql(`
  query HeaderQuery {
    activeCustomer {
      id
      firstName
      lastName
    }
    activeOrder {
      id
      totalQuantity
    }
    collections(options: { topLevelOnly: true }) {
      items {
        id
        slug
        name
        breadcrumbs {
          id
          name
          slug
        }
      }
    }
  }
`);

export async function getHeaderData() {
  const data = await serverRequest<{ activeCustomer: any; activeOrder: any; collections: any }>(headerQuery);
  return {
    activeCustomer: data.activeCustomer,
    activeOrder: data.activeOrder,
    collections: data.collections.items,
  };
}
