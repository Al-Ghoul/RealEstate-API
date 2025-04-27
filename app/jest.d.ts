declare namespace jest {
  interface Expect {
    toBeStringOrNull(): CustomMatcherResult;
  }

  interface Matchers<R> {
    toBeStringOrNull(): R;
  }
}
