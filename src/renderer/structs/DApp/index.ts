

/**
 *  struct DAppInfo {
        uint256 id;
        string name;
        address contract_addr;
        string run_url;
        string git_url;
        string official_url;
        string official_email;
        address official_account;
        string description;
        string keyword;
        uint256 fraudNum;
        bool isFrozen;
    }
 */
export interface DAppInfo {
  id: number,
  name: string,
  contractAddress: string,
  runUrl: string,
  gitUrl: string,
  officialUrl: string,
  officiaEmail: string,
  officiaAccount: string,
  description: string,
  keyword: string,
  fraudNum: number,
  isFrozen: boolean
}

export function formatDAppInfo(dAppInfo: any): DAppInfo {
  const {
    id, name, contract_addr, run_url, git_url, official_url, official_email, official_account, description, keyword, fraudNum, isFrozen
  } = dAppInfo;
  return {
    id: id.toNumber(),
    name,
    contractAddress: contract_addr,
    runUrl: run_url,
    gitUrl: git_url,
    officialUrl: official_url,
    officiaEmail: official_email,
    officiaAccount: official_account,
    description,
    keyword,
    fraudNum: fraudNum.toNumber(),
    isFrozen
  }
}
