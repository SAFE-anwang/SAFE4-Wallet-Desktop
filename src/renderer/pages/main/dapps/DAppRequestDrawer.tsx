import { Drawer } from "antd";
import { useEffect, useRef, useState } from "react";
import RequestSwitchChainID from "./RequestSwitchChainID";
import RequestUnsupport from "./RequestUnsupport";
import RequestEthSendTransaction from "./RequestEthSendTransaction";
import RequestPersonalSign from "./RequestPersonalSign";
import { DAppRequest } from "../../../../main/DappRequestIpc";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import RequestEthAccounts from "./RequestEthAccounts";
import RequestAddEthereumChain from "./RequestAddEthereumChain";
import { useDAppBlockchainRpcProps } from "../../../state/dApp/hooks";
import RequestEthSignTypedDataV4 from "./RequestEthSignTypedDataV4";

// ==============================
// 支持的方法列表
// ==============================

// 只读方法（走 RPC，当前 preload 直连 RPC，不会发 IPC 到 Render）
export const DApp_Support_READONLY_Methods = new Set([
  "web3_clientVersion",
  "eth_blockNumber",
  "eth_getBalance",
  "eth_getCode",
  "eth_getTransactionCount",
  "eth_getStorageAt",
  "eth_call",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_feeHistory",
  "eth_maxPriorityFeePerGas",
  "eth_getTransactionByHash",
  "eth_getTransactionReceipt",
  "eth_getLogs",
  "eth_getBlockByNumber",
  "eth_getBlockByHash",
]);

// 交互方法（需要弹窗让用户确认）
export const DApp_Support_INTERACTIVE_Methods = new Set([
  "eth_requestAccounts",
  "wallet_switchEthereumChain",
  "wallet_addEthereumChain",
  "eth_sendTransaction",
  "personal_sign",
  "eth_signTypedData_v4",
  // "eth_sign",
  // "wallet_watchAsset",
]);

