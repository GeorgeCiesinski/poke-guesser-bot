import { describe, expect, test } from '@jest/globals';
// import { index } from './index';

describe('index module', () => {
	test('adds 1 + 2 to equal 3', () => {
		expect(index(1, 2)).toBe(3);
	});
});
