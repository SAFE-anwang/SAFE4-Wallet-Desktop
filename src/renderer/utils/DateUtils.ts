import { format } from 'date-fns';

const Date_Format_Pattern = "yyyy-MM-dd";
const DateTime_Format_Pattern = "yyyy-MM-dd HH:mm:ss";

export function TimestampTheEndOf(datetime: string): number {
  const _datetime = datetime + "T23:59:59";
  const date = new Date(_datetime);
  return date.getTime();
}

export function TimestampTheStartOf(datetime: string): number {
  const _datetime = datetime + "T00:00:00";
  const date = new Date(_datetime);
  return date.getTime();
}

export function GetNowDate(): string {
  return DateFormat(new Date());
}

export function GetNextMonth(): string {
  const date = new Date(); // 获取当前日期
  let year = date.getFullYear();
  let month = date.getMonth() + 1; // getMonth() 返回的月份是从 0 开始的
  // 如果当前月份是 12 月，则下个月是 1 月，年份增加 1
  if (month === 12) {
    month = 1;
    year++;
  } else {
    month++;
  }
  // 将月份格式化为两位数
  const formattedMonth = month < 10 ? `0${month}` : month;
  return `${year}-${formattedMonth}`;
}

export function GetDiffInDays(targetDate: Date, date?: Date) {
  let now = new Date();
  now = date ? date : now;
  // 计算两个日期之间的毫秒差
  const diffInMilliseconds = targetDate.getTime() - now.getTime();
  // 将毫秒差转换为天数
  const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));
  return diffInDays;
}

export function DateTimeFormat(date: Date | number, pattern?: string) {
  pattern = pattern ?? DateTime_Format_Pattern;
  try {
    return format(date instanceof Number ? new Date(date) : date, pattern);
  } catch (err) {
    return "Unknown"
  }
}

export function DateFormat(date: Date | number, pattern?: string) {
  pattern = pattern ?? Date_Format_Pattern;
  try {
    return format(date instanceof Number ? new Date(date) : date, pattern);
  } catch (err) {
    return "Unknown"
  }
}


