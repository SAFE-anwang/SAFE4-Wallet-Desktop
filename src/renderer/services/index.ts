import { ethers } from "ethers";
import ChecksumAddress from "../utils/ChecksumAddress";

export const GET = async function (url: string, params?: any): Promise<any> {
  const URI_params = params ? "?" + obj2URIParams(params) : undefined;
  const response = await fetch(URI_params ? url + URI_params : url, {
      method: 'get',
      headers: {
          'Content-Type': "application/json"
      }
  })
  const data = await response.text();
  const json = data ? JSON.parse(data) : undefined;
  return json as any;
}

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

function obj2URIParams(data: any) {
  var _result = [];
  for (var key in data) {
      var value = data[key];
      if (value && value.constructor === Array) {
          value.forEach(function (_value) {
              _result.push(key + "=" + _value);
          });
      } else {
          _result.push(key + '=' + value);
      }
  }
  return _result.join('&');
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

export interface Safe3AddressVO {
  address : string ,
  avaliable : string ,
  locked : string ,
  masternode : boolean ,
  mLockedAmount : string ,
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

export interface ContractVO {
  address : string ,
  creator : string ,
  creatorBlockNumber : number,
  creatorTransactionHash : string,
  creatorTimestamp : number,
  name ?: string,
  compileType ?: string,
	compileVersion ?: string,
}

export interface ContractCompileVO {
  address : string ,
  name ?: string,
  abi ?: string
}

export interface AddressAnalyticVO {
  nodeRewards : TimeNodeRewardVO[]
}

export interface TimeNodeRewardVO {
  time : string ,
  rewardCount : number ,
  rewardAmount : string
}

export interface DateTimeNodeRewardVO {
  date : string ,
  amount : string ,
  count : number
}

export interface CrossChainVO {

  asset : string,
  srcTxHash : string,
  srcAddress : string,
  srcBlockNumber : number,
  srcTxTimestamp : number,
  srcAmount : string,
  srcNetwork : string,

  dstTxHash : string,
  dstAddress : string,
  dstBlockNumber : number,
  dstTxTimestamp : number,
  dstAmount : string,
  dstNetwork : string,

  fee : string,
  status : number
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

export function ContractVOFormat( contractVO : ContractVO ) : ContractVO {
  return {
    ...contractVO,
    address : ethers.utils.isAddress(contractVO.address)? ChecksumAddress(contractVO.address) : "",
    creator : ethers.utils.isAddress(contractVO.creator)? ChecksumAddress(contractVO.creator) : "",
  }
}


