import React, { useState, useRef, useMemo } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Divider, Input, Select, Space, Button } from 'antd';
import type { InputRef } from 'antd';
import "./comp.css";
import { useNavigate } from 'react-router-dom';
import { useWalletsActiveWallet, useWalletsList } from '../../state/wallets/hooks';
import { useDispatch } from 'react-redux';
import { Wallets_Update_ActiveWallet } from '../../state/wallets/action';


let index = 0;

export default () => {

  const navigate = useNavigate();
  const walletsList = useWalletsList();
  const activeWallet = useWalletsActiveWallet();
  const dispatch = useDispatch();


  const items = useMemo(() => {
    let items = [];
    for (let i in walletsList) {
      const {
        name, publicKey
      } = walletsList[i];
      items.push({
        label: name,
        value: publicKey
      })
    }
    return items;
  }, [walletsList]);

  const createNewWallet = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    navigate("/selectCreateWallet");
  };
  const switchActionWallet = ( publicKey : string ) => {
    dispatch(Wallets_Update_ActiveWallet(publicKey));
  }

  return <>
    <Select
      defaultValue={activeWallet?.publicKey}
      className='wallet-switch-selector'
      onChange={switchActionWallet}
      style={{ textAlign: "center", marginBottom: "15px", height: "50px", width: "190px", marginLeft: "5px", borderRadius: "20px" }}
      dropdownRender={(menu) => (
        <>
          {menu}
          <Divider style={{ margin: '8px 0' }} />
          <Button style={{ width: "100%", height: "60px" }} type="text" icon={<PlusOutlined />} onClick={createNewWallet}>
            创建新的钱包
          </Button>
        </>
      )}
      options={items}
    />
  </>
}
