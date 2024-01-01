import { Button, Col, Divider, Input, Modal, Row, Typography, Space } from "antd"
import { Children, useEffect, useMemo, useState } from "react";
import { useETHBalances, useWalletsActiveAccount, useWalletsActiveSigner } from "../../../state/wallets/hooks"
import { MemoryRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useBlockNumber } from "../../../state/application/hooks";
import { ethers } from "ethers";

const { Text } = Typography;

export default ({ 
    finishCallback
}: {
    finishCallback: (inputParams: {
        to: string,
        amount: string
    }) => void
}) => {

    const activeAccount = useWalletsActiveAccount();
    const activeAccountETHBalance = useETHBalances([activeAccount])[activeAccount];

    const [params , setParams] = useState<{
        to : string  , 
        amount : string 
    }>({
        to : "",
        amount : ""
    });

    return <>
        <div style={{ minHeight: "300px" }}>
            <Row >
                <Col span={24}>
                    <Text strong>从</Text>
                    <br />
                    <Text style={{ marginLeft: "10px", fontSize: "18px" }}>{activeAccount}</Text>
                </Col>
            </Row>
            <br />
            <Row >
                <Col span={24}>
                    <Text strong>到</Text>
                    <br />
                    <Input size="large" onChange={(_input) => {
                        const toInputValue = _input.target.value;
                        setParams({
                            ...params,
                            to: toInputValue
                        })
                    }} placeholder="输入到账地址"></Input>
                </Col>
            </Row>
            <br />
            <Row >
                <Col span={14}>
                    <Text strong>数量</Text>
                    <br />
                    <Space.Compact style={{ width: '100%' }}>
                        <Input size="large" onChange={(_input) => {
                            const toInputValue = _input.target.value;
                            setParams({
                                ...params,
                                amount: toInputValue
                            })
                        }} placeholder="输入数量" />
                        <Button size="large">最大</Button>
                    </Space.Compact>
                </Col>
                <Col span={10}>
                    <Text style={{ float: "right" }} strong>可用数量</Text>
                    <br />
                    <Text style={{ float: "right", fontSize: "18px", lineHeight: "36px" }}>
                        {activeAccountETHBalance?.toFixed(6)}
                    </Text>
                </Col>
            </Row>
            <br />
            <Divider dashed orientation="center">
                <Button type="dashed" style={{ margin: "auto" }}>展开高级</Button>
            </Divider>
            <br />
            <Row style={{ width: "100%", textAlign: "right" }}>
                <Col span={24}>
                    <Button type="primary" style={{ float: "right" }} onClick={() => {
                        finishCallback( params  )
                    }}>下一步</Button>
                </Col>
            </Row>
        </div>
    </>

}