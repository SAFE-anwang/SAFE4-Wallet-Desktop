import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { Alert, Divider, Typography } from "antd";
import { useMemo, useState } from "react"

const { Text, Link } = Typography;

export default (): {
  render: React.ReactNode
  setTransactionResponse: (response: TransactionResponse) => void,
  setErr: (err: any) => void
} => {
  const [showErrorDetail, setShowErrorDetail] = useState(false);
  const [response, setTransactionResponse] = useState<TransactionResponse>();
  const [err, setErr] = useState<any>();

  const render = useMemo(() => {
    if ( !response && !err ){
      return undefined;
    }
    return (<>
      <div style={{ marginBottom: "20px" }}>
        {
          err && <Alert
            message="错误"
            description={
              <>
                <Text>{err.reason}</Text>
                <br />
                {
                  !showErrorDetail && <Link onClick={() => {
                    setShowErrorDetail(true)
                  }}>[查看错误信息]</Link>
                }
                {
                  showErrorDetail && <>
                    <Divider style={{margin:"8px 0px"}} />
                    <div style={{maxHeight:"200px" , overflowY:"scroll"}}>
                      {JSON.stringify(err)}
                    </div>
                  </>
                }
              </>
            }
            type="error"
            showIcon
          />
        }
        {
          response && <Alert
            message="交易哈希"
            description={
              <>
                <Text>{response.hash}</Text>
              </>
            }
            type="success"
            showIcon
          />
        }
      </div>
    </>)
  }, [response, err, showErrorDetail]);
  return {
    render,
    setTransactionResponse,
    setErr
  }
}
