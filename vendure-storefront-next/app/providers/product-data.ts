import { graphql } from '@/app/providers/gql';
import { serverRequest } from '@/app/utils/server-request';

const productQuery = graphql(`
  query ProductQuery($slug: String!) {
    product(slug: $slug) {
      id
      name
      description
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
        name
      }
    }
  }
`);

export async function getProduct(slug: string) {
  const data = await serverRequest<{ product: any }>(productQuery, { slug });
  return data.product;
}
