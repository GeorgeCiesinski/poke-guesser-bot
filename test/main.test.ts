import { assertEquals } from "@std/assert";

function sum(a: number, b: number) {
  return a + b;
}

Deno.test(function sumTest() {
  assertEquals(sum(2, 3), 5);
});
