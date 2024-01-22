

import { Button, Col, Divider, Input, Modal, Row, Typography, Space, Checkbox } from "antd"
import { Children, useEffect, useMemo, useState } from "react";
import { SupernodeInfo } from "../../../../structs/Supernode";
import { AccountRecord } from "../../../../structs/AccountManager";

const { Text } = Typography;
export default ({
  openVoteModal, setOpenVoteModal,
  supernodeInfo,
  accountRecords
}: {
  openVoteModal: boolean,
  setOpenVoteModal: (openVoteModal: boolean) => void,
  supernodeInfo: SupernodeInfo,
  accountRecords: AccountRecord[]
}) => {

  const cancel = () => {
    setOpenVoteModal(false);
  }

  const options = accountRecords.map(accountRecord => {
    return {
      label: <>
        <div key={accountRecord.id} style={{ margin: "15px 15px" }}>
          <Row>
            <Col>锁仓记录ID:</Col>
            <Col>{accountRecord.id}</Col>
          </Row>
          <Row style={{ fontSize: "12px" }}>{accountRecord.amount.toFixed(2)} SAFE</Row>
        </div>
      </>,
      value: accountRecord.id,
      disabled: true
    }
  });
  const optionIds = accountRecords.map(accountRecord => accountRecord.id);

  return <>
    <Modal footer={null} destroyOnClose title="投票" width="600px" open={openVoteModal} onCancel={cancel}>
      <Divider />

      <Row >
        <Col span={24}>
          <Text style={{ fontSize: "32px" }} strong>0.2321 SAFE</Text>
        </Col>
      </Row>
      <Row >
        <Col span={24}>
          <Text strong>从</Text>
          <br />
          <Text style={{ marginLeft: "10px", fontSize: "18px" }}>锁仓账户 - {accountRecords.length}</Text>
          <br /><br />
          <div style={{maxHeight:"200px" , overflow:"scroll"}}>
            <Checkbox.Group
              options={options}
              value={optionIds}
            />
          </div>

        </Col>
      </Row>
      <br />
      <Row >
        <Col span={24}>
          <Text strong>到</Text>
          <br />
          <Text style={{ marginLeft: "10px", fontSize: "18px" }}>{supernodeInfo.addr}</Text>
        </Col>
      </Row>

    </Modal>
  </>

}
