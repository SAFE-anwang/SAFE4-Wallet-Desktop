import { Stock } from "@ant-design/charts";
import { Col, Divider, Flex, Radio, Row, Spin, Typography } from "antd"
import { useEffect, useMemo, useState } from "react";
import { DateTimeFormat } from "../../../utils/DateUtils";
import { ethers } from "ethers";
import { useBlockNumber, useSafeswapTokens } from "../../../state/application/hooks";
import { Safe4NetworkChainId, USDT, WSAFE } from "../../../config";
import ERC20TokenLogoComponent from "../../components/ERC20TokenLogoComponent";
import { parseTokenData } from "./Swap";
import { useWeb3React } from "@web3-react/core";
import TokenSymbol from "../../components/TokenSymbol";
import useSafeScan from "../../../hooks/useSafeScan";
import { fetchMarketStockKLines } from "../../../services/market";
import { useMarketTokenPrices } from "../../../state/audit/hooks";
import { TokenPriceVO } from "../../../services";
import { CheckboxGroupProps } from "antd/es/checkbox";
const { Text } = Typography;


// 定义一个极小的浮点数常量，用于微量振幅
const EPSILON_FLOAT = 0.001;
// BigNumber 精度常量
const EtherONE = ethers.utils.parseEther("1"); // 1 * 10^18
// 精度因子：10^18 * 10^18 = 10^36，用于精确倒数运算
const PRECISION_FACTOR = EtherONE.mul(EtherONE);
// KLine 数据结构接口（可选，用于增强类型安全）
interface KLineData {
  DateTime: string;
  Open: number;
  Close: number;
  High: number;
  Low: number;
}

const options: CheckboxGroupProps<string>['options'] = [
  { label: '30M', value: '30M' },
  { label: '4H', value: '4H' },
  { label: '1D', value: '1D' },
];

const fetchData = async (safescanUrl: string, token0: string, token1: string, interval: string) => {
  const response = await fetchMarketStockKLines(safescanUrl, { token0, token1, interval });
  let rawData = response;
  rawData = rawData.filter((d: any) => rawData.indexOf(d) > rawData.length - 120);
  // 当希望以 token1 计价时, 需要对 OHLC 价格进行倒置处理
  const isInverted = true;
  // 强制连续性处理,以上一个时间段的收盘价作为当前时间段的开盘价
  let previousClose: number | null = null;
  // 过滤掉零价格的原始数据
  const validRawData = rawData.filter((d: any) =>
    parseFloat(d.open) !== 0 && parseFloat(d.close) !== 0
  );
  const transformedData: KLineData[] = validRawData.map((d: any) => {
    console.log("Raw KLine Data =>", {
      时间: DateTimeFormat(d.timestamp * 1000, "yyyy-MM-dd HH:mm:ss"),
      开盘: d.open,
      收盘: d.close,
      最高: d.high,
      最低: d.low,
      成交量: d.volumes,
    });
    // 1. 初始 BigNumber 转换
    let openBN = ethers.utils.parseEther(d.open);
    let closeBN = ethers.utils.parseEther(d.close);
    let highBN = ethers.utils.parseEther(d.high);
    let lowBN = ethers.utils.parseEther(d.low);
    const volume = parseFloat(d.volumes); // Volumes 保持为 Number
    // ----------------------------------------------------
    // 2. 🚀 BigNumber 价格倒置 (修正了您的整数除法错误)
    // ----------------------------------------------------
    if (isInverted) {
      // 使用 PRECISION_FACTOR (10^36) 进行精确倒数运算
      const newOpenBN = PRECISION_FACTOR.div(openBN);
      const newCloseBN = PRECISION_FACTOR.div(closeBN);
      // High/Low 倒置 (原 Low 变为新 High)
      let newHighBN = PRECISION_FACTOR.div(lowBN);
      let newLowBN = PRECISION_FACTOR.div(highBN);
      // 修正 BigNumber 逻辑错误：确保 High >= Low
      if (newLowBN.gt(newHighBN)) {
        [newHighBN, newLowBN] = [newLowBN, newHighBN];
      }
      openBN = newOpenBN;
      closeBN = newCloseBN;
      highBN = newHighBN;
      lowBN = newLowBN;
    }
    // ----------------------------------------------------
    // 3. 转换为 Number 类型进行浮点数逻辑处理
    // ----------------------------------------------------
    let finalOpen = parseFloat(ethers.utils.formatEther(openBN));
    let finalClose = parseFloat(ethers.utils.formatEther(closeBN));
    let finalHigh = parseFloat(ethers.utils.formatEther(highBN));
    let finalLow = parseFloat(ethers.utils.formatEther(lowBN));
    // ----------------------------------------------------
    // 4. 强制 Open 连续 (修复了 previousClose 的类型问题)
    // ----------------------------------------------------
    if (previousClose !== null) {
      finalOpen = previousClose; // 强制 Open = 上一个 Close
      // 重新计算 High/Low 边界，以包含新的 Open
      finalHigh = Math.max(finalHigh, finalOpen);
      finalLow = Math.min(finalLow, finalOpen);
    }
    // ----------------------------------------------------
    // 5. 微量振幅处理 (当成交量为零且平盘时，显示横线)
    // ----------------------------------------------------
    if (volume === 0 && finalOpen === finalClose) {
      const price = finalOpen;
      // 计算 delta，确保 price * EPSILON_FLOAT 避免 0 乘 0
      const delta = price !== 0
        ? Math.abs(price) * EPSILON_FLOAT
        : EPSILON_FLOAT;
      // 调整 Open/Close，创建极细 K 线实体
      finalOpen = price - delta;
      finalClose = price + delta;
      // 确保 High/Low 边界包含新的 Open/Close
      finalHigh = Math.max(finalHigh, finalOpen);
      finalLow = Math.min(finalLow, finalClose);
    }
    // 6. 记录当前 Close 价格，供下一个周期使用
    previousClose = finalClose;
    // ----------------------------------------------------
    // 7. 最终数据结构
    // ----------------------------------------------------
    const transformed: KLineData = {
      Open: finalOpen,
      High: finalHigh,
      Low: finalLow,
      Close: finalClose,
      DateTime: DateTimeFormat(d.timestamp * 1000, "yyyy-MM-dd HH:mm:ss"),
    };
    return transformed;
  });
  return transformedData;
};

