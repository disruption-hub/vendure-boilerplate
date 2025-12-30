import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
    schema: 'http://localhost:3000/shop-api',
    documents: ['app/**/*.tsx', 'app/**/*.ts'],
    ignoreNoDocuments: true, // for better experience with the watcher
    generates: {
        './app/providers/gql/': {
            preset: 'client',
            plugins: [],
        },
    },
};

export default config;
