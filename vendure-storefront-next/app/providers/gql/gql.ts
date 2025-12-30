/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetActiveCustomer {\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n  }\n": typeof types.GetActiveCustomerDocument,
    "\n  mutation Logout {\n    logout {\n      success\n    }\n  }\n": typeof types.LogoutDocument,
    "\n  mutation Login($email: String!, $password: String!, $rememberMe: Boolean) {\n    login(username: $email, password: $password, rememberMe: $rememberMe) {\n      ... on CurrentUser {\n        id\n        identifier\n      }\n      ... on InvalidCredentialsError {\n        errorCode\n        message\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.LoginDocument,
    "\n  mutation Register($input: RegisterCustomerInput!) {\n    registerCustomerAccount(input: $input) {\n      ... on Success {\n        success\n      }\n      ... on MissingPasswordError {\n        errorCode\n        message\n      }\n      ... on PasswordValidationError {\n        errorCode\n        message\n        validationErrorMessage\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.RegisterDocument,
    "\n  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n      ... on Order {\n        id\n        code\n        state\n        totalQuantity\n        totalWithTax\n        lines {\n          id\n          quantity\n        }\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.AddItemToOrderDocument,
    "\n  query ActiveOrder {\n    activeOrder {\n      id\n      code\n      state\n      totalQuantity\n      totalWithTax\n      currencyCode\n      lines {\n        id\n        productVariant {\n          id\n          name\n          price\n        }\n        unitPriceWithTax\n        quantity\n        linePriceWithTax\n      }\n    }\n  }\n": typeof types.ActiveOrderDocument,
    "\n  mutation SetShippingAddress($input: CreateAddressInput!) {\n    setOrderShippingAddress(input: $input) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.SetShippingAddressDocument,
    "\n  query GetEligibleShippingMethods {\n    eligibleShippingMethods {\n      id\n      name\n      price\n      description\n    }\n  }\n": typeof types.GetEligibleShippingMethodsDocument,
    "\n  mutation SetShippingMethod($ids: [ID!]!) {\n     setOrderShippingMethod(shippingMethodId: $ids) {\n       ... on Order {\n          id\n          state\n       }\n        ... on ErrorResult {\n          errorCode\n          message\n        }\n     }\n  }\n": typeof types.SetShippingMethodDocument,
    "\n  mutation TransitionToArrangingPayment {\n    transitionOrderToState(state: \"ArrangingPayment\") {\n      ... on Order {\n        id\n        state\n      }\n        ... on OrderStateTransitionError {\n        errorCode\n        message\n        fromState\n        toState\n      }\n    }\n  }\n": typeof types.TransitionToArrangingPaymentDocument,
    "\n  mutation AddPayment($method: String!, $metadata: JSON!) {\n    addPaymentToOrder(input: { method: $method, metadata: $metadata }) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": typeof types.AddPaymentDocument,
    "\n  query HeaderQuery {\n    activeCustomer {\n      id\n      firstName\n      lastName\n    }\n    activeOrder {\n      id\n      totalQuantity\n    }\n    collections(options: { topLevelOnly: true }) {\n      items {\n        id\n        slug\n        name\n        breadcrumbs {\n          id\n          name\n          slug\n        }\n      }\n    }\n  }\n": typeof types.HeaderQueryDocument,
    "\n  query HomeQuery {\n    products(options: { take: 8 }) {\n      items {\n        id\n        name\n        slug\n        assets {\n          id\n          preview\n        }\n        featuredAsset {\n          id\n          preview\n        }\n        variants {\n          id\n          price\n          currencyCode\n        }\n      }\n    }\n  }\n": typeof types.HomeQueryDocument,
    "\n  query ProductQuery($slug: String!) {\n    product(slug: $slug) {\n      id\n      name\n      description\n      assets {\n        id\n        preview\n      }\n      featuredAsset {\n        id\n        preview\n      }\n      variants {\n        id\n        price\n        currencyCode\n        name\n      }\n    }\n  }\n": typeof types.ProductQueryDocument,
};
const documents: Documents = {
    "\n  query GetActiveCustomer {\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n  }\n": types.GetActiveCustomerDocument,
    "\n  mutation Logout {\n    logout {\n      success\n    }\n  }\n": types.LogoutDocument,
    "\n  mutation Login($email: String!, $password: String!, $rememberMe: Boolean) {\n    login(username: $email, password: $password, rememberMe: $rememberMe) {\n      ... on CurrentUser {\n        id\n        identifier\n      }\n      ... on InvalidCredentialsError {\n        errorCode\n        message\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n": types.LoginDocument,
    "\n  mutation Register($input: RegisterCustomerInput!) {\n    registerCustomerAccount(input: $input) {\n      ... on Success {\n        success\n      }\n      ... on MissingPasswordError {\n        errorCode\n        message\n      }\n      ... on PasswordValidationError {\n        errorCode\n        message\n        validationErrorMessage\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n": types.RegisterDocument,
    "\n  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n      ... on Order {\n        id\n        code\n        state\n        totalQuantity\n        totalWithTax\n        lines {\n          id\n          quantity\n        }\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.AddItemToOrderDocument,
    "\n  query ActiveOrder {\n    activeOrder {\n      id\n      code\n      state\n      totalQuantity\n      totalWithTax\n      currencyCode\n      lines {\n        id\n        productVariant {\n          id\n          name\n          price\n        }\n        unitPriceWithTax\n        quantity\n        linePriceWithTax\n      }\n    }\n  }\n": types.ActiveOrderDocument,
    "\n  mutation SetShippingAddress($input: CreateAddressInput!) {\n    setOrderShippingAddress(input: $input) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.SetShippingAddressDocument,
    "\n  query GetEligibleShippingMethods {\n    eligibleShippingMethods {\n      id\n      name\n      price\n      description\n    }\n  }\n": types.GetEligibleShippingMethodsDocument,
    "\n  mutation SetShippingMethod($ids: [ID!]!) {\n     setOrderShippingMethod(shippingMethodId: $ids) {\n       ... on Order {\n          id\n          state\n       }\n        ... on ErrorResult {\n          errorCode\n          message\n        }\n     }\n  }\n": types.SetShippingMethodDocument,
    "\n  mutation TransitionToArrangingPayment {\n    transitionOrderToState(state: \"ArrangingPayment\") {\n      ... on Order {\n        id\n        state\n      }\n        ... on OrderStateTransitionError {\n        errorCode\n        message\n        fromState\n        toState\n      }\n    }\n  }\n": types.TransitionToArrangingPaymentDocument,
    "\n  mutation AddPayment($method: String!, $metadata: JSON!) {\n    addPaymentToOrder(input: { method: $method, metadata: $metadata }) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n": types.AddPaymentDocument,
    "\n  query HeaderQuery {\n    activeCustomer {\n      id\n      firstName\n      lastName\n    }\n    activeOrder {\n      id\n      totalQuantity\n    }\n    collections(options: { topLevelOnly: true }) {\n      items {\n        id\n        slug\n        name\n        breadcrumbs {\n          id\n          name\n          slug\n        }\n      }\n    }\n  }\n": types.HeaderQueryDocument,
    "\n  query HomeQuery {\n    products(options: { take: 8 }) {\n      items {\n        id\n        name\n        slug\n        assets {\n          id\n          preview\n        }\n        featuredAsset {\n          id\n          preview\n        }\n        variants {\n          id\n          price\n          currencyCode\n        }\n      }\n    }\n  }\n": types.HomeQueryDocument,
    "\n  query ProductQuery($slug: String!) {\n    product(slug: $slug) {\n      id\n      name\n      description\n      assets {\n        id\n        preview\n      }\n      featuredAsset {\n        id\n        preview\n      }\n      variants {\n        id\n        price\n        currencyCode\n        name\n      }\n    }\n  }\n": types.ProductQueryDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActiveCustomer {\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n  }\n"): (typeof documents)["\n  query GetActiveCustomer {\n    activeCustomer {\n      id\n      firstName\n      lastName\n      emailAddress\n      phoneNumber\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout {\n      success\n    }\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout {\n      success\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($email: String!, $password: String!, $rememberMe: Boolean) {\n    login(username: $email, password: $password, rememberMe: $rememberMe) {\n      ... on CurrentUser {\n        id\n        identifier\n      }\n      ... on InvalidCredentialsError {\n        errorCode\n        message\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($email: String!, $password: String!, $rememberMe: Boolean) {\n    login(username: $email, password: $password, rememberMe: $rememberMe) {\n      ... on CurrentUser {\n        id\n        identifier\n      }\n      ... on InvalidCredentialsError {\n        errorCode\n        message\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Register($input: RegisterCustomerInput!) {\n    registerCustomerAccount(input: $input) {\n      ... on Success {\n        success\n      }\n      ... on MissingPasswordError {\n        errorCode\n        message\n      }\n      ... on PasswordValidationError {\n        errorCode\n        message\n        validationErrorMessage\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Register($input: RegisterCustomerInput!) {\n    registerCustomerAccount(input: $input) {\n      ... on Success {\n        success\n      }\n      ... on MissingPasswordError {\n        errorCode\n        message\n      }\n      ... on PasswordValidationError {\n        errorCode\n        message\n        validationErrorMessage\n      }\n      ... on NativeAuthStrategyError {\n        errorCode\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n      ... on Order {\n        id\n        code\n        state\n        totalQuantity\n        totalWithTax\n        lines {\n          id\n          quantity\n        }\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {\n    addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {\n      ... on Order {\n        id\n        code\n        state\n        totalQuantity\n        totalWithTax\n        lines {\n          id\n          quantity\n        }\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ActiveOrder {\n    activeOrder {\n      id\n      code\n      state\n      totalQuantity\n      totalWithTax\n      currencyCode\n      lines {\n        id\n        productVariant {\n          id\n          name\n          price\n        }\n        unitPriceWithTax\n        quantity\n        linePriceWithTax\n      }\n    }\n  }\n"): (typeof documents)["\n  query ActiveOrder {\n    activeOrder {\n      id\n      code\n      state\n      totalQuantity\n      totalWithTax\n      currencyCode\n      lines {\n        id\n        productVariant {\n          id\n          name\n          price\n        }\n        unitPriceWithTax\n        quantity\n        linePriceWithTax\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetShippingAddress($input: CreateAddressInput!) {\n    setOrderShippingAddress(input: $input) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation SetShippingAddress($input: CreateAddressInput!) {\n    setOrderShippingAddress(input: $input) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetEligibleShippingMethods {\n    eligibleShippingMethods {\n      id\n      name\n      price\n      description\n    }\n  }\n"): (typeof documents)["\n  query GetEligibleShippingMethods {\n    eligibleShippingMethods {\n      id\n      name\n      price\n      description\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SetShippingMethod($ids: [ID!]!) {\n     setOrderShippingMethod(shippingMethodId: $ids) {\n       ... on Order {\n          id\n          state\n       }\n        ... on ErrorResult {\n          errorCode\n          message\n        }\n     }\n  }\n"): (typeof documents)["\n  mutation SetShippingMethod($ids: [ID!]!) {\n     setOrderShippingMethod(shippingMethodId: $ids) {\n       ... on Order {\n          id\n          state\n       }\n        ... on ErrorResult {\n          errorCode\n          message\n        }\n     }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation TransitionToArrangingPayment {\n    transitionOrderToState(state: \"ArrangingPayment\") {\n      ... on Order {\n        id\n        state\n      }\n        ... on OrderStateTransitionError {\n        errorCode\n        message\n        fromState\n        toState\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation TransitionToArrangingPayment {\n    transitionOrderToState(state: \"ArrangingPayment\") {\n      ... on Order {\n        id\n        state\n      }\n        ... on OrderStateTransitionError {\n        errorCode\n        message\n        fromState\n        toState\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddPayment($method: String!, $metadata: JSON!) {\n    addPaymentToOrder(input: { method: $method, metadata: $metadata }) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddPayment($method: String!, $metadata: JSON!) {\n    addPaymentToOrder(input: { method: $method, metadata: $metadata }) {\n      ... on Order {\n        id\n        state\n      }\n      ... on ErrorResult {\n        errorCode\n        message\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HeaderQuery {\n    activeCustomer {\n      id\n      firstName\n      lastName\n    }\n    activeOrder {\n      id\n      totalQuantity\n    }\n    collections(options: { topLevelOnly: true }) {\n      items {\n        id\n        slug\n        name\n        breadcrumbs {\n          id\n          name\n          slug\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query HeaderQuery {\n    activeCustomer {\n      id\n      firstName\n      lastName\n    }\n    activeOrder {\n      id\n      totalQuantity\n    }\n    collections(options: { topLevelOnly: true }) {\n      items {\n        id\n        slug\n        name\n        breadcrumbs {\n          id\n          name\n          slug\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query HomeQuery {\n    products(options: { take: 8 }) {\n      items {\n        id\n        name\n        slug\n        assets {\n          id\n          preview\n        }\n        featuredAsset {\n          id\n          preview\n        }\n        variants {\n          id\n          price\n          currencyCode\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  query HomeQuery {\n    products(options: { take: 8 }) {\n      items {\n        id\n        name\n        slug\n        assets {\n          id\n          preview\n        }\n        featuredAsset {\n          id\n          preview\n        }\n        variants {\n          id\n          price\n          currencyCode\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProductQuery($slug: String!) {\n    product(slug: $slug) {\n      id\n      name\n      description\n      assets {\n        id\n        preview\n      }\n      featuredAsset {\n        id\n        preview\n      }\n      variants {\n        id\n        price\n        currencyCode\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query ProductQuery($slug: String!) {\n    product(slug: $slug) {\n      id\n      name\n      description\n      assets {\n        id\n        preview\n      }\n      featuredAsset {\n        id\n        preview\n      }\n      variants {\n        id\n        price\n        currencyCode\n        name\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;