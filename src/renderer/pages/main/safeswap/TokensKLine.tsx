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


// BigNumber 精度常量
const EtherONE = ethers.utils.parseEther("1"); // 1 * 10^18
// 精度因子：10^18 * 10^18 = 10^36，用于精确倒数运算
const PRECISION_FACTOR = EtherONE.mul(EtherONE);
const options: CheckboxGroupProps<string>['options'] = [
  { label: '30M', value: '30M' },
  { label: '4H', value: '4H' },
  { label: '1D', value: '1D' },
];

const fetchData = async (
  safescanUrl: string,
  token0: string,
  token1: string,
  interval: string,
  isInverted: boolean = true // 默认为以 token1 计价的倒置模式
) => {
  // 1. 获取原始数据并进行初步清洗
  let response = await fetchMarketStockKLines(safescanUrl, { token0, token1, interval });
  if (!response || !Array.isArray(response)) return [];
  const MAX_KLINES = 140;
  // 过滤掉开盘/收盘为 0 的异常原始数据
  const validRawData = response
    .filter((d: any) => parseFloat(d.open) > 0 && parseFloat(d.close) > 0)
    .slice(-MAX_KLINES);
  if (validRawData.length === 0) return [];

  // 2. 第一遍循环：数值转换、处理倒置逻辑并统计全局极值
  let globalHigh = 0;
  let globalLow = Number.MAX_SAFE_INTEGER;
  const baseData = validRawData.map((d: any) => {
    // 转换为 BigNumber 进行高精度计算
    let openBN = ethers.utils.parseUnits(d.open, 18);
    let closeBN = ethers.utils.parseUnits(d.close, 18);
    let highBN = ethers.utils.parseUnits(d.high, 18);
    let lowBN = ethers.utils.parseUnits(d.low, 18);
    if (isInverted) {
      // 执行 1/P 计算
      const newOpen = PRECISION_FACTOR.div(openBN);
      const newClose = PRECISION_FACTOR.div(closeBN);
      let newHigh = PRECISION_FACTOR.div(lowBN); // 原 Low 变为新 High
      let newLow = PRECISION_FACTOR.div(highBN); // 原 High 变为新 Low
      // 修正 BigNumber 比较逻辑，确保 High >= Low
      if (newLow.gt(newHigh)) [newHigh, newLow] = [newLow, newHigh];
      openBN = newOpen;
      closeBN = newClose;
      highBN = newHigh;
      lowBN = newLow;
    }
    // 转换回浮点数供后续逻辑使用
    const o = parseFloat(ethers.utils.formatEther(openBN));
    const c = parseFloat(ethers.utils.formatEther(closeBN));
    const h = parseFloat(ethers.utils.formatEther(highBN));
    const l = parseFloat(ethers.utils.formatEther(lowBN));

    // 更新全局统计量，用于感知整段数据的波动性
    if (h > globalHigh) globalHigh = h;
    if (l < globalLow) globalLow = l;
    return {
      o, c, h, l,
      volume: parseFloat(d.volumes || 0),
      timestamp: d.timestamp
    };
  });

  // 3. 计算全局感知偏差 (dynamicEpsilon)
  // 如果 140 条数据中有波动 (priceRange > 0)，则设置极差的 0.1% 作为平盘微调值
  // 如果全局完全无波动 (priceRange === 0)，则 epsilon 为 0，保持纯直线
  const priceRange = globalHigh - globalLow;
  const dynamicEpsilon = priceRange > 0 ? priceRange * 0.002 : 0;

  // 4. 第二遍循环：强制连续性、应用微量振幅及格式化输出
  let previousClose: number | null = null;
  const transformedData: any[] = baseData.map((d) => {
    let finalOpen = d.o;
    let finalClose = d.c;
    let finalHigh = d.h;
    let finalLow = d.l;

    // A. 强制连续性逻辑：开盘价等于上一周期收盘价
    if (previousClose !== null) {
      finalOpen = previousClose;
    }
    // B. 微量振幅处理：
    // 当该根 K 线无交易量或平盘，且全局环境存在波动时，增加视觉厚度
    if (dynamicEpsilon > 0 && (d.volume === 0 || Math.abs(finalOpen - finalClose) < dynamicEpsilon)) {
      finalOpen -= dynamicEpsilon;
      finalClose += dynamicEpsilon;
    }
    // 修正边界：确保最高价/最低价始终包含调整后的实体
    finalHigh = Math.max(finalHigh, finalOpen, finalClose);
    finalLow = Math.min(finalLow, finalOpen, finalClose);
    // 记录收盘价供下一周期连续性计算
    previousClose = finalClose;
    // C. 智能精度算法：根据价格数量级动态控制小数位
    let precision = 4;
    if (finalClose < 0.0001) precision = 12;
    else if (finalClose < 1) precision = 8;
    return {
      Open: parseFloat(finalOpen.toFixed(precision)),
      High: parseFloat(finalHigh.toFixed(precision)),
      Low: parseFloat(finalLow.toFixed(precision)),
      Close: parseFloat(finalClose.toFixed(precision)),
      DateTime: DateTimeFormat(d.timestamp * 1000, "yyyy-MM-dd HH:mm:ss"),
    };
  });
  // 5. 留白逻辑：根据当前数据量动态计算右侧填充
  // 数据越多留白越少，保持图表比例和谐
  const PADDING_COUNT = transformedData.length >= 120 ? 12 : 80 - transformedData.length;
  const intervalSeconds = getIntervalSeconds(interval);
  if (transformedData.length > 0) {
    const lastTs = baseData[baseData.length - 1].timestamp;
    for (let i = 1; i <= PADDING_COUNT; i++) {
      const futureTimestamp = (lastTs + intervalSeconds * i) * 1000;
      transformedData.push({
        DateTime: DateTimeFormat(futureTimestamp, "yyyy-MM-dd HH:mm:ss"),
        // 设置为 undefined 确保图表库不渲染这些点的实体，仅占据 X 轴位置
        Open: undefined,
        High: undefined,
        Low: undefined,
        Close: undefined,
      });
    }
  }
  return transformedData;
};

