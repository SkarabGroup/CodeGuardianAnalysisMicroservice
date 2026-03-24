import { sum } from "../../../src/domain/services/implementations/impl";

test('somma corretta', () => {
  expect(sum(2, 3)).toBe(5);
});
