expect.extend({
  toBeStringOrNull(received) {
    const pass = received === null || typeof received === "string";
    return {
      message: () =>
        `expected ${received} ${pass ? "not " : ""}to be string or null`,
      pass,
    };
  },
});
