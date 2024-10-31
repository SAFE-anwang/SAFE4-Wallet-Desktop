import { TransactionRequest, TransactionResponse } from "@ethersproject/providers";
import { Alert, Divider, Typography } from "antd";
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next";

const { Text, Link } = Typography;

export default (): {
  render: React.ReactNode
  setTransactionResponse: (response: TransactionResponse) => void,
  setErr: (err: any) => void,
  response : TransactionResponse | undefined ,
  err : any
} => {
  const { t } = useTranslation();
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
            message={t("error")}
            description={
              <>
                <Text>{err.reason}</Text>
                <br />
                {
                  !showErrorDetail && <Link onClick={() => {
                    setShowErrorDetail(true)
                  }}>[{t("error_view")}]</Link>
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
            message={t("transactionHash")}
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
    setErr,
    response,
    err
  }
}
