import { Alert, Button, Card, Col, Divider, Input, Row, Spin, Typography } from "antd"
import { SupernodeInfo } from "../../../structs/Supernode"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useMasternodeStorageContract, useSupernodeLogicContract, useSupernodeStorageContract } from "../../../hooks/useContracts"
import { ethers } from "ethers"
import { TransactionResponse } from "@ethersproject/providers"
import { useWalletsActiveAccount } from "../../../state/wallets/hooks"
import { useTransactionAdder } from "../../../state/transactions/hooks"
import Safescan from "../../components/Safescan"
import { enodeRegex } from "./Register/SupernodeRegister"

const { Text } = Typography;

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
  const [changeAddrTxHash, setChangeAddrTxHash] = useState<string>();
  const [changingAddr, setChangingAddr] = useState<boolean>(false);

  const [newName, setNewName] = useState<string>(name);
  const [nameError, setNameError] = useState<string>();
  const [changeNameTxHash, setChangeNameTxHash] = useState<string>();
  const [changingName, setChangingName] = useState<boolean>(false);

  const [newEnode, setNewEnode] = useState<string>(enode);
  const [enodeError, setEnodeError] = useState<string>();
  const [changeEnodeTxHash, setChangeEnodeTxHash] = useState<string>();
  const [changingEnode, setChangingEnode] = useState<boolean>(false);

  const [newDescription, setNewDescription] = useState<string>(description);
  const [descriptionError, setDescriptionError] = useState<string>();
  const [changeDescriptionTxHash, setChangeDescriptionTxHash] = useState<string>();
  const [changingDescription, setChangingDescription] = useState<boolean>(false);


  const nameChangeAble = useMemo(() => {
    return newName && name != newName && !changeNameTxHash
  }, [name, newName, changeNameTxHash]);

  const addrChangeAble = useMemo(() => {
    return newAddr && addr != newAddr && !changeAddrTxHash
  }, [addr, newAddr, changeAddrTxHash]);

  const enodeChangeAble = useMemo(() => {
    return newEnode && enode != newEnode && !changeEnodeTxHash
  }, [enode, newEnode, changeEnodeTxHash]);

  const descriptionChangeAble = useMemo(() => {
    return newDescription && description != newDescription && !changeDescriptionTxHash
  }, [description, newDescription, changeDescriptionTxHash]);

  const changeName = useCallback(() => {
    if (newName && newName != name && supernodeLogicContract) {
      setChangingName(true);
      supernodeLogicContract.changeName(supernodeInfo.addr, newName)
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
          setChangeNameTxHash(hash);
          setChangingName(false);
        }).catch((err: any) => {
          setChangingName(false);
          setNameError(err.error.reason);
        })
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
        setChangingAddr(true);
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
            setChangeAddrTxHash(hash);
            setChangingAddr(false);
          })
          .catch((err: any) => {
            setChangingAddr(false);
            setAddrError(err.error.reason);
          });
      }
    }
  }, [supernodeInfo, addr, newAddr, supernodeStorageContract, supernodeLogicContract, masternodeStorageContract, activeAccount]);

  const changeEnode = useCallback(async () => {
    if (newEnode && newEnode != enode) {
      if (!enodeRegex.test(newEnode)) {
        setEnodeError("请输入合法的ENODE值");
        return;
      }
      // 判断新ENODE是否存在.
      if (supernodeLogicContract && supernodeStorageContract && masternodeStorageContract) {
        const existInSNs = await supernodeStorageContract.callStatic.existEnode(newEnode);
        const existInMNs = await masternodeStorageContract.callStatic.existEnode(newEnode);
        if (existInSNs) {
          setEnodeError("该ENODE已在超级节点中注册,请使用其他地址.");
          return;
        }
        if (existInMNs) {
          setEnodeError("该ENODE已在主节点中注册,请使用其他地址.");
          return;
        }
        // 执行ENODE更新.
        setChangingEnode(true);
        supernodeLogicContract.changeEnode(addr, newEnode)
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
            setChangeEnodeTxHash(hash);
            setChangingEnode(false);
          })
          .catch((err: any) => {
            setChangingEnode(false);
            setEnodeError(err.error.reason);
          });
      }
    }

  }, [supernodeInfo, enode, newEnode, supernodeStorageContract, supernodeLogicContract, masternodeStorageContract, activeAccount]);

  const changeDescription = useCallback(() => {
    if (newDescription && newDescription != description && supernodeLogicContract) {
      setChangingDescription(true);
      supernodeLogicContract.changeDescription(supernodeInfo.addr, newDescription)
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
          setChangeDescriptionTxHash(hash);
          setChangingDescription(false);
        }).catch((err: any) => {
          setDescriptionError(err.error.reason);
          setChangingDescription(false);
        })
    }
  }, [supernodeInfo, description, newDescription, supernodeStorageContract, supernodeLogicContract, masternodeStorageContract, activeAccount]);

  return <>
    <Card title="编辑超级节点">
      <Alert type="info" showIcon message={<>
        <Row>
          <Col span={24}>
            <Text>通过调用超级节点合约更新超级节点对应的属性信息.</Text>
            <br />
            <Text>更新的超级节点数据在交易写入区块链后才会生效.</Text>
          </Col>
        </Row>
      </>}/>
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">超级节点名称</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Spin spinning={changingName}>
            <Input value={newName} onChange={(event) => {
              const input = event.target.value;
              setNewName(input.trim());
            }} />
            {
              nameError && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={addrError} />
            }
            {
              changeNameTxHash && <Alert style={{ marginTop: "5px" }} type="success" showIcon message={<>
                <Row>
                  <Col span={22}>
                    交易哈希: {changeNameTxHash}
                  </Col>
                  <Col span={2}>
                    <Safescan url={`/tx/${changeNameTxHash}`} />
                  </Col>
                </Row>
              </>} />
            }
            <Button onClick={changeName} disabled={!nameChangeAble} style={{ marginTop: "5px" }} type="primary">更新</Button>
          </Spin>
        </Col>
        <Divider />
        <Col span={24}>
          <Text type="secondary">超级节点地址</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Spin spinning={changingAddr} >
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
            {
              changeAddrTxHash && <Alert style={{ marginTop: "5px" }} type="success" showIcon message={<>
                <Row>
                  <Col span={22}>
                    交易哈希: {changeAddrTxHash}
                  </Col>
                  <Col span={2}>
                    <Safescan url={`/tx/${changeAddrTxHash}`} />
                  </Col>
                </Row>
              </>} />
            }
            <Button onClick={changeAddr} disabled={!addrChangeAble} style={{ marginTop: "5px" }} type="primary">更新</Button>
          </Spin>
        </Col>
        <Divider />
        <Col span={24}>
          <Text type="secondary">超级节点ENODE</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Spin spinning={changingEnode}>
            <Input.TextArea value={newEnode} style={{ minHeight: "50px" }} onChange={(event) => {
              const input = event.target.value.trim();
              setNewEnode(input);
              const isMatch = enodeRegex.test(input);
              if (isMatch) {
                setEnodeError(undefined);
              } else {
                setEnodeError("请输入合法的ENODE值");
              }
            }} />
            {
              enodeError && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={enodeError} />
            }
            {
              changeEnodeTxHash && <Alert style={{ marginTop: "5px" }} type="success" showIcon message={<>
                <Row>
                  <Col span={22}>
                    交易哈希: {changeEnodeTxHash}
                  </Col>
                  <Col span={2}>
                    <Safescan url={`/tx/${changeEnodeTxHash}`} />
                  </Col>
                </Row>
              </>} />
            }
            <Button onClick={changeEnode} disabled={!enodeChangeAble} style={{ marginTop: "5px" }} type="primary">更新</Button>
          </Spin>
        </Col>
        <Divider />
        <Col span={24}>
          <Text type="secondary">超级节点简介</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Spin spinning={changingDescription}>
            <Input.TextArea value={newDescription} style={{ minHeight: "50px" }} onChange={(event) => {
              const input = event.target.value.trim();
              setNewDescription(input);
            }} />
            {
              descriptionError && <Alert style={{ marginTop: "5px" }} type="error" showIcon message={descriptionError} />
            }
            {
              changeDescriptionTxHash && <Alert style={{ marginTop: "5px" }} type="success" showIcon message={<>
                <Row>
                  <Col span={22}>
                    交易哈希: {changeDescriptionTxHash}
                  </Col>
                  <Col span={2}>
                    <Safescan url={`/tx/${changeDescriptionTxHash}`} />
                  </Col>
                </Row>
              </>} />
            }
            <Button onClick={changeDescription} disabled={!descriptionChangeAble} style={{ marginTop: "5px" }} type="primary">更新</Button>
          </Spin>
        </Col>
      </Row>
    </Card>
  </>
}
