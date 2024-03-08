
import { Alert, Col, Row, Typography, Card, Divider, Button, Tabs, TabsProps, Input, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { message, Steps, theme } from 'antd';
import { useCallback, useEffect, useState } from "react";
import { useMulticallContract, useSafe3Contract } from "../../../hooks/useContracts";
import { AvailableSafe3Info, SpecialSafe3Info, formatAvailableSafe3Info, formatSpecialSafe3Info } from "../../../structs/Safe3";
import { ZERO } from "../../../utils/CurrentAmountUtils";

const { Text, Title } = Typography;

export interface Safe3Asset {
  availableSafe3Info?: AvailableSafe3Info,
  specialSafe3Info?: SpecialSafe3Info,
  lockedNum?: number,
  safe3Address : string
}

export default ({
  safe3Address, safe3CompressAddress , setSafe3Asset
}: {
  safe3Address?: string,
  safe3CompressAddress?: string ,
  setSafe3Asset : ( safe3Asset ?: Safe3Asset ) => void
}) => {
  const safe3Contract = useSafe3Contract();
  const [safe3AddressAsset, setSafe3AddressAsset] = useState<Safe3Asset>();
  const [safe3CompressAddressAsset, setSafe3CompressAddressAsset] = useState<Safe3Asset>();
  const [safe3AddressAssetLoading, setSafe3AddressAssetLoading] = useState<boolean>(false);
  const [safe3CompressAddressAssetLoading, setSafe3CompressAddressAssetLoading] = useState<boolean>(false);

  useEffect(() => {
    setSafe3Asset(undefined);
    if (safe3Address && safe3Contract) {
      setSafe3AddressAssetLoading(true);
      loadSafe3Asset(safe3Address, (safe3Asset: Safe3Asset) => {
        setSafe3AddressAsset({
          ...safe3Asset
        })
        setSafe3AddressAssetLoading(false);
      });
    } else {
      setSafe3AddressAsset(undefined);
    }
    if (safe3CompressAddress && safe3Contract) {
      setSafe3CompressAddressAssetLoading(true);
      loadSafe3Asset(safe3CompressAddress, (safe3Asset: Safe3Asset) => {
        setSafe3CompressAddressAsset({
          ...safe3Asset
        })
        setSafe3CompressAddressAssetLoading(false);
      });
    } else {
      setSafe3CompressAddressAsset(undefined);
    }

  }, [safe3Address, safe3Contract, safe3CompressAddress]);

  const loadSafe3Asset = useCallback((address: string, callback: (safe3Asset: Safe3Asset) => void) => {
    if (safe3Contract) {
      safe3Contract.callStatic.getAvailableInfo(address)
        .then(data => {
          const availableSafe3Info = formatAvailableSafe3Info(data);
          safe3Contract.callStatic.getLockedNum(address)
            .then((data: any) => {
              const lockedNum = data.toNumber();
              safe3Contract.callStatic.getSpecialInfo(address)
                .then((_specialSafe3Info: any) => {
                  const specialSafe3Info = formatSpecialSafe3Info(_specialSafe3Info);
                  callback({
                    availableSafe3Info,
                    lockedNum,
                    specialSafe3Info,
                    safe3Address : address
                  })
                })
            })
        })
    }
  }, [safe3Contract]);

  useEffect( () => {
    if ( safe3AddressAsset ){
      if ( safe3AddressAsset.availableSafe3Info?.amount && safe3AddressAsset.availableSafe3Info?.amount.greaterThan(ZERO) ){
        setSafe3Asset(safe3AddressAsset);
        return;
      }
      if ( safe3AddressAsset.lockedNum && safe3AddressAsset.lockedNum > 0 ){
        setSafe3Asset(safe3AddressAsset);
        return;
      }
      if ( safe3AddressAsset.specialSafe3Info && safe3AddressAsset.specialSafe3Info.amount.greaterThan(ZERO)){
        setSafe3Asset(safe3AddressAsset);
        return;
      }
      setSafe3Asset(safe3AddressAsset);
    }
    if ( safe3CompressAddressAsset ){
      if ( safe3CompressAddressAsset.availableSafe3Info?.amount && safe3CompressAddressAsset.availableSafe3Info?.amount.greaterThan(ZERO) ){
        setSafe3Asset(safe3CompressAddressAsset);
        return;
      }
      if ( safe3CompressAddressAsset.lockedNum && safe3CompressAddressAsset.lockedNum > 0 ){
        setSafe3Asset(safe3CompressAddressAsset);
        return;
      }
      if ( safe3CompressAddressAsset.specialSafe3Info && safe3CompressAddressAsset.specialSafe3Info.amount.greaterThan(ZERO)){
        setSafe3Asset(safe3CompressAddressAsset);
        return;
      }
    }
  } , [ safe3AddressAsset , safe3CompressAddressAsset ] );

  return (<>
    <Col span={12}>
      <Col span={24}>
        <Text strong type="secondary">Safe3 钱包地址</Text><br />
      </Col>
      <Col span={24}>
        <Text strong>{safe3Address}</Text><br />
      </Col>
      {
        safe3Address && <>
          <Spin spinning={safe3AddressAssetLoading}>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">账户余额</Text><br />
            </Col>
            <Col span={24}>
              <Text strong>{safe3AddressAsset?.availableSafe3Info?.amount.toFixed(2)} SAFE</Text><br />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">锁仓余额</Text>
              <Divider type="vertical" />
              <Text type="secondary">(锁仓记录:{safe3AddressAsset?.lockedNum})</Text>
            </Col>
            <Col span={24}>
              <Text strong>SAFE</Text><br />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">主节点</Text><br />
            </Col>
            <Col span={24}>
              <Text strong>{safe3AddressAsset?.specialSafe3Info?.amount.toFixed(2)} SAFE</Text><br />
            </Col>
          </Spin>
        </>
      }
    </Col>

    <Col span={12}>
      <Col span={24}>
        <Text strong type="secondary">Safe3 钱包地址[压缩公钥]</Text><br />
      </Col>
      <Col span={24}>
        <Text strong>{safe3CompressAddress}</Text><br />
      </Col>
      {
        safe3CompressAddress && <>
          <Spin spinning={safe3CompressAddressAssetLoading}>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">账户余额</Text><br />
            </Col>
            <Col span={24}>
              <Text strong>{safe3CompressAddressAsset?.availableSafe3Info?.amount.toFixed(2)} SAFE</Text><br />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">锁仓余额</Text>
              <Divider type="vertical" />
              <Text type="secondary">(锁仓记录:{safe3CompressAddressAsset?.lockedNum})</Text>
            </Col>
            <Col span={24}>
              <Text strong>SAFE</Text><br />
            </Col>
            <Col span={24} style={{ marginTop: "5px" }}>
              <Text strong type="secondary">主节点</Text><br />
            </Col>
            <Col span={24}>
              <Text strong>{safe3CompressAddressAsset?.specialSafe3Info?.amount.toFixed(2)} SAFE</Text><br />
            </Col>
          </Spin>
        </>
      }
    </Col>
  </>)

}
