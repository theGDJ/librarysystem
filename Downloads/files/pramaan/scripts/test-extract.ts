import assert from "node:assert/strict";
import { extractMarks, normaliseIsCode } from "../src/lib/verify/extract";

const values = (text: string) => extractMarks(text).map((candidate) => candidate.normalised);

assert.deepEqual(values("ISI: CM/L-7200045182"), ["CM/L-7200045182"]);
assert.deepEqual(values("CRS R-41008720411"), ["R-41008720411"]);
assert.deepEqual(values("Jeweller HM/C-729001188"), ["HM/C-729001188"]);
assert.deepEqual(values("Gold HUID A1B2C3"), ["A1B2C3"]);

assert.deepEqual(values("CM / L - 7200 045182"), ["CM/L-7200045182"]);
assert.deepEqual(values("CM/L7200045182"), ["CM/L-7200045182"]);
assert.deepEqual(values("CM/I-7200045182"), ["CM/L-7200045182"]);
assert.deepEqual(values("CMIL720OO45182"), ["CM/L-7200045182"]);
assert.deepEqual(values("R 4I008720411"), ["R-41008720411"]);
assert.deepEqual(values("HM / C 7290O1188"), ["HM/C-729001188"]);

assert.deepEqual(values("Product label ABC123 and more text"), []);
assert.deepEqual(values("HUID: Z9X8W7"), ["Z9X8W7"]);
assert.deepEqual(values("IS 694:2010 standard, mark CM/L-7200045182"), ["CM/L-7200045182"]);
assert.equal(normaliseIsCode("आईएस 2347"), "IS 2347");
assert.equal(normaliseIsCode("IS 694:2010"), "IS 694:2010");

console.log("✓ extractMarks cases passed");
