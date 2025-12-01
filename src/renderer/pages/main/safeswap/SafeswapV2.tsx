import { Alert, Avatar, Button, Card, Col, Divider, Dropdown, Flex, Input, InputNumber, MenuProps, message, Popover, Row, Select, Space, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

import Swap from "./Swap";
import AssetPool, { AssetPoolModule } from "./AssetPool";
import { SettingFilled, SettingOutlined } from "@ant-design/icons";
import SlippageSetting from "./SlippageSetting";
import { useSafeswapV2Pairs } from "./hooks";
import { useTranslation } from "react-i18next";
import { useSafeswapAction, useSafeswapTokens } from "../../../state/application/hooks";
import { Stock } from '@ant-design/plots';

const { Title, Text, Link } = Typography;

const enum ActiveModule {
  Swap = "Swap",
  AssetsPool = "AssetsPool"
}

const data = [
  {
    time: '2015-11-19',
    start: 8.18,
    max: 8.33,
    min: 7.98,
    end: 8.32,
    volumn: 1810,
    money: 14723.56,
  },
  {
    time: '2015-11-18',
    start: 8.37,
    max: 8.6,
    min: 8.03,
    end: 8.09,
    volumn: 2790.37,
    money: 23309.19,
  },
  {
    time: '2015-11-17',
    start: 8.7,
    max: 8.78,
    min: 8.32,
    end: 8.37,
    volumn: 3729.04,
    money: 31709.71,
  },
  {
    time: '2015-11-16',
    start: 8.18,
    max: 8.69,
    min: 8.05,
    end: 8.62,
    volumn: 3095.44,
    money: 26100.69,
  },
  {
    time: '2015-11-13',
    start: 8.01,
    max: 8.75,
    min: 7.97,
    end: 8.41,
    volumn: 5815.58,
    money: 48562.37,
  },
  {
    time: '2015-11-12',
    start: 7.76,
    max: 8.18,
    min: 7.61,
    end: 8.15,
    volumn: 4742.6,
    money: 37565.36,
  },
  {
    time: '2015-11-11',
    start: 7.55,
    max: 7.81,
    min: 7.49,
    end: 7.8,
    volumn: 3133.82,
    money: 24065.42,
  },
  {
    time: '2015-11-10',
    start: 7.5,
    max: 7.68,
    min: 7.44,
    end: 7.57,
    volumn: 2670.35,
    money: 20210.58,
  },
  {
    time: '2015-11-09',
    start: 7.65,
    max: 7.66,
    min: 7.3,
    end: 7.58,
    volumn: 2841.79,
    money: 21344.36,
  },
  {
    time: '2015-11-06',
    start: 7.52,
    max: 7.71,
    min: 7.48,
    end: 7.64,
    volumn: 2725.44,
    money: 20721.51,
  },
  {
    time: '2015-11-05',
    start: 7.48,
    max: 7.57,
    min: 7.29,
    end: 7.48,
    volumn: 3520.85,
    money: 26140.83,
  },
  {
    time: '2015-11-04',
    start: 7.01,
    max: 7.5,
    min: 7.01,
    end: 7.46,
    volumn: 3591.47,
    money: 26285.52,
  },
  {
    time: '2015-11-03',
    start: 7.1,
    max: 7.17,
    min: 6.82,
    end: 7,
    volumn: 2029.21,
    money: 14202.33,
  },
  {
    time: '2015-11-02',
    start: 7.09,
    max: 7.44,
    min: 6.93,
    end: 7.17,
    volumn: 3191.31,
    money: 23205.11,
  },
  {
    time: '2015-10-30',
    start: 6.98,
    max: 7.27,
    min: 6.84,
    end: 7.18,
    volumn: 3522.61,
    money: 25083.44,
  },
  {
    time: '2015-10-29',
    start: 6.94,
    max: 7.2,
    min: 6.8,
    end: 7.05,
    volumn: 2752.27,
    money: 19328.44,
  },
  {
    time: '2015-10-28',
    start: 7.01,
    max: 7.14,
    min: 6.8,
    end: 6.85,
    volumn: 2311.11,
    money: 16137.32,
  },
  {
    time: '2015-10-27',
    start: 6.91,
    max: 7.31,
    min: 6.48,
    end: 7.18,
    volumn: 3172.9,
    money: 21827.3,
  },
  {
    time: '2015-10-26',
    start: 6.9,
    max: 7.08,
    min: 6.87,
    end: 6.95,
    volumn: 2769.31,
    money: 19337.44,
  },
  {
    time: '2015-10-23',
    start: 6.71,
    max: 6.85,
    min: 6.58,
    end: 6.79,
    volumn: 2483.18,
    money: 16714.31,
  },
  {
    time: '2015-10-22',
    start: 6.38,
    max: 6.67,
    min: 6.34,
    end: 6.65,
    volumn: 2225.88,
    money: 14465.56,
  },
];

const DemoStock = () => {
  const color = (d : any) => {
    const trend = Math.sign(d.start - d.end);
    return trend > 0 ? '#4daf4a' : trend === 0 ? '#999999' : '#e41a1c';
  };
  const config = {
    data: data.reverse(),
    xField: 'time',
    yField: ['start', 'end', 'min', 'max'],
    style: {
      fill: color,
    },
    lineStyle: {
      stroke: color,
    },
    tooltip: {
      title: 'time',
      items: [
        { field: 'start', name: '开盘价' },
        { field: 'end', name: '收盘价' },
        { field: 'min', name: '最低价' },
        { field: 'max', name: '最高价' },
      ],
    },
  };

  return <Stock {...config} />;
};

const DemoStock2 = () => {
  const config = {
    data: {
      type: 'fetch',
      value: 'https://assets.antv.antgroup.com/g2/aapl2.json',
      transform: [
        {
          type: 'map',
          callback: (d:any) => ({
            ...d,
            date: new Date(d.Date).toLocaleDateString(),
          }),
        },
      ],
    },
    axis: {
      x: {
        labelAutoRotate: false,
        transform: [
          {
            type: 'hide',
            keepHeader: true,
            keepTail: true,
          },
        ],
      },
    },
    xField: 'date',
    yField: ['Open', 'Close', 'Low', 'High'],
    colorField: (d:any) => {
      // return '#4daf4a'
      const trend = Math.sign(d.Close - d.Open);
      return trend > 0 ? '上涨' : trend === 0 ? '不变' : '下跌';
    },
    lineStyle: {
      stroke: 'black',
    },
    scale: {
      color: {
        domain: ['下跌', '不变', '上涨'],
        range: ['#4daf4a', '#999999', '#e41a1c'],
      },
    },
    tooltip: {
      title: (d:any) => d.Date,
      items: [
        { field: 'Open', name: 'open' },
        { field: 'Close', name: 'close' },
        { field: 'Low', name: 'low' },
        { field: 'High', name: 'high' },
      ],
    },
  };

  return <Stock {...config} />;
};

export default () => {

  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState<ActiveModule>(ActiveModule.Swap);
  const [_assetPoolModule, set_AssetPoolModule] = useState<AssetPoolModule>();
  const goToAddLiquidity = () => {
    set_AssetPoolModule(AssetPoolModule.Add);
    setActiveModule(ActiveModule.AssetsPool);
  }
  const safeswapV2Pairs = useSafeswapV2Pairs();

  console.log("SafeswapV2Pairs =>", safeswapV2Pairs)

  const safeswapAction = useSafeswapAction();

  useEffect(() => {
    if (safeswapAction) {
      if ("AddLiquidity" == safeswapAction) {
        goToAddLiquidity();
      }
    }
  }, [safeswapAction]);

  return <>
    <Row style={{ height: "50px" }}>
      <Col span={8}>
        <Title level={4} style={{ lineHeight: "16px", float: "left" }}>
          {t("wallet_safeswap")}
        </Title>
      </Col>
    </Row>
    <div style={{ width: "100%", paddingTop: "40px" }}>
      <div style={{ margin: "auto", width: "90%" }}>
        <Card style={{ marginBottom: "20px" }}>
          <Row style={{ marginBottom: "20px" }}>
            <div style={{ width: "50%", margin: "auto" }}>
              <Alert style={{ margin: "auto" }} type="info" message={<>
                {t("wallet_safeswap_swap_tip0")}
              </>}></Alert>
            </div>
          </Row>
          <Divider />
          <Card style={{ width: "50%", margin: "auto" }}>
            <Row style={{ marginBottom: "20px" }}>
              <Col span={12} style={{ textAlign: "center" }}>
                <Button onClick={() => setActiveModule(ActiveModule.Swap)}
                  style={{ fontSize: "28px", height: "60px", color: activeModule == ActiveModule.Swap ? "black" : "#b9a4a4" }} type="text">
                  {t("wallet_safeswap_swap")}
                </Button>
              </Col>
              <Col span={12} style={{ textAlign: "center" }}>
                <Button onClick={() => setActiveModule(ActiveModule.AssetsPool)}
                  style={{ fontSize: "28px", height: "60px", color: activeModule == ActiveModule.AssetsPool ? "black" : "#b9a4a4" }} type="text">
                  {t("wallet_safeswap_liquiditypool")}
                </Button>
                <Popover placement="rightTop" content={<>
                  <div style={{ width: "300px" }}>
                    <SlippageSetting />
                  </div>
                </>} title={t("wallet_safeswap_settings")} trigger="click">
                  <SettingOutlined style={{ float: "right" }} />
                </Popover>
              </Col>
            </Row>
            {
              activeModule == ActiveModule.Swap && <Swap safeswapV2Pairs={safeswapV2Pairs} goToAddLiquidity={goToAddLiquidity} />
            }
            {
              activeModule == ActiveModule.AssetsPool && <AssetPool
                safeswapV2Pairs={safeswapV2Pairs}
                _assetPoolModule={_assetPoolModule} />
            }
          </Card>
        </Card>

        <Card>

          {DemoStock2()}

        </Card>
      </div>
    </div>
  </>
}
