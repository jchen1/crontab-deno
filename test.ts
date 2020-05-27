import {
  assertStrictEq,
} from "https://deno.land/std/testing/asserts.ts";

import { timeForCron } from "./cron.ts";

Deno.test("timeForCron", () => {
  const testDate = new Date("2020-05-01T10:00:00");

  assertStrictEq(timeForCron(testDate, "* * * * *"), true);
  assertStrictEq(timeForCron(testDate, "0 * * * *"), true);
  assertStrictEq(timeForCron(testDate, "0-4 * * * *"), true);
  assertStrictEq(timeForCron(testDate, "* * fri * *"), true);
  assertStrictEq(timeForCron(testDate, "1,2,0 * * * *"), true);
  // although may 1 2020 is a friday, we run every day of the month
  assertStrictEq(timeForCron(testDate, "* * * * wed"), true);
  // although 2 !== 1, we run every friday
  assertStrictEq(timeForCron(testDate, "* * 2 * fri"), true);
  assertStrictEq(timeForCron(testDate, "* * * may *"), true);
  assertStrictEq(timeForCron(testDate, "1,2,0 * * * *"), true);
  assertStrictEq(timeForCron(testDate, "* * 10 * thu"), false);

  assertStrictEq(timeForCron(testDate, "1 * * * *"), false);
  assertStrictEq(timeForCron(testDate, "1-59 * * * *"), false);
  assertStrictEq(timeForCron(testDate, "2,3,4 * * * *"), false);
  assertStrictEq(timeForCron(testDate, "* * 2 * thu"), false);
  assertStrictEq(timeForCron(testDate, "* * 4-15/5 * thu"), false);
  assertStrictEq(timeForCron(testDate, "* 4-15/5 * * *"), false);
});
