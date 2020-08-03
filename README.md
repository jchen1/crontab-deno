# crontab-deno

Job runner for Deno that supports cron syntax.

## Example

```javascript
import { Cron } from "https://deno.land/x/crontab/cron.ts";

const cron = new Cron();

cron.add("* * * * *", () => {
  console.log("every minute");
});

cron.add("*/5 * * * *", () => {
  console.log("every fifth minute");
});

cron.add("0,25 5 1-5 jan *", () => {
  console.log("5:00 and 5:25 every day from Jan 1 through Jan 5");
});

cron.start();
```

## Supported syntax

- `*` operator
- value list separators (`1,2,3`)
- ranges (`1-5`)
- step values (`*/5`)
- month/day-of-week strings (use the first three characters, case-insensitive)

## Not yet supported (PRs welcome!)

- seconds, years
- `@` syntax (both `@every` and `@yearly`)
- `L`, `W`, `#`, `?`
