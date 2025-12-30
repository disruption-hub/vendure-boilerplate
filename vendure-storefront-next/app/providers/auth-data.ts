import { graphql } from '@/app/providers/gql';
import { request } from 'graphql-request';
import { API_URL } from '@/app/constants';

const loginMutation = graphql(`
  mutation Login($email: String!, $password: String!, $rememberMe: Boolean) {
    login(username: $email, password: $password, rememberMe: $rememberMe) {
      ... on CurrentUser {
        id
        identifier
      }
      ... on InvalidCredentialsError {
        errorCode
        message
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`);

const registerMutation = graphql(`
  mutation Register($input: RegisterCustomerInput!) {
    registerCustomerAccount(input: $input) {
      ... on Success {
        success
      }
      ... on MissingPasswordError {
        errorCode
        message
      }
      ... on PasswordValidationError {
        errorCode
        message
        validationErrorMessage
      }
      ... on NativeAuthStrategyError {
        errorCode
        message
      }
    }
  }
`);

export async function login(variables: any) {
    return request(API_URL, loginMutation as any, variables);
}

export async function register(variables: any) {
    return request(API_URL, registerMutation as any, variables);
}
