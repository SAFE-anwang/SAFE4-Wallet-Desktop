import { useRef, useState } from "react";
import { SSH2ConnectConfig } from "../../main/SSH2Ipc";


export interface SSHCheckResult {
  id: string;
  status: "pending" | "running" | "success" | "failed";
  message?: string;
}

export const useBatchSSHCheck = (
  sshConfigs: SSH2ConnectConfig[],
  maxConcurrency: number = 1
) => {
  const [results, setResults] = useState<SSHCheckResult[]>([]);
  const queueRef = useRef<SSH2ConnectConfig[]>([]);
  const runningRef = useRef(0);

  const updateResult = (id: string, update: Partial<SSHCheckResult>) => {
    setResults(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...update } : item
      )
    );
  };

  const checkSSH = async (config: SSH2ConnectConfig) => {
    try {
      updateResult(config.host, { status: "running" });

      const connectResponse = await window.electron.sshs.connect( config.host , config.port , config.username , config.password );
      const isSuccess = true;
      console.log("Connect Response = " , connectResponse);
      window.electron.sshs.close( config.host );
      updateResult(config.host, {
        status: isSuccess ? "success" : "failed",
        message: isSuccess ? "Connected" : "Failed to connect",
      });
    } catch (err: any) {
      updateResult(config.host, {
        status: "failed",
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
        id: cfg.host,
        status: "pending",
      }))
    );
    runNext();
  };

  return { results, start };
};
