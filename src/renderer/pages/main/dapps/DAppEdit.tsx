import { SendOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Divider, Input, Row, Typography, message } from "antd";
import { useState } from "react";
import { isAddress } from "@ethersproject/address";
import { useDAppManagerContract, useMulticallContract } from "../../../hooks/useContracts";
import { ethers } from "ethers";
import EstimateTx from "../../../utils/EstimateTx";
import { useTransactionAdder } from "../../../state/transactions/hooks";
import {
  CallMulticallAggregateContractCall,
  SyncCallMulticallAggregate,
} from "../../../state/multicall/CallMulticallAggregate";
import { useWalletsActiveAccount } from "../../../state/wallets/hooks";
import { useWeb3React } from "@web3-react/core";
import { DAppInfo } from "../../../structs/DApp";

const { Text } = Typography;

// ---------------- 类型定义 ----------------
type FormState = {
  name: string;
  run_url: string;
  official_url: string;
  contract_addr: string;
  git_url: string;
  official_email: string;
  description: string;
};

type UpdateField =
  | "name"
  | "contract_addr"
  | "run_url"
  | "description"
  | "git_url"
  | "official_url"
  | "official_email";

export interface TxExecuteStatus {
  txHash?: string;
  status: number; // 0=失败, 1=成功广播
  error?: any;
}

type UpdatesState = Partial<Record<UpdateField, TxExecuteStatus>>;

// 字段中文名映射（用于汇总展示）
const FIELD_LABELS: Record<UpdateField, string> = {
  name: "应用名称",
  contract_addr: "合约地址",
  run_url: "应用链接",
  description: "应用描述",
  git_url: "Git 地址",
  official_url: "官方网站",
  official_email: "联系邮箱",
};

// ---------------- 校验工具 ----------------
const utf8Len = (s: string) => new TextEncoder().encode(s).length;
const isHttpsUrl = (v: string) => /^https:\/\/.+/i.test(v);

const VALIDATORS: Record<keyof FormState, (v: string) => string> = {
  name: (v) => {
    if (!v) return "请输入应用名称";
    return utf8Len(v) >= 5 && utf8Len(v) <= 50 ? "" : "应用名称长度需在 5 到 50 个字节之间";
  },
  run_url: (v) => {
    if (!v) return "请输入应用链接";
    if (!isHttpsUrl(v)) return "应用链接必须以 https:// 开头";
    return utf8Len(v) >= 15 && utf8Len(v) <= 200 ? "" : "应用链接长度需在 15 到 200 个字节之间";
  },
  description: (v) => {
    if (!v) return "请输入应用描述";
    return utf8Len(v) >= 10 && utf8Len(v) <= 1024 ? "" : "应用描述长度需在 10 到 1024 个字节之间";
  },
  git_url: (v) => {
    if (!v) return "";
    if (!isHttpsUrl(v)) return "Git 地址必须以 https:// 开头";
    return utf8Len(v) >= 20 && utf8Len(v) <= 200 ? "" : "Git 地址长度需在 20 到 200 个字节之间";
  },
  official_url: (v) => {
    if (!v) return "";
    if (!isHttpsUrl(v)) return "官方网站必须以 https:// 开头";
    return utf8Len(v) >= 15 && utf8Len(v) <= 200 ? "" : "官方网站长度需在 15 到 200 个字节之间";
  },
  official_email: (v) => {
    if (!v) return "";
    if (utf8Len(v) < 5 || utf8Len(v) > 50) return "联系邮箱长度需在 5 到 50 个字节之间";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "请输入合法的邮箱地址";
    return "";
  },
  contract_addr: (v) => {
    if (!v) return "请输入合约地址";
    if (!isAddress(v)) return "请输入合法的合约地址";
    return "";
  },
};

const REQUIRED_FIELDS: (keyof FormState)[] = ["name", "run_url", "contract_addr", "description"];