export default () => {

  const blockNumber = useBlockNumber();
  const { chainId } = useWeb3React();
  const [data, setData] = useState<any[]>([]);
  const safeswapTokens = useSafeswapTokens();
  const { URL, API } = useSafeScan();
  const tokenPrices = useMarketTokenPrices();
  const tokenPricesMap = tokenPrices?.reduce((map, tokenPrice) => {
    map[tokenPrice.address] = tokenPrice;
    return map;
  }, {} as { [address: string]: TokenPriceVO });
  const [interval, setInterval] = useState<string>("4H");
  const [stockLoading, setStockLoading] = useState<boolean>(false);

  const { token0, token1 } = useMemo(() => {
    if (safeswapTokens && chainId) {
      const { tokenA, tokenB } = safeswapTokens;
      if (tokenA || tokenB) {
        let token0 = tokenA ? parseTokenData(tokenA) : WSAFE[chainId as Safe4NetworkChainId];
        let token1 = tokenB ? parseTokenData(tokenB) : WSAFE[chainId as Safe4NetworkChainId];
        // 如果 Token1 是 USDT，则交换位置，确保 Token0 始终是 USDT
        if (token0?.address === USDT[chainId as Safe4NetworkChainId].address) {
          token0 = token1;
          token1 = USDT[chainId as Safe4NetworkChainId];
        }
        return {
          token0, token1
        }
      }
    }
    return {
      token0: undefined,
      token1: undefined
    }
  }, [safeswapTokens, chainId]);

  useEffect(() => {
    if (token0 && token1) {
      const fetchKLineData = async () => {
        setStockLoading(true);
        const transformedData = await fetchData(URL, token0.address, token1.address, interval);
        setData(transformedData);
        setStockLoading(false);
      }
      fetchKLineData();
    }
  }, [blockNumber, token0, token1, interval]);

  const StocKlines = () => {
    const config = {
      data: data,
      axis: {
        x: {
          labelAutoRotate: false,
        },
        y: {
          position: 'right',
          grid: true,
          gridLineWidth: 1,
          line: true,
          tick: true,
          label: true
        }
      },
      lineStyle: {
        stroke: 'black',
      },
      xField: 'DateTime',
      yField: ['Open', 'Close', 'Low', 'High'],
      colorField: (d: any) => {
        const trend = Math.sign(d.Close - d.Open);
        return trend > 0 ? " " : trend === 0 ? '' : '  ';
      },
      scale: {
        color: {
          domain: ['  ', '', ' '],
          range: ['#c11304ff', '#999999', '#21b80dff'],
        }
      },
      tooltip: {
        title: (d: any) => {
          return d.DateTime
        },
        items: [
          { field: 'Open', name: '开盘' },
          { field: 'High', name: '最高' },
          { field: 'Low', name: '最低' },
          { field: 'Close', name: '收盘' },
        ],
      },
    };
    return <Stock {...config} />;
  };

  const RenderStockTitle = () => {
    if (!token0 || !token1) {
      return <></>
    }
    let price = "";
    let change = "";
    let trend = 0
    if (token1.address === USDT[chainId as Safe4NetworkChainId].address) {
      const priceStr = tokenPricesMap && token0 && tokenPricesMap[token0.address]?.price;
      const changeStr = tokenPricesMap && token0 && tokenPricesMap[token0.address]?.change;
      if (priceStr) {
        price = parseFloat(priceStr).toFixed(4);
      }
      if (changeStr) {
        let changeValue = parseFloat(changeStr);
        trend = changeValue == 0 ? 0 : changeValue > 0 ? 1 : -1;
        change = (parseFloat(changeStr) * 100).toFixed(2) + "%";
      }
    }
    return <>
      <Row>
        <Col span={12}>
          <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px" }} address={token0.address} chainId={token1.chainId} />
          <ERC20TokenLogoComponent style={{ width: "36px", height: "36px", padding: "4px", marginLeft: "-10px" }} address={token1.address} chainId={token1.chainId} />
          <Text strong>
            {token0 && TokenSymbol(token0)} / {token1 && TokenSymbol(token1)}
          </Text>
          <Divider type="vertical" />
          <Text type={trend > 0 ? "success" : trend < 0 ? "danger" : "secondary"} strong>
            {price}
          </Text>
          <Text type={trend > 0 ? "success" : trend < 0 ? "danger" : "secondary"}>
            ({trend == 1 && "+"}{change})
          </Text>
        </Col>
        <Col span={12}>
          <Flex style={{ width: "30%", float: "right", marginRight: "12%", marginTop: "10px" }} vertical>
            <Radio.Group
              block
              options={options}
              optionType="button"
              buttonStyle="solid"
              size="small"
              value={interval}
              onChange={(value) => {
                setInterval(value.target.value)
              }}
            />
          </Flex>
        </Col>
      </Row>
    </>
  }

  return <>
    <div>
      {RenderStockTitle()}
    </div>
    <div>
      {data && StocKlines()}
    </div>
  </>


}
