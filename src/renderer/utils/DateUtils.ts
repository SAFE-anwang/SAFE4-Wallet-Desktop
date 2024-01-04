import { format } from 'date-fns';

const Date_Format_Pattern = "yyyy-MM-dd";
const DateTime_Format_Pattern = "yyyy-MM-dd HH:mm:ss";

export function DateTimeFormat(date : Date | number , pattern ?: string){
  pattern = pattern ?? DateTime_Format_Pattern;
  return format( date instanceof Number ? new Date(date) : date , pattern );
}

export function DateFormat( date : Date | number , pattern ?: string ){
  pattern = pattern ?? Date_Format_Pattern;
  return format( date instanceof Number ? new Date(date) : date , pattern );
}
