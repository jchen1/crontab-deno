import {
  assertStrictEquals,
} from "https://deno.land/std@0.71.0/testing/asserts.ts";

import { timeForCron } from "./cron.ts";

Deno.test("timeForCron", () => {
  const testDate = new Date("2020-05-01T10:00:00");

  assertStrictEquals(timeForCron(testDate, "* * * * *"), true);
  assertStrictEquals(timeForCron(testDate, "0 * * * *"), true);
  assertStrictEquals(timeForCron(testDate, "0-4 * * * *"), true);
  assertStrictEquals(timeForCron(testDate, "* * fri * *"), true);
  assertStrictEquals(timeForCron(testDate, "1,2,0 * * * *"), true);
  // although may 1 2020 is a friday, we run every day of the month
  assertStrictEquals(timeForCron(testDate, "* * * * wed"), true);
  // although 2 !== 1, we run every friday
  assertStrictEquals(timeForCron(testDate, "* * 2 * fri"), true);
  assertStrictEquals(timeForCron(testDate, "* * * may *"), true);
  assertStrictEquals(timeForCron(testDate, "1,2,0 * * * *"), true);
  assertStrictEquals(timeForCron(testDate, "* * 10 * thu"), false);

  assertStrictEquals(timeForCron(testDate, "1 * * * *"), false);
  assertStrictEquals(timeForCron(testDate, "1-59 * * * *"), false);
  assertStrictEquals(timeForCron(testDate, "2,3,4 * * * *"), false);
  assertStrictEquals(timeForCron(testDate, "* * 2 * thu"), false);
  assertStrictEquals(timeForCron(testDate, "* * 4-15/5 * thu"), false);
  assertStrictEquals(timeForCron(testDate, "* 4-15/5 * * *"), false);
});