// ==============================
// 组件
// ==============================
export default ({
  setWalletState,
}: {
  setWalletState?: (walletState: any) => void;
}) => {

  const [dAppRequest, setDAppRequest] = useState<{
    [method: string]: DAppRequest | undefined;
  }>({});
  const [open, setOpen] = useState<boolean>(false);

  // isProcessing: 当前是否有请求正在被"占用"（包括已完成但窗口还开着的情况）
  // requestCompleted: 当前请求是否已处理完成（用于区分"真正在处理"和"只是窗口开着"）
  const isProcessingRef = useRef<boolean>(false);
  const requestCompletedRef = useRef<boolean>(false);
  const setProcessing = (value: boolean) => {
    isProcessingRef.current = value;
  };
  const setRequestCompleted = (value: boolean) => {
    requestCompletedRef.current = value;
  };

  // ==============================
  // 子组件处理完成（但窗口保持打开）
  // 场景：交易已发送，展示 txHash，等待用户查看
  // ==============================
  const handleRequestComplete = () => {
    console.log("[DappRequestDrawer.tsx] 请求已处理完成，窗口保持打开");
    setRequestCompleted(true);
  };
  // ==============================
  // 子组件关闭（用户主动关闭窗口，或处理完毕后关闭）
  // ==============================
  const handleComponentClose = () => {
    console.log("[DappRequestDrawer.tsx] 子组件关闭");
    setDAppRequest({});
    setProcessing(false);
    setRequestCompleted(false);
    setOpen(false);
  };

  // ==============================
  // 监听主进程的 dApp 请求
  // ==============================
  useEffect(() => {
    const cleanup = window.electron.dapp.onDappRequest((request: DAppRequest) => {
      const { requestId, dAppRequestParams, dAppWalletState } = request;
      const { method } = dAppRequestParams;

      // 更新钱包状态
      if (setWalletState && dAppWalletState) {
        setWalletState(dAppWalletState);
      }

      // 判定方法类型
      const _method = DApp_Support_INTERACTIVE_Methods.has(method)
        ? method
        : "unsupport_method";

      // ---------- 关键：处理并发请求 ----------
      if (isProcessingRef.current) {
        if (!requestCompletedRef.current) {
          // 情况 A：上一个请求还没处理完（用户还没确认）
          // → 拒绝新请求
          console.warn("[DappRequestDrawer.tsx] 拒绝! 上一个请求还在处理中");
          window.electron.dapp.response(requestId, false, null, {
            code: -32002,
            message: "正在处理上一个请求，请稍后再试",
          });
          return;
        }

        // 情况 B：上一个请求已完成，但窗口还开着（用户在查看 txHash）
        // → 自动关闭旧 Drawer，再打开新请求
        console.log("[DappRequestDrawer.tsx] 上一个请求已完成，切换新请求");
        setDAppRequest({});
        setProcessing(false);
        setRequestCompleted(false);
        setOpen(false);

        // 等待 Drawer 关闭动画结束，再打开新请求
        setTimeout(() => {
          setDAppRequest({ [_method]: request });
          setProcessing(true);
          setRequestCompleted(false);
          setOpen(true);
          console.log("[DappRequestDrawer.tsx] 打开 Drawer 处理新请求 =>", _method);
        }, 300);
        return;
      }

      // ---------- 常规情况：无请求在处理 ----------
      setDAppRequest({ [_method]: request });
      setProcessing(true);
      setRequestCompleted(false);
      setOpen(true);
      console.log("[DappRequestDrawer.tsx] 打开 Drawer 处理 =>", _method);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // 将 Drawer 打开状态通知给主进程，用于调整窗口大小
  useEffect(() => {
    window.electron.dapp.setOpenDrawer(open);
  }, [open]);

  const onClose = () => {
    setOpen(false);
    console.log("[DappRequestDrawer.tsx] 关闭 Drawer;");
  };

  // ==============================
  // 取出当前要渲染的请求
  // ==============================
  const getCurrentRequest = () => {
    if (!dAppRequest || Object.keys(dAppRequest).length === 0) return null;

    for (const method of DApp_Support_INTERACTIVE_Methods) {
      if (dAppRequest[method]) {
        return { method, request: dAppRequest[method] };
      }
    }
    if (dAppRequest["unsupport_method"]) {
      return {
        method: "unsupport_method",
        request: dAppRequest["unsupport_method"],
      };
    }
    return null;
  };

  const current = getCurrentRequest();

  return (
    <Drawer
      width={"500px"}
      title="来自 dApp 页面的请求"
      closable={false}
      maskClosable={false}
      keyboard={false}
      open={open}
      onClose={onClose}
    >
      {current && current.method === "wallet_switchEthereumChain" && (
        <RequestSwitchChainID
          dAppRequest={current.request}
          onComplete={handleRequestComplete}
          onClose={handleComponentClose}
        />
      )}
      {current && current.method === "eth_sendTransaction" && (
        <RequestEthSendTransaction
          dAppRequest={current.request}
          onClose={handleComponentClose}
          onComplete={handleRequestComplete}
        />
      )}
      {current && current.method === "personal_sign" && (
        <RequestPersonalSign
          dAppRequest={current.request}
          onComplete={handleRequestComplete}
          onClose={handleComponentClose}
        />
      )}
      {current && current.method === "eth_requestAccounts" && (
        <RequestEthAccounts
          dAppRequest={current.request}
          onComplete={handleRequestComplete}
          onClose={handleComponentClose}
        />
      )}
      {current && current.method === "wallet_addEthereumChain" && (
        <RequestAddEthereumChain
          dAppRequest={current.request}
          onComplete={handleRequestComplete}
          onClose={handleComponentClose}
        />
      )}
      {current && current.method === "eth_signTypedData_v4" && (
        <RequestEthSignTypedDataV4
          dAppRequest={current.request}
          onComplete={handleRequestComplete}
          onClose={handleComponentClose}
        />
      )}
      {current && current.method === "unsupport_method" && (
        <RequestUnsupport
          dAppRequest={current.request}
          onClose={handleComponentClose}
        />
      )}
    </Drawer>
  );
};
