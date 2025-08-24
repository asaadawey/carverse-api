// Mock for nanoid to avoid ES module issues in Jest
module.exports = {
  nanoid: () => 'test-id-' + Math.random().toString(36).substr(2, 9),
  customAlphabet: (alphabet, size) => () =>
    'test-id-' +
    Math.random()
      .toString(36)
      .substr(2, size || 10),
};
