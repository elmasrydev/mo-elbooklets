// e2e/utils/sleep.js
// A simple busy-wait loop to implement a delay in Maestro E2E tests

const start = new Date().getTime();
const ms = typeof timeout !== 'undefined' ? parseInt(timeout, 10) : 1000;
while (new Date().getTime() - start < ms) {
  // Busy wait
}
