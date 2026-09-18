import { LeftOutlined, SendOutlined } from "@ant-design/icons"
import { Alert, Button, Card, Col, Divider, Input, Row, Typography, message } from "antd"
import { useNavigate } from "react-router-dom";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useTranslation } from "react-i18next";
import { useWeb3React } from "@web3-react/core";
import { useState } from "react";
import { useDAppManagerContract, useMulticallContract } from "../../../hooks/useContracts";
import { ethers } from "ethers";
import EstimateTx from "../../../utils/EstimateTx";
import useTransactionResponseRender from "../../components/useTransactionResponseRender";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import CallMulticallAggregate, { CallMulticallAggregateContractCall, SyncCallMulticallAggregate } from "../../../state/multicall/CallMulticallAggregate";
import { useDispatch } from "react-redux";
import { applicationUpdateWalletTab } from "../../../state/application/action";

const { Title, Text } = Typography;

// 表单字段类型定义（提前，供 VALIDATORS / REQUIRED_FIELDS 使用）
type FormState = {
  name: string;
  run_url: string;
  official_url: string;
  contract_addr: string;
  git_url: string;
  official_email: string;
  description: string;
};

// 计算 UTF-8 字节数，与 Solidity 的 bytes(str).length 对齐
const utf8Len = (s: string) => new TextEncoder().encode(s).length;

// 判断是否以 https:// 开头
const isHttpsUrl = (v: string) => /^https:\/\/.+/i.test(v);

// 各字段校验规则，与合约中的 require 保持一致
// 返回空字符串表示校验通过；返回非空字符串表示错误信息
const VALIDATORS = {
  name: (v: string) => {
    if (!v) return "请输入应用名称";
    return utf8Len(v) >= 5 && utf8Len(v) <= 50
      ? "" : "应用名称长度需在 5 到 50 个字节之间";
  },

  run_url: (v: string) => {
    if (!v) return "请输入应用链接";
    if (!isHttpsUrl(v)) return "应用链接必须以 https:// 开头";
    return utf8Len(v) >= 15 && utf8Len(v) <= 200
      ? "" : "应用链接长度需在 15 到 200 个字节之间";
  },

  description: (v: string) => {
    if (!v) return "请输入应用描述";
    return utf8Len(v) >= 10 && utf8Len(v) <= 1024
      ? "" : "应用描述长度需在 10 到 1024 个字节之间";
  },

  git_url: (v: string) => {
    // git_url 可选，允许为空；非空时必须 https://
    if (v && !isHttpsUrl(v)) return "Git 地址必须以 https:// 开头";
    return utf8Len(v) <= 200 ? "" : "Git 地址长度不能超过 200 个字节";
  },

  official_url: (v: string) => {
    // official_url 可选，允许为空；非空时必须 https://
    if (v && !isHttpsUrl(v)) return "官方网站必须以 https:// 开头";
    return utf8Len(v) <= 200 ? "" : "官方网站长度不能超过 200 个字节";
  },

  official_email: (v: string) => {
    if (utf8Len(v) > 50) return "联系邮箱长度不能超过 50 个字节";
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "请输入合法的邮箱地址";
    return "";
  },

  contract_addr: (v: string) => {
    if (!v) return "请输入合约地址";
    if (!ethers.utils.isAddress(v)) return "请输入合法的合约地址";
    return "";
  },
};

// 必填字段列表（用于渲染 * 标识）
const REQUIRED_FIELDS: (keyof FormState)[] = ["name", "run_url", "contract_addr", "description"];

