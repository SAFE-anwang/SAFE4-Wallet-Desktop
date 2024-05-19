import { JsonRpcProvider } from "@ethersproject/providers";
import { Alert, Badge, Button, Col, Divider, Input, Modal, Row, Typography, } from "antd"
import { useCallback, useEffect, useMemo, useState } from "react";
import { RpcConfigSignal, RpcConfig_Methods } from "../../../../../main/handlers/RpcConfigSignalHandler";
import { IPC_CHANNEL } from "../../../../config";
import { isSafe4Mainnet, isSafe4Network, isSafe4Testnet } from "../../../../utils/Safe4Network";

const { Text } = Typography;

export default ({
    openAddModal, cancel
}: {
    openAddModal: boolean,
    cancel: () => void
}) => {

    const [inputRpc, setInputRpc] = useState<string>();
    const [chainId, setChainId] = useState<number | undefined>();
    const [name, setName] = useState<string>();
    const [activeStatus, setActiveStatus] = useState<{
        isActive: boolean,
        isActiving: boolean
    } | undefined>();

    useEffect(() => {
        if (inputRpc) {
            const provider = new JsonRpcProvider(inputRpc);
            setActiveStatus({
                isActive: false,
                isActiving: true
            })
            provider.getNetwork().then((data) => {
                const { chainId, name } = data;
                setChainId(chainId);
                setName(name);
                setActiveStatus({
                    isActive: true,
                    isActiving: false
                })

            }).catch((err: any) => {
                setActiveStatus({
                    isActive: false,
                    isActiving: false
                })
            })
        } else {
            setActiveStatus({
                isActive: false,
                isActiving: false
            })
        }
    }, [inputRpc]);

    const renderActiveStatus = () => {
        if (!activeStatus || activeStatus.isActiving) {
            return <>
                <Badge status="warning"></Badge>
                <Text style={{ marginLeft: "5px" }}>正在连接</Text>
            </>
        }
        if (activeStatus.isActive) {
            return <>
                <Badge status="processing"></Badge>
                <Text style={{ marginLeft: "5px" }}>{renderNetwork()}</Text>
            </>
        }
        return <>
            <Badge status="error"></Badge>
            <Text style={{ marginLeft: "5px" }}>网络异常</Text>
        </>
    }

    const renderNetwork = () => {
        if (chainId) {
            if (isSafe4Network(chainId)) {
                if (isSafe4Testnet(chainId)) {
                    return <Text type="success">测试网</Text>
                }
                if (isSafe4Mainnet(chainId)) {
                    return <Text>主网</Text>
                }
            } else {
                return <Text type="secondary">[{name}]</Text>
            }
        }
    }

    const isValidRpc = useMemo(() => {
        if (inputRpc && activeStatus?.isActive && chainId && isSafe4Network(chainId)) {
            return true;
        }
        return false;
    }, [inputRpc, activeStatus, chainId]);

    // const [addRpcConfig ,setAddRpcConfig] = useState<{
    //     chainId : number , 
    //     endpoint : string
    //   }>();
    //   useEffect( () => {
    //     if ( addRpcConfig ){

    //     }
    //   } , [ addRpcConfig ] );

    const onSaveClick = useCallback(() => {
        if (inputRpc) {
            const method = RpcConfig_Methods.saveOrUpdate;
            window.electron.ipcRenderer.sendMessage(IPC_CHANNEL,
                [RpcConfigSignal, method, [{
                    chainId: chainId,
                    endpoint: inputRpc,
                    active: 0
                }]
                ]);
        }
    }, [inputRpc, chainId])

    return <>
        <Modal footer={null} destroyOnClose title="添加 RPC" style={{ height: "300px" }} open={openAddModal} onCancel={() => {
            setInputRpc(undefined);
            cancel();
        }}>
            <Divider />
            <Row>
                <Col span={24}>
                    <Text type="secondary">RPC Endpoint</Text>
                </Col>
                <Col span={24}>
                    <Input onBlur={(event) => {
                        setInputRpc(event.target.value.trim())
                    }} />
                </Col>
                {
                    inputRpc && <Col span={24} style={{ marginTop: "20px" }}>
                        {renderActiveStatus()}
                    </Col>
                }
                {
                    inputRpc && !isValidRpc && activeStatus?.isActive && <Col span={24} style={{ marginTop: "20px" }}>
                        <Alert type="error" showIcon message={<>
                            只能添加 SAFE 链的 RPC Endpoint
                        </>} />
                    </Col>
                }
            </Row>
            <Divider />
            <Row>
                <Col span={24} style={{ textAlign: "right" }}>
                    <Button onClick={() => {
                        onSaveClick();
                    }} loading={activeStatus?.isActiving}>保存</Button>
                </Col>
            </Row>
        </Modal>
    </>


}