import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";

import "@xterm/xterm/css/xterm.css";
import { useSelector } from "react-redux";
import { AppState } from "../../../state";
import { formatMasternode, MasternodeInfo } from "../../../structs/Masternode";
import { useMasternodeStorageContract } from "../../../hooks/useContracts";
import AddressComponent from "../../components/AddressComponent";
import { NodeAddressSelectType, SupportChildWalletType, SupportNodeAddressSelectType } from "../../../utils/GenerateChildWallet";
import { useActiveAccountChildWallets, useWalletsActiveAccount, useWalletsActiveKeystore } from "../../../state/wallets/hooks";

const { Text, Title } = Typography

export default () => {

  const editMasternodeId = useSelector((state: AppState) => state.application.control.editMasternodeId);
  const [masternodeInfo, setMasternodeInfo] = useState<MasternodeInfo>();
  const masternodeStorageContract = useMasternodeStorageContract();
  const [nodeAddressSelectType, setNodeAddressSelectType] = useState<SupportNodeAddressSelectType>();
  const walletsActiveKeystore = useWalletsActiveKeystore();
  const activeAccountChildWallets = useActiveAccountChildWallets(SupportChildWalletType.MN);
  const activeAccount = useWalletsActiveAccount();
  const [helpResult, setHelpResult] = useState<
    {
      enode: string,
      nodeAddress: string
    }
  >();

  const [updateParams, setUpdateParams] = useState<{
    address: string | undefined,
    enode: string | undefined,
    description: string | undefined
  }>({
    address: undefined,
    enode: undefined,
    description: undefined
  });
  const [inputErrors, setInputErrors] = useState<{
    address?: string,
    enode?: string,
    description?: string
  }>();

  useEffect(() => {
    if (masternodeInfo) {
      setUpdateParams({
        address: masternodeInfo.addr,
        enode: masternodeInfo.enode,
        description: masternodeInfo.description
      })
    }
  }, [masternodeInfo])

  useEffect(() => {
    if (editMasternodeId && masternodeStorageContract) {
      masternodeStorageContract.callStatic.getInfoByID(editMasternodeId).then(_masternodeInfo => {
        setMasternodeInfo(formatMasternode(_masternodeInfo));
      });
    }
  }, [editMasternodeId, masternodeStorageContract]);

  useEffect(() => {
    if (walletsActiveKeystore?.mnemonic) {
      setNodeAddressSelectType(NodeAddressSelectType.GEN)
    } else {
      setNodeAddressSelectType(NodeAddressSelectType.INPUT)
    }
  }, [walletsActiveKeystore]);

  const selectChildWalletOptions = useMemo(() => {
    if (activeAccountChildWallets && nodeAddressSelectType && masternodeInfo) {
      const options = Object.keys(activeAccountChildWallets.wallets)
        .map(childAddress => {
          const { path, exist } = activeAccountChildWallets.wallets[childAddress];
          return {
            address: childAddress,
            path,
            exist: exist ? childAddress != masternodeInfo?.addr : exist,
            index: path.substring(Number(path.lastIndexOf("/") + 1))
          }
        })
        .sort((a: any, b: any) => (a.index - b.index))
        .map(({ address, path, exist, index }) => {
          return {
            value: address,
            label: <>
              <Row key={address}>
                <Col span={16}>
                  <Row>
                    {
                      exist && <Col span={6}>
                        <Text type='secondary'>[已注册]</Text>
                      </Col>
                    }
                    {
                      address == masternodeInfo.addr && <Col span={6}>
                        <Text type='secondary'>[当前节点]</Text>
                      </Col>
                    }
                    <Col span={18}>
                      <AddressComponent ellipsis address={address} />
                    </Col>
                  </Row>
                </Col>
                <Col span={8} style={{ textAlign: "right", float: "right" }}>
                  <Text type='secondary'>{path}</Text>
                </Col>
              </Row>
            </>,
            disabled: exist
          }
        })
      return options;
    }
  }, [activeAccount, activeAccountChildWallets, nodeAddressSelectType, masternodeInfo]);

  // 子钱包加载后,自动设置可用的第一个子钱包作为默认选择;
  useEffect(() => {
    if (selectChildWalletOptions && nodeAddressSelectType == NodeAddressSelectType.GEN && masternodeInfo) {
      const couldSelect = selectChildWalletOptions.filter(option => !option.disabled);
      if (couldSelect && couldSelect.length > 0) {
        if (couldSelect.map(option => option.value).indexOf(masternodeInfo.addr)) {
          setUpdateParams({
            ...updateParams,
            address: masternodeInfo.addr
          });
        } else {
          setUpdateParams({
            ...updateParams,
            address: couldSelect[0].value
          });
        }
        setInputErrors({
          ...inputErrors,
          address: undefined
        });
      }
    }
  }, [masternodeInfo, selectChildWalletOptions, nodeAddressSelectType]);

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Title level={4} style={{ lineHeight: "16px" }}>
          编辑主节点
        </Title>
      </Col>
    </Row>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto" }}>

          <Row style={{ marginTop: "20px", marginBottom: "20px" }}>
            <Col span={24}>
              <Alert type='info' showIcon message={
                <>
                  <Row>
                    <Col span={24}>
                      <Text>
                        已有服务器,也可以选择通过 SSH 登陆来辅助更新主节点.
                      </Text>
                      <Button type='primary' size='small' style={{ float: "right" }}>辅助更新</Button>
                    </Col>
                  </Row>
                </>
              }></Alert>
            </Col>
          </Row>

          <Row style={{ marginTop: "20px" }}>
            <Col span={24}>
              <Text type="secondary">主节点ID</Text>
            </Col>
            <Col>
              <Text>{masternodeInfo?.id}</Text>
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text type="secondary">创建者</Text>
            </Col>
            <Col span={18}>
              {
                masternodeInfo && <AddressComponent address={masternodeInfo?.creator} />
              }
            </Col>

            <Col span={24} style={{ marginTop: "5px" }}>
              <Text type="secondary">主节点地址</Text>
              <Alert style={{ marginTop: "5px", marginBottom: "5px" }} type='warning' showIcon message={<>
                <Row>
                  <Col span={24}>
                    主节点运行时,节点程序需要加载主节点地址的私钥来签名见证凭证.
                  </Col>
                  <Col span={24}>
                    由于该主节点地址的私钥会被远程存放在您的节点服务器上,<Text type='danger' strong>请避免向这个主节点地址进行资产转账.</Text>
                  </Col>
                </Row>
              </>} />
            </Col>
            <Col span={24}>
              <Radio.Group value={nodeAddressSelectType}
                onChange={(event) => {
                  setUpdateParams({
                    ...updateParams,
                    address: masternodeInfo?.addr
                  });
                  setNodeAddressSelectType(event.target.value);
                }}>
                <Space style={{ height: "50px" }} direction="vertical">
                  <Radio disabled={walletsActiveKeystore?.mnemonic == undefined}
                    value={NodeAddressSelectType.GEN}>
                    钱包通过当前账户的种子密钥生成子地址作为主节点地址
                  </Radio>
                  <Radio value={NodeAddressSelectType.INPUT}>
                    已在节点服务器上配置了节点地址私钥,直接输入节点地址
                  </Radio>
                </Space>
              </Radio.Group>
              {
                nodeAddressSelectType == NodeAddressSelectType.INPUT &&
                <Input style={{ marginTop: "5px" }} value={updateParams?.address} placeholder='输入主节点地址' onChange={(event) => {
                  const input = event.target.value.trim();
                }} />
              }
              {
                nodeAddressSelectType == NodeAddressSelectType.GEN &&
                <Spin spinning={false}>
                  <Select
                    style={{
                      width: "100%",
                      marginTop: "5px"
                    }}
                    placeholder="正在加载可用的主节点地址..."
                    options={selectChildWalletOptions}
                    disabled={helpResult ? true : false}
                    onChange={(value) => {
                      setUpdateParams({
                        ...updateParams,
                        address: value
                      });
                      setInputErrors({
                        ...inputErrors,
                        address: undefined
                      })
                    }}
                    value={updateParams.address}
                  />
                </Spin>
              }
            </Col>

            <Col>
              <Text>{masternodeInfo?.addr}</Text>
            </Col>

          </Row>

        </div>

      </Card>
    </Row>



  </>

}