export default () => {

  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { chainId, provider } = useWeb3React();
  const navigate = useNavigate();
  const activeAccount = useWalletsActiveAccount();
  const multicallContract = useMulticallContract();
  const dAppManagerContract = useDAppManagerContract();
  const {
    render,
    setTransactionResponse,
    setErr,
  } = useTransactionResponseRender();
  const [sending, setSending] = useState<boolean>(false);
  const addTransaction = useTransactionAdder();
  const [txHash, setTxHash] = useState<string | undefined>(undefined);

  const [form, setForm] = useState<FormState>({
    name: "",
    run_url: "",
    official_url: "",
    contract_addr: "",
    git_url: "",
    official_email: "",
    description: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // 更新字段并实时校验：校验通过则清除该字段错误，不通过则显示错误
  const handleChange = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    const err = VALIDATORS[field](value);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[field] = err;
      } else {
        delete next[field]; // 校验通过，清除该字段的错误
      }
      return next;
    });
  };

  // 提交前整体校验
  const validateAll = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    (Object.keys(VALIDATORS) as (keyof FormState)[]).forEach((field) => {
      const err = VALIDATORS[field](form[field]);
      if (err) nextErrors[field] = err;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // 关闭交易结果弹窗 / 重置状态

  const handleSubmit = async () => {
    if (!validateAll()) {
      return;
    }
    if (!dAppManagerContract || !chainId || !provider) {
      return;
    }
    setSending(true);
    try {
      // 通过访问合约判断数据的唯一性;
      const nameExistCall: CallMulticallAggregateContractCall = {
        contract: dAppManagerContract,
        functionName: "existName",
        params: [form.name]
      };
      const contractAddrExistCall: CallMulticallAggregateContractCall = {
        contract: dAppManagerContract,
        functionName: "existContractAddr",
        params: [form.contract_addr]
      };
      const runUrlExistCall: CallMulticallAggregateContractCall = {
        contract: dAppManagerContract,
        functionName: "existRunUrl",
        params: [form.run_url]
      };
      await SyncCallMulticallAggregate(multicallContract, [
        nameExistCall, contractAddrExistCall, runUrlExistCall
      ]);
      if (nameExistCall.result || contractAddrExistCall.result || runUrlExistCall.result) {
        // 设置对应的错误信息;
        // 分别判断，把错误设置到对应字段
        const uniqueErrors: Partial<Record<keyof FormState, string>> = {};
        if (nameExistCall.result) {
          uniqueErrors.name = "该应用名称已被注册";
        }
        if (contractAddrExistCall.result) {
          uniqueErrors.contract_addr = "该合约地址已被注册";
        }
        if (runUrlExistCall.result) {
          uniqueErrors.run_url = "该应用链接已被注册";
        }
        if (Object.keys(uniqueErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...uniqueErrors }));
          return;
        }
      }
      // 唯一性检查通过，清理可能残留的错误
      setErrors({});

      // 注意合约 register 参数顺序：
      // register(name, contract_addr, run_url, description, git_url, official_url, official_email)
      const data = dAppManagerContract.interface.encodeFunctionData("register", [
        form.name,
        form.contract_addr,
        form.run_url,
        form.description,
        form.git_url,
        form.official_url,
        form.official_email
      ]);

      let tx: ethers.providers.TransactionRequest = {
        to: dAppManagerContract.address,
        data,
        value: ethers.utils.parseEther("0"),
        chainId
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider);

      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );

      if (error) {
        setErr(error);
        return;
      }

      if (signedTx) {
        const response = await provider.sendTransaction(signedTx);
        const { hash, data: responseData } = response;
        setTransactionResponse(response);
        addTransaction({ to: dAppManagerContract.address }, response, {
          call: {
            from: activeAccount,
            to: dAppManagerContract.address,
            input: responseData,
            value: ethers.utils.parseEther("0").toString()
          }
        });
        setTxHash(hash);
      }
    } catch (err) {
      setErr(err);
    } finally {
      setSending(false);
    }
  };

  // 渲染字段标签：必填项加红色 *
  const renderLabel = (field: keyof FormState, label: string) => (
    <Text type='secondary'>
      {REQUIRED_FIELDS.includes(field) && <Text type="danger">*</Text>}
      {label}
    </Text>
  );

  const onClose = () => {
    if (txHash) {
      dispatch(applicationUpdateWalletTab("history"));
      navigate("/main/wallet");
    } else {
      navigate("/main/dapps");
    }
  }

  return <>

    <Row style={{ height: "50px" }}>
      <Col span={12}>
        <Button style={{ marginTop: "14px", marginRight: "12px", float: "left" }} size="large" shape="circle" icon={<LeftOutlined />} onClick={() => {
          navigate("/main/dapps")
        }} />
        <Title level={4} style={{ lineHeight: "16px" }}>
          注册应用
        </Title>
      </Col>
    </Row>


    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <div style={{ width: "50%", margin: "auto", marginTop: "20px" }}>

          <Row>
            {renderLabel("name", "应用名称")}
            <Col span={24}>
              <Input
                style={{ marginTop: "5px" }}
                value={form.name}
                status={errors.name ? "error" : ""}
                onChange={handleChange("name")}
              />
              {
                errors.name &&
                <Alert style={{ marginTop: "5px" }} showIcon type="error" message={errors.name} />
              }
            </Col>
          </Row>

          <Row style={{ marginTop: "10px" }}>
            {renderLabel("run_url", "应用链接")}
            <Col span={24}>
              <Input
                style={{ marginTop: "5px" }}
                placeholder="https://"
                value={form.run_url}
                status={errors.run_url ? "error" : ""}
                onChange={handleChange("run_url")}
              />
              {
                errors.run_url &&
                <Alert style={{ marginTop: "5px" }} showIcon type="error" message={errors.run_url} />
              }
            </Col>
          </Row>

          <Row style={{ marginTop: "10px" }}>
            {renderLabel("official_url", "官方网站")}
            <Col span={24}>
              <Input
                style={{ marginTop: "5px" }}
                placeholder="https://"
                value={form.official_url}
                status={errors.official_url ? "error" : ""}
                onChange={handleChange("official_url")}
              />
              {
                errors.official_url &&
                <Alert style={{ marginTop: "5px" }} showIcon type="error" message={errors.official_url} />
              }
            </Col>
          </Row>

          <Row style={{ marginTop: "10px" }}>
            {renderLabel("git_url", "Git 地址")}
            <Col span={24}>
              <Input
                style={{ marginTop: "5px" }}
                placeholder="https://"
                value={form.git_url}
                status={errors.git_url ? "error" : ""}
                onChange={handleChange("git_url")}
              />
              {
                errors.git_url &&
                <Alert style={{ marginTop: "5px" }} showIcon type="error" message={errors.git_url} />
              }
            </Col>
          </Row>

          <Row style={{ marginTop: "10px" }}>
            {renderLabel("contract_addr", "合约地址")}
            <Col span={24}>
              <Input
                style={{ marginTop: "5px" }}
                value={form.contract_addr}
                status={errors.contract_addr ? "error" : ""}
                onChange={handleChange("contract_addr")}
              />
              {
                errors.contract_addr &&
                <Alert style={{ marginTop: "5px" }} showIcon type="error" message={errors.contract_addr} />
              }
            </Col>
          </Row>

          <Row style={{ marginTop: "10px" }}>
            {renderLabel("official_email", "联系邮箱")}
            <Col span={24}>
              <Input
                style={{ marginTop: "5px" }}
                value={form.official_email}
                status={errors.official_email ? "error" : ""}
                onChange={handleChange("official_email")}
              />
              {
                errors.official_email &&
                <Alert style={{ marginTop: "5px" }} showIcon type="error" message={errors.official_email} />
              }
            </Col>
          </Row>

          <Row style={{ marginTop: "10px" }}>
            {renderLabel("description", "应用描述")}
            <Col span={24}>
              <Input.TextArea
                style={{ marginTop: "5px" }}
                rows={4}
                value={form.description}
                status={errors.description ? "error" : ""}
                onChange={handleChange("description")}
              />
              {
                errors.description &&
                <Alert style={{ marginTop: "5px" }} showIcon type="error" message={errors.description} />
              }
            </Col>
          </Row>
          <Divider />
          {
            render
          }
          <Row style={{ width: "100%", textAlign: "right" }}>
            <Col span={24}>
              {
                !sending && !render && <Button icon={<SendOutlined />} onClick={handleSubmit}
                  disabled={sending} type="primary" style={{ float: "right" }}>
                  {t("wallet_send_status_broadcast")}
                </Button>
              }
              {
                sending && !render && <Button loading disabled type="primary" style={{ float: "right" }}>
                  {t("wallet_send_status_sending")}
                </Button>
              }
              {
                render && <Button onClick={onClose} type="primary" style={{ float: "right" }}>
                  {t("wallet_send_status_close")}
                </Button>
              }
            </Col>
          </Row>

        </div>
      </Card>
    </Row>
  </>

}
