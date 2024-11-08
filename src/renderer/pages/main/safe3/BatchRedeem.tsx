import { useCallback, useEffect, useRef, useState } from "react"
import { Button, Card, Col, Divider, Flex, Modal, Progress, Row, Space, Statistic, Steps, Table, TableProps, Tag, Typography } from "antd";

import "@xterm/xterm/css/xterm.css";
import BatchRedeemStep2, { Safe3QueryResult, Safe3RedeemStatistic } from "./BatchRedeemStep2";
import BatchRedeemStep3 from "./BatchRedeemStep3";
import BatchRedeemStep1, { AddressPrivateKeyMap } from "./BatchRedeemStep1";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography

export default () => {

  const { t } = useTranslation();
  const steps = [
    {
      title: t("wallet_redeems_batch_step1"),
    },
    {
      title: t("wallet_redeems_batch_step2"),
    },
    {
      title: t("wallet_redeems_batch_step3"),
    },
  ];
  const items = steps.map((item) => ({ key: item.title, title: item.title }));
  const [current, setCurrent] = useState(0);

  const [addressPrivateKeyMap, setAddressPrivateKeyMap] = useState<AddressPrivateKeyMap>();
  const [safe3AddressArr, setSafe3AddressArr] = useState<string[]>();

  const [safe3RedeemList, setSafe3RedeemList] = useState<Safe3QueryResult[]>();
  const [safe3RedeemStatistic, setSafe3RedeemStatistic] = useState<Safe3RedeemStatistic>();

  useEffect(() => {
    if (addressPrivateKeyMap && Object.keys(addressPrivateKeyMap).length > 0) {
      setSafe3AddressArr(Object.keys(addressPrivateKeyMap));
      setCurrent(1);
    }
  }, [addressPrivateKeyMap]);

  useEffect(() => {
    if (safe3RedeemList && safe3RedeemStatistic) {
      setCurrent(2);
    }
  }, [safe3RedeemList, safe3RedeemStatistic]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          {t("safe3AssetRedeem")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card>
          <Steps style={{ marginTop: "20px" }} current={current} items={items} />
          {
            current == 0 && <BatchRedeemStep1 setAddressPrivateKeyMap={setAddressPrivateKeyMap} />
          }
          {
            current == 1 && safe3AddressArr && <BatchRedeemStep2
              safe3AddressArr={safe3AddressArr} setSafe3RedeemList={setSafe3RedeemList} setSafe3RedeemStatistic={setSafe3RedeemStatistic} />
          }
          {
            current == 2 && safe3RedeemList && safe3RedeemStatistic && addressPrivateKeyMap && <BatchRedeemStep3
              addressPrivateKeyMap={addressPrivateKeyMap} safe3RedeemList={safe3RedeemList} safe3RedeemStatistic={safe3RedeemStatistic} />
          }
        </Card>
      </div>
    </div>

  </>

}

