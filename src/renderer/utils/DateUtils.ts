import { format } from 'date-fns';

const Date_Format_Pattern = "yyyy-MM-dd";
const DateTime_Format_Pattern = "yyyy-MM-dd HH:mm:ss";

export function TimestampTheEndOf( datetime : string ) : number {
  const _datetime = datetime + "T23:59:59";
  const date = new Date( _datetime );
  return date.getTime();
}

export function TimestampTheStartOf( datetime : string ) : number {
  const _datetime = datetime + "T00:00:00";
  const date = new Date( _datetime );
  return date.getTime();
}

export function GetNowDate() : string {
  return  DateFormat(  new Date() );
}

export function DateTimeFormat(date : Date | number , pattern ?: string){
  pattern = pattern ?? DateTime_Format_Pattern;
  return format( date instanceof Number ? new Date(date) : date , pattern );
}

export function DateFormat( date : Date | number , pattern ?: string ){
  pattern = pattern ?? Date_Format_Pattern;
  return format( date instanceof Number ? new Date(date) : date , pattern );
}
