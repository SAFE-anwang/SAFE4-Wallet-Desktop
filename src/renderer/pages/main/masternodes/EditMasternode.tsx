import { useCallback, useMemo, useState } from "react";
import { useMasternodeLogicContract, useMasternodeStorageContract, useSupernodeStorageContract } from "../../../hooks/useContracts";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { MasternodeInfo } from "../../../structs/Masternode"
import { ethers } from "ethers";
import { TransactionResponse } from "@ethersproject/providers";
import { enodeRegex } from "../supernodes/Register/SupernodeRegister";
import { Alert, Button, Card, Col, Divider, Input, Row, Spin, Typography } from "antd"
import Safescan from "../../components/Safescan";
import { InputRules } from "./Register/MasternodeRegister";

const { Text } = Typography;

export default ({
  masternodeInfo
}: {
  masternodeInfo: MasternodeInfo
}) => {

  const { addr, enode, description } = masternodeInfo;
  const masternodeLogicContract = useMasternodeLogicContract(true);
  const supernodeStorageContract = useSupernodeStorageContract();
  const masternodeStorageContract = useMasternodeStorageContract();
  const activeAccount = useWalletsActiveAccount();
  const addTransaction = useTransactionAdder();

  const [newAddr, setNewAddr] = useState<string>(addr);
  const [addrError, setAddrError] = useState<string>();
  const [changeAddrTxHash, setChangeAddrTxHash] = useState<string>();
  const [changingAddr, setChangingAddr] = useState<boolean>(false);

  const [newEnode, setNewEnode] = useState<string>(enode);
  const [enodeError, setEnodeError] = useState<string>();
  const [changeEnodeTxHash, setChangeEnodeTxHash] = useState<string>();
  const [changingEnode, setChangingEnode] = useState<boolean>(false);

  const [newDescription, setNewDescription] = useState<string>(description);
  const [descriptionError, setDescriptionError] = useState<string>();
  const [changeDescriptionTxHash, setChangeDescriptionTxHash] = useState<string>();
  const [changingDescription, setChangingDescription] = useState<boolean>(false);

  const addrChangeAble = useMemo(() => {
    return newAddr && addr != newAddr && !changeAddrTxHash
  }, [addr, newAddr, changeAddrTxHash]);

  const enodeChangeAble = useMemo(() => {
    return newEnode && enode != newEnode && !changeEnodeTxHash
  }, [enode, newEnode, changeEnodeTxHash]);

  const descriptionChangeAble = useMemo(() => {
    return newDescription && description != newDescription && !changeDescriptionTxHash
  }, [description, newDescription, changeDescriptionTxHash]);

  const changeAddr = useCallback(async () => {
    if (newAddr && newAddr != addr) {
      if (!ethers.utils.isAddress(newAddr)) {
        setAddrError("请输入合法的钱包地址");
        return;
      }
      // 判断新地址是否存在.
      if (masternodeLogicContract && supernodeStorageContract && masternodeStorageContract) {
        const existInSNs = await supernodeStorageContract.callStatic.exist(newAddr);
        const existInMNs = await masternodeStorageContract.callStatic.exist(newAddr);
        if (existInSNs) {
          setAddrError("该地址已在主节点中注册,请使用其他地址.");
          return;
        }
        if (existInMNs) {
          setAddrError("该地址已在主节点中注册,请使用其他地址.");
          return;
        }
        // 执行地址更新.
        setChangingAddr(true);
        masternodeLogicContract.changeAddress(addr, newAddr)
          .then((response: TransactionResponse) => {
            const { hash, data } = response;
            addTransaction({ to: masternodeLogicContract.address }, response, {
              call: {
                from: activeAccount,
                to: masternodeLogicContract.address,
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
  }, [masternodeInfo, addr, newAddr, supernodeStorageContract, masternodeLogicContract, masternodeStorageContract, activeAccount]);

  const changeEnode = useCallback(async () => {
    if (newEnode && newEnode != enode) {
      if (!enodeRegex.test(newEnode)) {
        setEnodeError("请输入合法的ENODE值");
        return;
      }
      // 判断新ENODE是否存在.
      if (masternodeLogicContract && supernodeStorageContract && masternodeStorageContract) {
        const existInSNs = await supernodeStorageContract.callStatic.existEnode(newEnode);
        const existInMNs = await masternodeStorageContract.callStatic.existEnode(newEnode);
        if (existInSNs) {
          setEnodeError("该ENODE已在主节点中注册,请使用其他地址.");
          return;
        }
        if (existInMNs) {
          setEnodeError("该ENODE已在主节点中注册,请使用其他地址.");
          return;
        }
        // 执行ENODE更新.
        setChangingEnode(true);
        masternodeLogicContract.changeEnode(addr, newEnode)
          .then((response: TransactionResponse) => {
            const { hash, data } = response;
            addTransaction({ to: masternodeLogicContract.address }, response, {
              call: {
                from: activeAccount,
                to: masternodeLogicContract.address,
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

  }, [masternodeInfo, enode, newEnode, supernodeStorageContract, masternodeLogicContract, masternodeStorageContract, activeAccount]);

  const changeDescription = useCallback(() => {
    if (newDescription && newDescription != description && masternodeLogicContract) {
      if (newDescription && (newDescription.length < InputRules.description.min || newDescription.length > InputRules.description.max)) {
        setDescriptionError(`简介信息长度需要大于${InputRules.description.min}且小于${InputRules.description.max}`)
        return;
      }
      setChangingDescription(true);
      masternodeLogicContract.changeDescription(masternodeInfo.addr, newDescription)
        .then((response: TransactionResponse) => {
          const { hash, data } = response;
          addTransaction({ to: masternodeLogicContract.address }, response, {
            call: {
              from: activeAccount,
              to: masternodeLogicContract.address,
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
  }, [masternodeInfo, description, newDescription, supernodeStorageContract, masternodeLogicContract, masternodeStorageContract, activeAccount]);


  return <>
    <Card title="编辑主节点">
      <Alert type="info" showIcon message={<>
        <Row>
          <Col span={24}>
            <Text>通过调用主节点合约更新主节点对应的属性信息.</Text>
            <br />
            <Text>更新的主节点数据在交易写入区块链后才会生效.</Text>
          </Col>
        </Row>
      </>} />
      <Divider />
      <Row>
        <Col span={24}>
          <Text type="secondary">主节点地址</Text>
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
                  <Col span={2} style={{textAlign:"right"}}>
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
          <Text type="secondary">主节点ENODE</Text>
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
                  <Col span={2} style={{textAlign:"right"}}>
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
          <Text type="secondary">主节点简介</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Spin spinning={changingDescription}>
            <Input.TextArea value={newDescription} style={{ minHeight: "50px" }} onChange={(event) => {
              const input = event.target.value.trim();
              setNewDescription(input);
              setDescriptionError(undefined);
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
                  <Col span={2} style={{textAlign:"right"}}>
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
