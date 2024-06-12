
import { Typography, Button, Card, Divider, Statistic, Row, Col, Modal, Flex, Tooltip, Tabs, TabsProps, QRCode, Badge, Space, Alert } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useWalletsActiveAccount } from '../../state/wallets/hooks';
import { fetchGetTestCoin } from '../../services/gettestcoin';
import { useTransactionAdder2 } from '../../state/transactions/hooks';
import ChecksumAddress from '../../utils/ChecksumAddress';
import { applicationUpdateWalletTab } from '../../state/application/action';
import { useWeb3React } from '@web3-react/core';


const { Title, Text } = Typography;


export default () => {

  const activeAccount = useWalletsActiveAccount();
  const [err, setErr] = useState<string>();
  const [sending, setSending] = useState<boolean>(false);
  const addTransaction = useTransactionAdder2();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chainId } = useWeb3React();

  const doFetchGetTestCoin = useCallback(() => {
    if (chainId) {
      setSending(true);
      fetchGetTestCoin({ address: activeAccount })
        .then(({ transactionHash, amount, address, from }: any) => {
          addTransaction({
            from: ChecksumAddress(from),
            to: address,
            hash: transactionHash,
            chainId
          }, {
            transfer: {
              from: ChecksumAddress(from),
              to: address,
              value: ethers.utils.parseEther(amount).toString()
            }
          });
          dispatch(applicationUpdateWalletTab("history"));
          navigate("/main/wallet");
          setSending(false);
        })
        .catch((err: any) => {
          setSending(false);
          setErr(err.message)
        })
    }
  }, [activeAccount, chainId]);

  useEffect(() => {
    setErr(undefined);
  }, [activeAccount]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          领取测试币
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Alert type='info' showIcon message={<>
            <Text>每个地址每天只能领取 <Text strong>一次</Text> 测试币</Text>
          </>} />
          <Divider />
          <Button disabled={(err || sending) ? true : false} onClick={doFetchGetTestCoin}>点击领取</Button><br /><br />
          {
            err && <Alert type='error' showIcon message={<>
              {err}
            </>} />
          }
        </Card>
      </div>
    </div>
  </>

}