const getIntervalSeconds = (interval: string): number => {
  const normalized = (interval || "30M").toUpperCase();
  const map: {
    [interval: string]: number
  } = {
    "30M": 30 * 60,          // 1,800s
    "4H": 4 * 60 * 60,       // 14,400s
    "1D": 24 * 60 * 60,      // 86,400s
  }
  // 如果找不到匹配项，默认返回 30M 的秒数
  return map[normalized] || 1800;
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
  const [lastPrice,setLastPrice] = useState<string | undefined>(undefined);

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
        const transformedData = await fetchData(URL, token0.address, token1.address, interval);
        if (transformedData) {
          setData(transformedData)
        }
      }
      fetchKLineData();
    }
  }, [blockNumber, token0, token1, interval]);

  const StocKlines = () => {
    const lastValidItem = [...data].filter(d => d.Close !== undefined && d.Close !== null).pop();
    const lastPrice = lastValidItem ? lastValidItem.Close : 0;

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
          labelFormatter: (val: any) => {
            const price = parseFloat(val);
            // 计算当前刻度与最新价的距离
            // 如果差值小于最新价的 0.1%（或者一个固定阈值），则隐藏该刻度
            const diff = Math.abs(price - lastPrice);
            const threshold = lastPrice * 0.10; // 0.5% 的间距，可以根据效果调整
            if (diff < threshold) {
              return ""; // 距离太近，返回空字符串，隐藏该刻度标签
            }
            return val; // 正常显示
          }
        }
      },
      lineStyle: {
        stroke: 'black',
      },

      // 最终收盘价价格辅助虚线
      annotations: [
        {
          type: 'lineY',              // 绘制水平线
          data: lastPrice && [lastPrice],          // 所在的 Y 轴数值
          style: {
            stroke: '#0234b0ff',    // 虚线颜色
            lineDash: [4, 4],         // 虚线样式 [实线长度, 间隙长度]
            lineWidth: 1,
            zIndex: 100,               // 确保在 K 线图层之上
          },
          label: {
            text: lastPrice,
            position: 'right',
            dx: 40,
            style: {
              fill: '#0234b0ff',
              padding: [0, 0],
              fontSize: 10,
              fontWeight: 'bold',
              // overflow: 'visible',
            },
          },
        },
      ],
      xField: 'DateTime',
      yField: ['Open', 'Close', 'Low', 'High'],
      colorField: (d: any) => {
        const trend = Math.sign(d.Close - d.Open);
        return trend > 0 ? " " : trend === 0 ? '' : '  ';
      },
      scale: {
        color: {
          domain: ['  ', '', ' '],
          range: ['#d71706ff', '#999999', '#22ca0cff'],
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
            {price && <> ({trend == 1 && "+"}{change})</>}
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
