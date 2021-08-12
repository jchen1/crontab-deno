type CronJob = {
  id: bigint;
  schedule: string;
  fn: () => any;
};

const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

const cronParts: Record<string, (date: Date) => number> = {
  minute: (date) => date.getMinutes(),
  hour: (date) => date.getHours(),
  dayOfMonth: (date) => date.getDate(),
  month: (date) => date.getMonth() + 1,
  dayOfWeek: (date) => date.getDay(),
};

function cronPartMatches(now: Date, cronPart: string, part: string) {
  const currPart = cronParts[part](now);
  // A list is a set of numbers (or ranges) separated by commas.
  const opts = cronPart.split(",").map((p) => p.trim());

  return opts.some((cronPart) => {
    // A field may contain an asterisk, which always stands for "first-last".
    if (cronPart === "*") return true;
    // exact match
    if (cronPart === String(currPart)) return true;
    // Names can also be used for the 'month' and 'day of week' fields.
    // Use the first three letters of the particular day or month
    // (case does not matter)
    if (part === "month" && cronPart.toLowerCase() === months[currPart - 1]) {
      return true;
    }
    if (part === "dayOfWeek" && cronPart.toLowerCase() === days[currPart]) {
      return true;
    }

    const rangeMatch = cronPart.match(/(\d+)-(\d+)/);
    const stepMatch = cronPart.match(/[\d-*]+\/(\d+)/);

    let rangeMatches = true;
    let stepMatches = true;

    let rangeStart: number | undefined;
    let rangeEnd: number | undefined;

    if (rangeMatch !== null) {
      rangeStart = parseInt(rangeMatch[1]);
      rangeEnd = parseInt(rangeMatch[2]);
      rangeMatches = rangeStart <= currPart && currPart <= rangeEnd;
    }

    // Step values can be used in conjunction with ranges.
    // Following a range with "/<number>" specifies skips of the
    // number's value through the range.
    if (stepMatch !== null) {
      const step = parseInt(stepMatch[1]);
      stepMatches = (currPart - (rangeStart || 0)) % step === 0;
    }

    if (rangeMatch) {
      return rangeMatches && stepMatches;
    } else if (stepMatch) {
      return stepMatches;
    }

    return false;
  });
}

export function timeForCron(now: Date, schedule: string) {
  const crontab = schedule.split(" ");

  const matches = Object.keys(cronParts).reduce((acc, k, idx) => {
    acc[k] = cronPartMatches(now, crontab[idx], k);
    return acc;
  }, {} as Record<string, boolean>);

  // Note: The day of a command's execution can be specified in the following
  // two fields --- 'day of month', and 'day of week'.
  // If both fields are restricted (i.e., do not contain the "*" character),
  // the command will be run when either field matches the current time.
  return (
    matches.minute &&
    matches.hour &&
    matches.month &&
    (matches.dayOfMonth || matches.dayOfWeek)
  );
}

export class Cron {
  private lastest_id = 0n;

  jobs: CronJob[];

  constructor() {
    this.jobs = [];
  }

  /**
   * @param schedule cron syntax to schedule a job
   * @param fn a function to execute
   * @returns identifier for cron job
   */
  add(schedule: string, fn: () => any): bigint {
    if (
      !schedule.match(/((?:[\d*-/]+|[A-Za-z]{3}) ){4}(?:[\d*-/]+|[A-Za-z]{3})/)
    ) {
      throw new Error(`invalid crontab: ${schedule}!`);
    }
    const id = this.lastest_id += 1n;
    this.jobs.push({ id, schedule, fn });
    return id;
  }

  /**
   *
   * @param filter a function used to remove jobs if function return true job will be removed
   * @param limit number of job to remove default is Number.MAX_VALUE
   * @returns removed job
   */
  removeBy(filter: (job: CronJob) => boolean, limit = Number.MAX_VALUE): CronJob[] {
    const jobs = this.jobs;
    const removed = [];
    let lim = 0;
    for (let index = jobs.length - 1; index >= 0; --index) {
      const job = jobs[index];
      if (filter(job)) {
        const rm = jobs.splice(index, 1);
        if (rm.length > 0) {
          removed.push(rm[0]);
        }
        if (++lim == limit) break
      }
    }
    return removed;
  }

  /**
   * remove job by id
   * @param id job id to remove
   * @returns removed job
   */
  removeById(id: bigint): CronJob | null {
    const removed = this.removeBy((job) => job.id == id, 1)
    return removed.length == 0 ? null : removed[0];
  }

  /**
   * remove job by schedule
   * @param schedule job schedule to remove
   * @returns removed jobs
   */
  removeBySchedule(schedule: string): CronJob[] {
    return this.removeBy((job) => job.schedule == schedule);
  }

  /**
   * remove job by function
   * @param fn job fn to remove
   * @returns removed jobs
   */
  removeByFunction(fn: () => any): CronJob[] {
    return this.removeBy((job) => job.fn == fn);
  }

  async start() {
    const now = new Date();
    setTimeout(() => this.start(), (61 - now.getSeconds()) * 1000);

    return Promise.allSettled(
      this.jobs
        .filter(({ schedule }) => timeForCron(now, schedule))
        .map((job) => job.fn()),
    );
  }
}
