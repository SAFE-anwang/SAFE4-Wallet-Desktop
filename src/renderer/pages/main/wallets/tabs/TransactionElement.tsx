
import { Col, Row, Avatar, List, Typography, Modal, Button } from "antd";
import { useTransactions } from "../../../../state/transactions/hooks";
import SAFE_LOGO from "../../../../assets/logo/SAFE.png";
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import "./index.css";
import { useState } from "react";
import { TransactionDetails } from "../../../../state/transactions/reducer";
import { ethers } from "ethers";
import EtherAmount from "../../../../utils/EtherAmount";

const { Text } = Typography;

export default ({ transaction }: {
  transaction: TransactionDetails
}) => {

  const {
    receipt,
    transfer
  } = transaction;

  const { from , to  , value , token } = transfer ? transfer : {
    from : null , to : null , value : null , token : null
  };

  console.log("element :" , transaction)

  return <>
    <List.Item className="history-element">
      <List.Item.Meta
        avatar={
          <>
            {
              !receipt && <Spin indicator={<LoadingOutlined style={{ fontSize: "34px", marginLeft: "-17px", marginTop: "-17px" }} />} >
                <Avatar src={SAFE_LOGO}  />
              </Spin>
            }
            {
              receipt && <Avatar src={SAFE_LOGO} />
            }
          </>
        }
        title={<>
          <Text strong>发送</Text>
        </>}
        description={
          <>{from}</>
        }
      />
      <div>
        <Text>{ value && EtherAmount({raw:value,fix:18})}</Text><br />
      </div>
    </List.Item>
  </>
}
