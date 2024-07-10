import { Alert, Button, Card, Col, Divider, Input, Row, Typography } from "antd"
import { SupernodeInfo } from "../../../structs/Supernode"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useMasternodeStorageContract, useSupernodeLogicContract, useSupernodeStorageContract } from "../../../hooks/useContracts"
import { ethers } from "ethers"
import { TransactionResponse } from "@ethersproject/providers"
import { useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useTransactionAdder } from "../../../state/transactions/hooks"

const { Text } = Typography

export default ({
  supernodeInfo
}: {
  supernodeInfo: SupernodeInfo
}) => {

  const { addr, name, enode, description } = supernodeInfo;
  const supernodeLogicContract = useSupernodeLogicContract(true);
  const supernodeStorageContract = useSupernodeStorageContract();
  const masternodeStorageContract = useMasternodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();

  const [newAddr, setNewAddr] = useState<string>(addr);
  const [addrError, setAddrError] = useState<string>();

  const [newName, setNewName] = useState<string>(name);
  const [nameError, setNameError] = useState<string>();

  const [newEnode, setNewEnode] = useState<string>(enode);
  const [enodeError, setEnodeError] = useState<string>();

  const [newDescription, setNewDescription] = useState<string>(description);
  const [descriptioniError, setDescriptionError] = useState<string>();


  const nameChangeAble = useMemo(() => {
    return newName && name != newName
  }, [name, newName]);

  const addrChangeAble = useMemo(() => {
    return newAddr && addr != newAddr
  }, [addr, newAddr]);

  const enodeChangeAble = useMemo(() => {
    return newEnode && enode != newEnode
  }, [enode, newEnode]);

  const descriptionChangeAble = useMemo(() => {
    return newDescription && description != newDescription
  }, [description, newDescription]);

  const changeName = useCallback(() => {
    if (newName && newName != name) {

    }
  }, [supernodeInfo, name, newName, masternodeStorageContract, activeAccount]);

  const changeAddr = useCallback(async () => {
    if (newAddr && newAddr != addr) {
      if (!ethers.utils.isAddress(newAddr)) {
        setAddrError("请输入合法的钱包地址");
        return;
      }
      // 判断新地址是否存在.
      if (supernodeLogicContract && supernodeStorageContract && masternodeStorageContract) {
        const existInSNs = await supernodeStorageContract.callStatic.exist(newAddr);
        const existInMNs = await masternodeStorageContract.callStatic.exist(newAddr);
        if (existInSNs) {
          setAddrError("该地址已在超级节点中注册,请使用其他地址.");
          return;
        }
        if (existInMNs) {
          setAddrError("该地址已在主节点中注册,请使用其他地址.");
          return;
        }
        // 执行地址更新.
        supernodeLogicContract.changeAddress(addr, newAddr)
          .then((response: TransactionResponse) => {
            const { hash, data } = response;
            addTransaction({ to: supernodeLogicContract.address }, response, {
              call: {
                from: activeAccount,
                to: supernodeLogicContract.address,
                input: data,
                value: "0"
              }
            });
          })
          .catch((err: any) => {

          });
      }
    }
  }, [supernodeInfo, addr, newAddr, supernodeStorageContract, supernodeLogicContract, masternodeStorageContract, activeAccount]);

  return <>
    <Card title="编辑超级节点">
      <Row>
        <Col span={24}>
          <Text type="secondary">超级节点名称</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Input value={newName} onChange={(event) => {
            const input = event.target.value;
            setNewName(input.trim());
          }} />
          {
            nameError && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={addrError} />
          }
          <Button onClick={changeName} disabled={!nameChangeAble} style={{ marginTop: "5px" }} type="primary">应用</Button>
        </Col>
        <Divider />
        <Col span={24}>
          <Text type="secondary">超级节点地址</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Input value={newAddr} onChange={(event) => {
            const input = event.target.value.trim();
            setNewAddr(input);
            if (ethers.utils.isAddress(input)) {
              setAddrError(undefined);
            } else {
              setAddrError("请输入合法的钱包地址");
            }
          }} />
          {
            addrError && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={addrError} />
          }
          <Button onClick={changeAddr} disabled={!addrChangeAble} style={{ marginTop: "5px" }} type="primary">应用</Button>
        </Col>
        <Divider />
        <Col span={24}>
          <Text type="secondary">超级节点ENODE</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Input.TextArea value={newEnode} style={{ minHeight: "100px" }} />
        </Col>
        <Divider />
        <Col span={24}>
          <Text type="secondary">超级节点简介</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Input.TextArea value={newDescription} style={{ minHeight: "100px" }} />
        </Col>
      </Row>
    </Card>
  </>
}
