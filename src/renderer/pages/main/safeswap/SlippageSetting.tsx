import { Alert, Button, Col, Input, Row, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSafeswapSlippageTolerance } from "../../../state/application/hooks";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapSlippageTolerance } from "../../../state/application/action";
import { ethers } from "ethers";


const { Text } = Typography;

export default () => {

  const dispatch = useDispatch();
  const slippageTolerance = useSafeswapSlippageTolerance();
  const default_slippage_options = ["0.1", "0.5", "1"] // 0.1% , 0.5% , 1%
  const [inputValue, setInputValue] = useState<string>();
  const [inputError, setInputError] = useState<string>();

  const Slippage = Number(slippageTolerance) * 100;

  const RenderTip = () => {
    const _slippageTolerance = Number(slippageTolerance) * 100; // %
    if (Slippage < Number(default_slippage_options[1])) {
      // 滑点容差小于 0.5%
      return <Col span={24} style={{ marginTop: "5px" }}>
        <Alert showIcon type="warning" message={<>
          交易失败概率大
        </>} />
      </Col>
    } else if (Slippage > 5) {
      // 滑点容差大于 5%
      return <Col span={24} style={{ marginTop: "5px" }}>
        <Alert showIcon type="warning" message={<>
          滑点容差越大,可能会被前置交易套利
        </>} />
      </Col>
    }
  }

  return <>
    <Row>
      <Col span={24}>
        <Text type="secondary">滑点容差</Text>
      </Col>
      <Col span={24}>
        <Space style={{ float: "left" }}>
          {
            default_slippage_options.map(opt => {
              return <Button type={opt == (Slippage + "") ? "primary" : "default"} key={opt} size="small" style={{ width: "50px" }}
                onClick={() => {
                  setInputError(undefined);
                  setInputValue(opt + "");
                  const _first = ethers.utils.parseUnits(opt).div(100);
                  const _second = ethers.utils.formatUnits(_first);
                  dispatch(applicationUpdateSafeswapSlippageTolerance(_second));
                }}>
                {opt} %
              </Button>
            })
          }
        </Space>
        <Input defaultValue={Slippage} value={inputValue} onChange={(event) => {
          const input = event.target.value;
          const isNumber = input && input.indexOf("0x") != 0 && Number(input);
          setInputValue(input)
          if (isNumber) {
            const decimalPart = input.split(".")[1];
            if (Number(input) >= 50) {
              setInputError("输入合法的容差范围");
            } else if (decimalPart && decimalPart.length > 2) {
              setInputError("输入合法的容差范围");
            } else {
              setInputError(undefined);
              const _first = ethers.utils.parseUnits(input).div(100);
              const _second = ethers.utils.formatUnits(_first);
              dispatch(applicationUpdateSafeswapSlippageTolerance(_second));
            }
          } else {
            if (input) {
              setInputError("输入合法的容差范围")
            }
          }
        }} size="small" addonAfter="%" style={{ float: "right", width: "80px" }} />
      </Col>
      {
        !inputError && RenderTip()
      }
      {
        inputError && <Row style={{ marginTop: "5px" }}>
          <Col span={24}>
            <Alert style={{ width: "100%" }} showIcon type="error" message={inputError} />
          </Col>
        </Row>
      }
    </Row >
  </>

};
