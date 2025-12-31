'use server';

import { graphql } from 'gql.tada';
import { mutate } from './api';
import { setAuthToken } from '@/lib/auth';

const AuthenticateWithZKeyMutation = graphql(`
  mutation AuthenticateWithZKey($token: String!) {
    authenticate(input: {
      zkey: {
        token: $token
      }
    }) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function authenticateWithZKey(token: string) {
  const result = await mutate(AuthenticateWithZKeyMutation, { token });
  if (result.token) {
    await setAuthToken(result.token);
  }
  return result;
}
