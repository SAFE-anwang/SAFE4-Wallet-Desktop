import { Alert, Spin, Switch, Button, Steps } from "antd"
import { LeftOutlined, LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNewMnemonic } from "../../state/application/hooks";
import { IPC_CHANNEL } from "../../config";
import { WalletSignal } from "../../../main/handlers/WalletSignalHandler";

export default () => {

    const navigate = useNavigate();
    const goBackClick = () => {
        navigate("/wallet/createMnemonic")
    }
    const newMnemonic = useNewMnemonic();
    const [address,setAddress] = useState<string>("");

    useEffect(() => {
        if (newMnemonic) {
            console.log(newMnemonic)
            window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletSignal, 'generateWallet', [ newMnemonic , "" ]]);
            window.electron.ipcRenderer.once(IPC_CHANNEL, (arg) => {
                if (arg instanceof Array && arg[0] == WalletSignal) {
                    const result = arg[1];
                    console.log(result)
                    const {
                      address
                    } = result;
                    setAddress(address)
                }
            });
        }
    }, [newMnemonic]);

    return (
        <>
            <Button size="large" shape="circle" icon={<LeftOutlined />} onClick={goBackClick} />
            <Spin spinning={true}>
                <Alert
                    type="info"
                    message="创建钱包"
                    description={<>
                        { address }
                        <Steps
                            direction="vertical"
                            current={1}
                            items={[
                                {
                                    title: '生成种子密钥',
                                    description: "完成",
                                },
                                {
                                    title: '生成钱包密钥',
                                    description: "执行中",
                                },
                                {
                                    title: '本地加密存储钱包数据',
                                    description: "待执行",
                                },
                            ]}
                        />
                    </>}
                />
            </Spin>
        </>
    );

}
