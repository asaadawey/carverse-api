class CustomSequencer {
  sort(tests) {
    return tests.sort((a, b) => {
      // Example: Sort by test file name alphabetically
      return a.path.localeCompare(b.path);
    });
  }
}

module.exports = CustomSequencer;
