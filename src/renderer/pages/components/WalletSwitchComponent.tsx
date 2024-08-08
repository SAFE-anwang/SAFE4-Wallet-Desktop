import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApartmentOutlined, ClusterOutlined, PlusOutlined } from '@ant-design/icons';
import { Divider, Input, Select, Space, Button, Typography, Row, Col, Tooltip } from 'antd';
import "./comp.css";
import { useNavigate } from 'react-router-dom';
import { useETHBalances, useWalletsActiveWallet, useWalletsList, useWalletsWalletNames } from '../../state/wallets/hooks';
import { useDispatch } from 'react-redux';
import { walletsUpdateActiveWallet } from '../../state/wallets/action';
import { IPC_CHANNEL } from '../../config';
import { WalletNameSignal, WalletName_Methods } from '../../../main/handlers/WalletNameHandler';
import useWalletName from '../../hooks/useWalletName';
import { useMasternodeStorageContract, useMulticallContract, useSupernodeStorageContract } from '../../hooks/useContracts';
import CallMulticallAggregate, { CallMulticallAggregateContractCall } from '../../state/multicall/CallMulticallAggregate';
import { useBlockNumber } from '../../state/application/hooks';

const { Text } = Typography;

export default () => {

  const navigate = useNavigate();
  const walletsList = useWalletsList();
  const activeWallet = useWalletsActiveWallet();
  const dispatch = useDispatch();
  const addressesBalances = useETHBalances(walletsList.map(wallet => wallet.address));
  const walletsWalletNames = useWalletsWalletNames();
  const activeWalletName = useWalletName(activeWallet?.address);
  const multicall = useMulticallContract();
  const blockNumber = useBlockNumber();
  const supernodeStorageContract = useSupernodeStorageContract();
  const masternodeStorageContract = useMasternodeStorageContract();
  const [isMasternode, setIsMasternode] = useState<{
    [address: string]: boolean
  }>();
  const [isSupernode, setIsSupernode] = useState<{
    [address: string]: boolean
  }>();

  const items = useMemo(() => {
    let items = [];
    for (let i in walletsList) {
      const {
        name, publicKey, address
      } = walletsList[i];
      const balance = addressesBalances[address];
      let _name = name;
      if (walletsWalletNames && walletsWalletNames[address]) {
        _name = walletsWalletNames[address].name;
      }
      const subAddress = address.substring(0, 10) + "..." + address.substring(address.length - 8);

      items.push({
        label: <>
          <Row>
            <Col span={24}>
              {
                isSupernode && isSupernode[address] &&
                <Tooltip title="超级节点">
                  <ClusterOutlined style={{ float: "left", marginTop: "4px", marginRight: "2px" }} />
                </Tooltip>
              }
              {
                isMasternode && isMasternode[address] &&
                <Tooltip title="主节点">
                  <ApartmentOutlined style={{ float: "left", marginTop: "4px", marginRight: "2px" }} />
                </Tooltip>
              }
              <Text style={{ float: "left" }}>{_name}</Text>
              <Text strong style={{ float: "right", marginLeft: "50px" }}>{balance?.toFixed(1)}</Text>
            </Col>
            <Col span={24}>
              <Text style={{
                fontFamily: "SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace"
              }} type='secondary'>
                {subAddress}
              </Text>
            </Col>
          </Row>
        </>,
        value: publicKey
      })
    }
    return items;
  }, [walletsList, addressesBalances, walletsWalletNames, isMasternode]);


  const createNewWallet = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    navigate("/selectCreateWallet");
  };

  const switchActionWallet = (publicKey: string, e: any) => {
    dispatch(walletsUpdateActiveWallet(publicKey));
  }

  useEffect(() => {
    if (activeWallet) {
      const activeWalletAddress = walletsList.filter(wallet => wallet.publicKey == activeWallet.publicKey)[0].address;
      if (walletsWalletNames) {
        const walletName = { ...walletsWalletNames[activeWalletAddress] };
        walletName.active = true;
        const method = WalletName_Methods.saveOrUpdate;
        window.electron.ipcRenderer.sendMessage(IPC_CHANNEL, [WalletNameSignal, method, [
          {
            address: activeWalletAddress,
            name: walletName.name,
            active: 1
          }
        ]]);
      }
    }
  }, [activeWallet, walletsList]);

  useEffect(() => {
    if (masternodeStorageContract && supernodeStorageContract && multicall) {
      // isSupernode
      const addressesExistInSupernodes = walletsList.map(({ address }) => {
        const addressExistInSupernodes: CallMulticallAggregateContractCall = {
          contract: supernodeStorageContract,
          functionName: "exist",
          params: [address]
        };
        return addressExistInSupernodes;
      });
      CallMulticallAggregate(
        multicall,
        addressesExistInSupernodes, () => {
          const isSupernode: {
            [address: string]: boolean
          } = {};
          addressesExistInSupernodes.forEach(({ params, result }) => {
            const address = params[0];
            isSupernode[address] = result;
          });
          setIsSupernode(isSupernode);
        });

      // isMasternode
      const addressesExistInMasternodes = walletsList.map(({ address }) => {
        const addressExistInMasternodes: CallMulticallAggregateContractCall = {
          contract: masternodeStorageContract,
          functionName: "exist",
          params: [address]
        };
        return addressExistInMasternodes;
      });
      CallMulticallAggregate(
        multicall,
        addressesExistInMasternodes, () => {
          const isMasternode: {
            [address: string]: boolean
          } = {};
          addressesExistInMasternodes.forEach(({ params, result }) => {
            const address = params[0];
            isMasternode[address] = result;
          });
          setIsMasternode(isMasternode);
        });
    }
  }, [walletsList, multicall, masternodeStorageContract, supernodeStorageContract , blockNumber])

  return <>
    <Select
      className='wallet-switch-selector'
      value={activeWalletName}
      onChange={switchActionWallet}
      style={{ textAlign: "center", marginBottom: "15px", height: "50px", width: "220px", marginLeft: "5px", borderRadius: "20px" }}
      dropdownRender={(menu) => (
        <div>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <Button style={{ width: "100%", height: "60px" }} type="text" icon={<PlusOutlined />} onClick={createNewWallet}>
            创建新的钱包
          </Button>
        </div>
      )}
      options={items}
    />
  </>
}
