import { graphql } from '@/app/providers/gql';
import { request } from 'graphql-request';
import { API_URL } from '@/app/constants';

const setShippingAddressMutation = graphql(`
  mutation SetShippingAddress($input: CreateAddressInput!) {
    setOrderShippingAddress(input: $input) {
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

const getEligibleShippingMethodsQuery = graphql(`
  query GetEligibleShippingMethods {
    eligibleShippingMethods {
      id
      name
      price
      description
    }
  }
`);

const setOrderShippingMethodMutation = graphql(`
  mutation SetShippingMethod($ids: [ID!]!) {
     setOrderShippingMethod(shippingMethodId: $ids) {
       ... on Order {
          id
          state
       }
        ... on ErrorResult {
          errorCode
          message
        }
     }
  }
`);

const transitionToArrangingPaymentMutation = graphql(`
  mutation TransitionToArrangingPayment {
    transitionOrderToState(state: "ArrangingPayment") {
      ... on Order {
        id
        state
      }
        ... on OrderStateTransitionError {
        errorCode
        message
        fromState
        toState
      }
    }
  }
`);

const addPaymentMutation = graphql(`
  mutation AddPayment($method: String!, $metadata: JSON!) {
    addPaymentToOrder(input: { method: $method, metadata: $metadata }) {
      ... on Order {
        id
        state
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function setShippingAddress(input: any) {
    return request(API_URL, setShippingAddressMutation as any, { input });
}

export async function getEligibleShippingMethods() {
    const data = await request(API_URL, getEligibleShippingMethodsQuery as any);
    return data.eligibleShippingMethods;
}

export async function setShippingMethod(id: string) {
    return request(API_URL, setOrderShippingMethodMutation as any, { ids: [id] });
}

export async function transitionToArrangingPayment() {
    return request(API_URL, transitionToArrangingPaymentMutation as any);
}

export async function addPayment(method: string, metadata: any) {
    return request(API_URL, addPaymentMutation as any, { method, metadata });
}
