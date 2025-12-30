import { graphql } from '@/app/providers/gql';
import { request } from 'graphql-request';
import { API_URL } from '@/app/constants';

const activeCustomerQuery = graphql(`
  query GetActiveCustomer {
    activeCustomer {
      id
      firstName
      lastName
      emailAddress
      phoneNumber
    }
  }
`);

const logoutMutation = graphql(`
  mutation Logout {
    logout {
      success
    }
  }
`);

export async function getActiveCustomer() {
    const data = await request(API_URL, activeCustomerQuery as any);
    return data.activeCustomer;
}

export async function logout() {
    return request(API_URL, logoutMutation as any);
}
