export interface Uptime {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Calendar-aware difference between `start` and `now` (same algorithm as the original site). */
export function computeUptime(start: Date, now: Date): Uptime {
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();
  let seconds = now.getSeconds() - start.getSeconds();
  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }
  return { years, months, days, hours, minutes, seconds };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatUptime(u: Uptime): string {
  return `${u.years}y ${u.months}m ${u.days}d ${pad(u.hours)}:${pad(u.minutes)}:${pad(u.seconds)}`;
}