// ---------------- 组件 ----------------
export default function DAppEdit({
  dAppInfo,
  onClose,
}: {
  dAppInfo: DAppInfo;
  onClose: () => void;
}) {
  const { chainId, provider } = useWeb3React();
  const activeAccount = useWalletsActiveAccount();
  const multicallContract = useMulticallContract();
  const dAppManagerContract = useDAppManagerContract();
  const addTransaction = useTransactionAdder();

  const [sending, setSending] = useState(false);
  const [updates, setUpdates] = useState<UpdatesState>({});

  const [form, setForm] = useState<FormState>({
    name: dAppInfo.name ?? "",
    run_url: dAppInfo.runUrl ?? "",
    official_url: dAppInfo.officialUrl ?? "",
    contract_addr: dAppInfo.contractAddress ?? "",
    git_url: dAppInfo.gitUrl ?? "",
    official_email: dAppInfo.officiaEmail ?? "",
    description: dAppInfo.description ?? "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      const err = VALIDATORS[field](value);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field] = err;
        else delete next[field];
        return next;
      });
    };

  const validateAll = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    (Object.keys(VALIDATORS) as (keyof FormState)[]).forEach((f) => {
      const err = VALIDATORS[f](form[f]);
      if (err) nextErrors[f] = err;
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field: UpdateField, status: TxExecuteStatus) => {
    setUpdates((prev) => ({ ...prev, [field]: status }));
  };

  const submitField = async (
    field: UpdateField,
    contractFn: string,
    params: any[]
  ): Promise<boolean> => {
    if (!dAppManagerContract || !chainId || !provider) return false;

    try {
      const data = dAppManagerContract.interface.encodeFunctionData(contractFn, params);

      let tx: ethers.providers.TransactionRequest = {
        to: dAppManagerContract.address,
        data,
        value: ethers.utils.parseEther("0"),
        chainId,
      };
      tx = await EstimateTx(activeAccount, chainId, tx, provider);

      const { signedTx, error } = await window.electron.wallet.signTransaction(
        activeAccount,
        tx
      );

      if (error) {
        updateField(field, { status: 0, error });
        return false;
      }
      if (!signedTx) {
        updateField(field, { status: 0, error: { reason: "签名失败" } });
        return false;
      }

      const response = await provider.sendTransaction(signedTx);
      const { hash, data: responseData } = response;

      updateField(field, { status: 1, txHash: hash });

      addTransaction({ to: dAppManagerContract.address }, response, {
        call: {
          from: activeAccount,
          to: dAppManagerContract.address,
          input: responseData,
          value: "0",
        },
      });

      return true;
    } catch (err: any) {
      updateField(field, {
        status: 0,
        error: err?.error ?? err ?? { reason: "未知错误" },
      });
      return false;
    }
  };

  const buildChanges = (): { field: UpdateField; fn: string; params: any[] }[] => {
    const id = dAppInfo.id;
    const changes: { field: UpdateField; fn: string; params: any[] }[] = [];

    if (form.name !== dAppInfo.name) {
      changes.push({ field: "name", fn: "setName", params: [id, form.name] });
    }
    if (form.contract_addr !== dAppInfo.contractAddress) {
      changes.push({
        field: "contract_addr",
        fn: "setContractAddr",
        params: [id, form.contract_addr],
      });
    }
    if (form.run_url !== dAppInfo.runUrl) {
      changes.push({ field: "run_url", fn: "setRunUrl", params: [id, form.run_url] });
    }
    if (form.description !== dAppInfo.description) {
      changes.push({
        field: "description",
        fn: "setDescription",
        params: [id, form.description],
      });
    }
    if (form.git_url !== dAppInfo.gitUrl) {
      changes.push({ field: "git_url", fn: "setGitUrl", params: [id, form.git_url] });
    }
    if (form.official_url !== dAppInfo.officialUrl) {
      changes.push({
        field: "official_url",
        fn: "setOfficialUrl",
        params: [id, form.official_url],
      });
    }
    if (form.official_email !== dAppInfo.officiaEmail) {
      changes.push({
        field: "official_email",
        fn: "setOfficialEmail",
        params: [id, form.official_email],
      });
    }
    return changes;
  };

  const checkUnique = async (): Promise<boolean> => {
    if (!dAppManagerContract || !multicallContract) return false;

    const calls: CallMulticallAggregateContractCall[] = [];
    let nameCall: CallMulticallAggregateContractCall | undefined;
    let addrCall: CallMulticallAggregateContractCall | undefined;
    let runUrlCall: CallMulticallAggregateContractCall | undefined;

    if (form.name !== dAppInfo.name) {
      nameCall = {
        contract: dAppManagerContract,
        functionName: "existName",
        params: [form.name],
      };
      calls.push(nameCall);
    }
    if (form.contract_addr !== dAppInfo.contractAddress) {
      addrCall = {
        contract: dAppManagerContract,
        functionName: "existContractAddr",
        params: [form.contract_addr],
      };
      calls.push(addrCall);
    }
    if (form.run_url !== dAppInfo.runUrl) {
      runUrlCall = {
        contract: dAppManagerContract,
        functionName: "existRunUrl",
        params: [form.run_url],
      };
      calls.push(runUrlCall);
    }
    if (calls.length === 0) return true;

    try {
      await SyncCallMulticallAggregate(multicallContract, calls);
    } catch {
      return true;
    }

    const uniqueErrors: Partial<Record<keyof FormState, string>> = {};
    if (nameCall?.result) uniqueErrors.name = "该应用名称已被注册";
    if (addrCall?.result) uniqueErrors.contract_addr = "该合约地址已被注册";
    if (runUrlCall?.result) uniqueErrors.run_url = "该应用链接已被注册";

    if (Object.keys(uniqueErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...uniqueErrors }));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAll()) return;
    if (!dAppManagerContract || !chainId || !provider) return;

    if (
      dAppInfo.officiaAccount &&
      activeAccount.toLowerCase() !== dAppInfo.officiaAccount.toLowerCase()
    ) {
      message.error("当前账户不是该应用的官方账号，无法修改");
      return;
    }
    if (dAppInfo.isFrozen) {
      message.error("该应用已冻结，无法修改");
      return;
    }

    const changes = buildChanges();
    if (changes.length === 0) {
      message.info("没有需要修改的内容");
      return;
    }

    const uniqueOk = await checkUnique();
    if (!uniqueOk) return;

    setSending(true);
    setUpdates({});

    try {
      for (const change of changes) {
        await submitField(change.field, change.fn, change.params);
      }
    } finally {
      setSending(false);
    }
  };

  const renderLabel = (field: keyof FormState, label: string) => (
    <Text type="secondary">
      {REQUIRED_FIELDS.includes(field) && <Text type="danger">*</Text>}
      {label}
    </Text>
  );

  const allDone =
    Object.keys(updates).length > 0 &&
    !sending &&
    Object.values(updates).every((u) => u?.status === 1 || u?.status === 0);

  const hasError = Object.values(updates).some((u) => u?.status === 0);

  return (
    <div>
      {/* 应用名称 */}
      <Row>
        {renderLabel("name", "应用名称")}
        <Col span={24}>
          <Input
            style={{ marginTop: 5 }}
            value={form.name}
            status={errors.name ? "error" : ""}
            onChange={handleChange("name")}
          />
          {errors.name && (
            <Alert style={{ marginTop: 5 }} showIcon type="error" message={errors.name} />
          )}
        </Col>
      </Row>

      {/* 应用链接 */}
      <Row style={{ marginTop: 10 }}>
        {renderLabel("run_url", "应用链接")}
        <Col span={24}>
          <Input
            style={{ marginTop: 5 }}
            placeholder="https://"
            value={form.run_url}
            status={errors.run_url ? "error" : ""}
            onChange={handleChange("run_url")}
          />
          {errors.run_url && (
            <Alert style={{ marginTop: 5 }} showIcon type="error" message={errors.run_url} />
          )}
        </Col>
      </Row>

      {/* 官方网站 */}
      <Row style={{ marginTop: 10 }}>
        {renderLabel("official_url", "官方网站")}
        <Col span={24}>
          <Input
            style={{ marginTop: 5 }}
            placeholder="https://"
            value={form.official_url}
            status={errors.official_url ? "error" : ""}
            onChange={handleChange("official_url")}
          />
          {errors.official_url && (
            <Alert style={{ marginTop: 5 }} showIcon type="error" message={errors.official_url} />
          )}
        </Col>
      </Row>

      {/* Git 地址 */}
      <Row style={{ marginTop: 10 }}>
        {renderLabel("git_url", "Git 地址")}
        <Col span={24}>
          <Input
            style={{ marginTop: 5 }}
            placeholder="https://"
            value={form.git_url}
            status={errors.git_url ? "error" : ""}
            onChange={handleChange("git_url")}
          />
          {errors.git_url && (
            <Alert style={{ marginTop: 5 }} showIcon type="error" message={errors.git_url} />
          )}
        </Col>
      </Row>

      {/* 合约地址 */}
      <Row style={{ marginTop: 10 }}>
        {renderLabel("contract_addr", "合约地址")}
        <Col span={24}>
          <Input
            style={{ marginTop: 5 }}
            value={form.contract_addr}
            status={errors.contract_addr ? "error" : ""}
            onChange={handleChange("contract_addr")}
          />
          {errors.contract_addr && (
            <Alert style={{ marginTop: 5 }} showIcon type="error" message={errors.contract_addr} />
          )}
        </Col>
      </Row>

      {/* 联系邮箱 */}
      <Row style={{ marginTop: 10 }}>
        {renderLabel("official_email", "联系邮箱")}
        <Col span={24}>
          <Input
            style={{ marginTop: 5 }}
            value={form.official_email}
            status={errors.official_email ? "error" : ""}
            onChange={handleChange("official_email")}
          />
          {errors.official_email && (
            <Alert style={{ marginTop: 5 }} showIcon type="error" message={errors.official_email} />
          )}
        </Col>
      </Row>

      {/* 应用描述 */}
      <Row style={{ marginTop: 10 }}>
        {renderLabel("description", "应用描述")}
        <Col span={24}>
          <Input.TextArea
            style={{ marginTop: 5 }}
            rows={4}
            value={form.description}
            status={errors.description ? "error" : ""}
            onChange={handleChange("description")}
          />
          {errors.description && (
            <Alert style={{ marginTop: 5 }} showIcon type="error" message={errors.description} />
          )}
        </Col>
      </Row>

      {/* ------- 交易结果统一汇总 ------- */}
      {Object.keys(updates).length > 0 && (
        <Alert
          style={{ marginTop: 20, marginBottom: 20 }}
          type={hasError ? "error" : "success"}
          message="交易执行结果"
          description={
            <Row>
              {(Object.keys(updates) as UpdateField[]).map((field) => {
                const st = updates[field];
                if (!st) return null;
                return (
                  <Col span={24} key={field} style={{ marginTop: 6 }}>
                    <Text type="secondary">更新{FIELD_LABELS[field]}</Text>
                    <br />
                    {st.status === 1 && (
                      <Text strong type="success">
                        {st.txHash}
                      </Text>
                    )}
                    {st.status === 0 && (
                      <Text strong type="danger">
                        错误:{st.error?.reason ?? String(st.error)}
                      </Text>
                    )}
                  </Col>
                );
              })}
            </Row>
          }
        />
      )}

      <Divider />

      <Row style={{ width: "100%", textAlign: "right" }}>
        <Col span={24}>
          {!sending && !allDone && (
            <Button
              icon={<SendOutlined />}
              onClick={handleSubmit}
              disabled={sending}
              type="primary"
              style={{ float: "right" }}
            >
              提交修改
            </Button>
          )}
          {sending && (
            <Button loading disabled type="primary" style={{ float: "right" }}>
              发送中...
            </Button>
          )}
          {allDone && (
            <Button onClick={onClose} type="primary" style={{ float: "right" }}>
              关闭
            </Button>
          )}
        </Col>
      </Row>
    </div>
  );
}
