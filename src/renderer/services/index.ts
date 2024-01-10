

export const POST = async function (url: string, params?: any): Promise<ApiResponse<any>> {
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': "application/json"
    },
    body: JSON.stringify(params)
  })
  const json = await response.json();
  return json as ApiResponse<any>;
}

export interface ApiResponse<VO> {
  code: string,
  msg: string,
  data: VO
}

export interface PageResponseVO<VO> {
  current: number,
  pageSize: number,
  total: number,
  totalPages: number,
  records: VO[],
}

export interface PageQueryDTO {
  current: number | undefined,
  pageSize: number | undefined,
  orderMode?: string | undefined,
  orderProp?: string | undefined,
  blockNumber?: number
}

export interface AddressActivityVO {
  id : number ,
  blockNumber : number,
  transactionHash : string,
  status : number,
  eventLogIndex : number,
  timestamp : number,
  refFrom : string,
  refTo : string,
  action : string,
  data : any
}
