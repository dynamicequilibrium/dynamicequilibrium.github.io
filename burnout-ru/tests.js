// tests.js - Unit tests for scoring validation

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function testScoring() {
  console.log('Running scoring tests...');

  // Test Case A: All minimum (index 0)
  const responsesA = new Array(19).fill(0);
  const scoresA = computeScores(responsesA);
  assert(scoresA.sub.personal === 0, `Personal should be 0, got ${scoresA.sub.personal}`);
  assert(scoresA.sub.work === 14.285714285714286, `Work should be ~14.29, got ${scoresA.sub.work}`);
  assert(scoresA.sub.patient === 0, `Patient should be 0, got ${scoresA.sub.patient}`);
  assert(scoresA.overall === 5.2631578947368425, `Overall should be ~5.26, got ${scoresA.overall}`);

  // Test Case B: All middle (index 2)
  const responsesB = new Array(19).fill(2);
  const scoresB = computeScores(responsesB);
  assert(scoresB.sub.personal === 50, `Personal should be 50, got ${scoresB.sub.personal}`);
  assert(scoresB.sub.work === 50, `Work should be 50, got ${scoresB.sub.work}`);
  assert(scoresB.sub.patient === 50, `Patient should be 50, got ${scoresB.sub.patient}`);
  assert(scoresB.overall === 50, `Overall should be 50, got ${scoresB.overall}`);

  // Test Case C: All maximum (index 4)
  const responsesC = new Array(19).fill(4);
  const scoresC = computeScores(responsesC);
  assert(scoresC.sub.personal === 100, `Personal should be 100, got ${scoresC.sub.personal}`);
  assert(scoresC.sub.work === 85.71428571428571, `Work should be ~85.71, got ${scoresC.sub.work}`);
  assert(scoresC.sub.patient === 100, `Patient should be 100, got ${scoresC.sub.patient}`);
  assert(scoresC.overall === 95, `Overall should be 95, got ${scoresC.overall}`);

  // Test Case D: Mixed to hit band edges
  const responsesD = [1,1,1,1,1,1, 3,3,3,3,3,3,1, 2,2,2,2,2,2];
  const scoresD = computeScores(responsesD);
  assert(Math.abs(scoresD.sub.personal - 25) < 0.1, `Personal should be ~25, got ${scoresD.sub.personal}`);
  assert(Math.abs(scoresD.sub.work - 67.85714285714286) < 0.1, `Work should be ~67.86, got ${scoresD.sub.work}`);
  assert(scoresD.sub.patient === 50, `Patient should be 50, got ${scoresD.sub.patient}`);

  console.log('All tests passed!');
}

// Run tests if in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', testScoring);
}