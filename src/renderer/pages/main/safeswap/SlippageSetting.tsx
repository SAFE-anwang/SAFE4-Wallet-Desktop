import { Alert, Button, Col, Input, Row, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useSafeswapSlippageTolerance } from "../../../state/application/hooks";
import { useDispatch } from "react-redux";
import { applicationUpdateSafeswapSlippageTolerance } from "../../../state/application/action";


const { Text } = Typography;

export default () => {

  const dispatch = useDispatch();
  const slippageTolerance = useSafeswapSlippageTolerance();
  const default_slippage_options = [0.1, 0.5, 1] // 0.1% , 0.5% , 1%
  const [inputValue, setInputValue] = useState<string>();
  const [inputError, setInputError] = useState<string>();

  const RenderTip = () => {
    const _slippageTolerance = slippageTolerance * 100; // %
    if (_slippageTolerance < default_slippage_options[1]) {
      // 滑点容差小于 0.5%
      return <Col span={24} style={{ marginTop: "5px" }}>
        <Alert showIcon type="warning" message={<>
          交易失败概率大
        </>} />
      </Col>
    } else if (_slippageTolerance > 5) {
      // 滑点容差小于 0.5%
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
              return <Button type={opt == slippageTolerance * 100 ? "primary" : "default"} key={opt} size="small" style={{ width: "50px" }}
                onClick={() => {
                  setInputError(undefined);
                  setInputValue(opt + "");
                  dispatch(applicationUpdateSafeswapSlippageTolerance(opt / 100));
                }}>
                {opt} %
              </Button>
            })
          }
        </Space>
        <Input defaultValue={slippageTolerance * 100} value={inputValue} onChange={(event) => {
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
              dispatch(applicationUpdateSafeswapSlippageTolerance(Number(input) / 100));
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
