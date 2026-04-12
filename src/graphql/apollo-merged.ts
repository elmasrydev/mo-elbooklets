import * as ApolloCore from '@apollo/client';
import * as ApolloReact from '@apollo/client/react';

// Re-export everything from both
export * from '@apollo/client';
export * from '@apollo/client/react';

// Resolve InternalTypes ambiguity
export { InternalTypes } from '@apollo/client';

// Apollo 4 compatibility bridges for GraphQL Codegen
// These types were either moved or renamed in Apollo Client 4, but are expected by the codegen templates.
export type MutationFunction<TData = any, TVariables extends ApolloCore.OperationVariables = ApolloCore.OperationVariables> = 
  (options?: any) => Promise<any>;

// In Apollo 4, BaseMutationOptions is typically MutationHookOptions
export type BaseMutationOptions<TData = any, TVariables extends ApolloCore.OperationVariables = ApolloCore.OperationVariables> = 
  ApolloReact.MutationHookOptions<TData, TVariables>;
