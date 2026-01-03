import type { Config } from 'jest'

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@ipnuo/domain$': '<rootDir>/../../../packages/domain/src/index.ts',
    '^@ipnuo/domain(.*)$': '<rootDir>/../../../packages/domain/src$1',
    '^@ipnuo/utils$': '<rootDir>/../../../packages/utils/src/index.ts',
    '^@ipnuo/utils(.*)$': '<rootDir>/../../../packages/utils/src$1',
    '^@ipnuo/shared-chat-auth$': '<rootDir>/../../../packages/shared-chat-auth/src/index.ts',
    '^@ipnuo/shared-chat-auth(.*)$': '<rootDir>/../../../packages/shared-chat-auth/src$1',
    '^@/(.*)$': '<rootDir>/$1',
    '^@$': '<rootDir>',
  },
}

export default config
