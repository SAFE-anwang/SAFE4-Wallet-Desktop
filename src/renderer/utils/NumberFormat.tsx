
export function format(value: string): string {
  const n = 3;
  let integer = '', decimal = '', result = '';
  if (value.indexOf(".") > 0) {
    integer = value.split(".")[0];
    decimal = value.split(".")[1];
  } else {
    integer = value;
  }
  while (integer.length > 3) {
    result = `,${integer.slice(-n)}${result}`;
    integer = integer.slice(0, integer.length - 3);
  }
  while (decimal.length > 0 && decimal.lastIndexOf('0') == decimal.length - 1) {
    decimal = decimal.substring(0, decimal.lastIndexOf('0'))
  }
  if (integer) {
    result = decimal ? `${integer}${result}.${decimal}` : `${integer}${result}`;
  }
  return result;
}


export default (number: number | string, n?: number) => {
  n = n ? n : 3;
  let parm = BigInt((number || 0)).toString();  //使用Number强转一下再toString
  let integer = ``,
    isNegativeNumber = false,
    decimal = ``,
    result = ``;
  isNegativeNumber = Number((number || 0)) / 1 > 0 ? false : true;
  parm = parm.replace('-', '');
  integer = parm.split(`.`)[0];
  if (parm.split(`.`).length > 1) {
    decimal = parm.split(`.`)[1];
  }
  while (integer.length > 3) {
    result = `,${integer.slice(-n)}${result}`;
    integer = integer.slice(0, integer.length - 3);
  }
  if (integer) {
    result = decimal ? `${integer}${result}.${decimal}` : `${integer}${result}`;
  }
  if (isNegativeNumber && (Number((number || 0)) / 1) !== 0) {
    result = `-${result}`;
  }
  return result;
}
