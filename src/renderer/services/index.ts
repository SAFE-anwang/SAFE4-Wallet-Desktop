import ChecksumAddress from "../utils/ChecksumAddress";


export const POST = async function (url: string, params?: any): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify(params),
    })
    const json = await response.json();
    return json as ApiResponse<any>;
  }catch( err : any ){
    console.log("fetch err >>>" , err)
    return {
      code : "0",
      data : {},
      message:""
    }
  }
}

export interface ApiResponse<VO> {
  code: string,
  message: string,
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
  id: number,
  blockNumber: number,
  transactionHash: string,
  status: number,
  eventLogIndex: number,
  timestamp: number,
  refFrom: string,
  refTo: string,
  action: string,
  data: any
}

export interface GetTestCoinVO {
  address : string,
  dateTimestamp : number,
  amount : string,
  from : string
}

export interface SuperNodeVO {
  rank: number,
  id: number,
  totalAmount: string,
  totalVoteNum: string,
  totalVoteAmount: string,
  voteObtainedRate: string,
  createHeight: number,
  updateHeight: number,
  lastRewardHeight: number,
  name: string,
  addr: string,
  enode: string,
  creator: string,
  description: string,
  founders: MemberInfoVO[],
  incentivePlan: IncentivePlanVO,
  state : number
}

export interface MemberInfoVO {
  lockID: number,
  addr: string,
  amount: string,
  height: number,

  lockDay?: number,
  unlockHeight?: number,
  releaseHeight?: number,
  unfreezeHeight?: number,
}

export interface IncentivePlanVO {
  creator: number,
  partner: number,
  voter: number
}



export function AddressActivityFormat(activity: AddressActivityVO): AddressActivityVO {
  const { data } = activity;
  let _data: any;
  _data = {
    ...data ,
    from : data.from ? ChecksumAddress(data.from) : undefined,
    to : data.to ? ChecksumAddress(data.to) : undefined
  }
  return {
    ...activity,
    refFrom: activity.refFrom ? ChecksumAddress(activity.refFrom) : "",
    refTo: activity.refTo ? ChecksumAddress(activity.refTo) : "",
    timestamp: activity.timestamp * 1000,
    data: _data
  }
}


