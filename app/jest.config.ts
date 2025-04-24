import type { Config } from "jest";

const config: Config = {
  verbose: true,
  testEnvironment: "node",
  transformIgnorePatterns: ["/node_modules/(?!lodash-es)"],
};

export default config;
