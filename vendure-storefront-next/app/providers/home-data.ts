import { graphql } from '@/app/providers/gql';
import { serverRequest } from '@/app/utils/server-request';

const homeQuery = graphql(`
  query HomeQuery {
    products(options: { take: 8 }) {
      items {
        id
        name
        slug
        assets {
          id
          preview
        }
        featuredAsset {
          id
          preview
        }
        variants {
          id
          price
          currencyCode
        }
      }
    }
  }
`);

export async function getHomeData() {
  const data = await serverRequest<{ products: { items: any[] } }>(homeQuery);
  return data.products.items;
}
