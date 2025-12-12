import { Stock } from "@ant-design/charts";
import { Card } from "antd"
import { useEffect, useState } from "react";
import { DateTimeFormat } from "../../../utils/DateUtils";
import { ethers } from "ethers";
import { useBlockNumber } from "../../../state/application/hooks";

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

export default () => {
  const blockNumber = useBlockNumber();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const token0 = "0x0000000000000000000000000000000000001101";
      const token1 = "0x5a9187804ae46c9809696a9c64c7d3d42307fef3";
      const url = `https://safe4testnet.anwang.com/list/market/klines?token0=${token0}&token1=${token1}&interval=30M`;
      console.log("Get KLine Data URL =>", url);
      const response = await fetch(url);
      let rawData = await response.json();

      rawData = rawData.filter((d: any) => rawData.indexOf(d) > rawData.length - 120)

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

      setData(transformedData);
    };
    fetchData();
  }, [blockNumber]);

  const DemoStock = () => {
    const config = {
      data: data,
      axis: {
        x: {
          labelAutoRotate: false,
          // transform: [
          //   {
          //     type: 'hide',
          //     keepHeader: true,
          //     keepTail: true,
          //   },
          // ],
        },
        y: {
          position: 'right', // 设置坐标轴的位置
          // 这部分是轴标题的配置
          grid: true, // 是否显示网格线
          gridLineWidth: 1, // 网格线宽度
          // 这部分是轴线的配置
          line: true, // 是否显示轴线
          // 这部分是轴刻度的配置
          tick: true, // 是否显示刻度
          // 这部分是轴标签的配置
          label: true, // 是否显示刻度值

        }
      },
      lineStyle: {
        stroke: 'black',
      },
      xField: 'DateTime',
      yField: ['Open', 'Close', 'Low', 'High'],
      colorField: (d: any) => {
        const trend = Math.sign(d.Close - d.Open);
        return trend > 0 ? '上涨' : trend === 0 ? '' : '下跌';
      },
      scale: {
        color: {
          domain: ['下跌', '', '上涨'],
          range: ['#e11705ff', '#999999', '#238616ff'],
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


  return <>
    <Card style={{ width: "100%" }}>
      {data && DemoStock()}
    </Card>
  </>


}
