import { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { SSH2ConnectConfig } from "../../main/SSH2Ipc";
import { applicationSaveOrUpdateSSHConfigs } from "../state/application/action";

export enum SSHCheckStatus {
  Pending = "pending",
  Running = "running",
  Success = "success",
  Failed = "failed"
}

export interface SSHCheckResult {
  host: string;
  status: SSHCheckStatus;
  message?: string;
}

export const useBatchSSHCheck = (
  sshConfigs: SSH2ConnectConfig[],
  maxConcurrency: number = 2
) => {
  const [results, setResults] = useState<SSHCheckResult[]>([]);
  const queueRef = useRef<SSH2ConnectConfig[]>([]);
  const runningRef = useRef(0);
  const dispatch = useDispatch();

  const updateResult = (host: string, update: Partial<SSHCheckResult>) => {
    setResults(prev =>
      prev.map(item =>
        item.host === host ? { ...item, ...update } : item
      )
    );
  };

  const checkSSH = async (config: SSH2ConnectConfig) => {
    try {
      updateResult(config.host, { status: SSHCheckStatus.Running });
      const connectResponse = await window.electron.sshs.connect(config.host, config.port, config.username, config.password);
      const isSuccess = true;
      window.electron.sshs.close(config.host);
      updateResult(config.host, {
        status: isSuccess ? SSHCheckStatus.Success : SSHCheckStatus.Failed,
        message: isSuccess ? "Connected" : "Failed to connect",
      });
      dispatch(applicationSaveOrUpdateSSHConfigs([config]));
    } catch (err: any) {
      updateResult(config.host, {
        status: SSHCheckStatus.Failed,
        message: err.message || "Unknown error",
      });
    } finally {
      runningRef.current--;
      runNext();
    }
  };

  const runNext = () => {
    while (
      runningRef.current < maxConcurrency &&
      queueRef.current.length > 0
    ) {
      const next = queueRef.current.shift();
      if (next) {
        runningRef.current++;
        checkSSH(next);
      }
    }
  };

  const start = () => {
    queueRef.current = [...sshConfigs];
    setResults(
      sshConfigs.map(cfg => ({
        host: cfg.host,
        status: SSHCheckStatus.Pending,
      }))
    );
    runNext();
  };

  return { results, start };
};
