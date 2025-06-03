import { useEffect, useMemo } from "react";
import { SSH2ConnectConfig } from "../../../../main/SSH2Ipc"
import { SSHCheckPoolStatus, SSHCheckResult, SSHCheckStatus, useBatchSSHCheck } from "../../../hooks/useBatchSSHCheck";
import { Alert, Button, Col, Row, Typography } from "antd";

const { Text } = Typography;

const sshconfigs: SSH2ConnectConfig[] = [
  {
    host: "47.119.151.64",
    username: "root",
    password: "Zy654321!",
    port: 22
  },
  {
    host: "39.108.69.183",
    username: "root",
    password: "Zy654321!",
    port: 22
  },
  {
    host: "115.29.52.162",
    username: "root",
    password: "akrsluhiuY$%#hh6435354",
    port: 22
  }
];

export interface NodeSSHConfigValidateCheckResult {
  isValid: boolean,
  errMsg?: string,
}

export default ({ nodeSSHConfigMap, nodeSSHConfigValidateCheckMap, nodeSSHConfigConnectCheckMap, startToSync, setNodeSSHConfigValidateCheckMap, setNodeSSHConfigConnectCheckMap }: {

  nodeSSHConfigMap: {
    [id: string]: SSH2ConnectConfig
  },

  nodeSSHConfigValidateCheckMap: {
    [id: string]: NodeSSHConfigValidateCheckResult
  },
  nodeSSHConfigConnectCheckMap: {
    [id: string]: SSHCheckResult
  },
  startToSync: () => void,
  setNodeSSHConfigValidateCheckMap: (nodeSSHConfigValidateCheckMap: {
    [id: string]: NodeSSHConfigValidateCheckResult
  }) => void,
  setNodeSSHConfigConnectCheckMap: (nodeSSHConfigConnectCheckMap: {
    [id: string]: SSHCheckResult
  }) => void
}) => {

  useEffect(() => {
    const nodeSSHConfigValidateCheckMap: {
      [id: string]: NodeSSHConfigValidateCheckResult
    } = {};

    Object.keys(nodeSSHConfigMap).forEach(id => {
      const { host, port, username, password } = nodeSSHConfigMap[(id)];
      if (!host || !port || !username || !password) {
        nodeSSHConfigValidateCheckMap[(id)] = {
          isValid: false,
          errMsg: "SSH 连接配置信息错误"
        }
      } else {
        nodeSSHConfigValidateCheckMap[(id)] = {
          isValid: true,
        }
      }
    });
    setNodeSSHConfigValidateCheckMap(nodeSSHConfigValidateCheckMap);
  }, [nodeSSHConfigMap]);

  const { validCount, invalidCount } = useMemo(() => {
    const validCount = Object.keys(nodeSSHConfigValidateCheckMap)
      .filter(id => nodeSSHConfigValidateCheckMap[(id)].isValid).length;
    const invalidCount = Object.keys(nodeSSHConfigValidateCheckMap)
      .filter(id => !nodeSSHConfigValidateCheckMap[(id)].isValid).length;
    return {
      validCount,
      invalidCount
    }
  }, [nodeSSHConfigValidateCheckMap]);

  const HostIdMap = useMemo(() => {
    const HostIdMap: {
      [host: string]: string
    } = {};
    Object.keys(nodeSSHConfigMap).forEach(id => {
      HostIdMap[nodeSSHConfigMap[id].host] = id;
    });
    return HostIdMap;
  }, [nodeSSHConfigMap]);

  const { results, start, poolStatus } = useBatchSSHCheck(Object.values(nodeSSHConfigMap));

  useEffect(() => {
    if (results) {
      const HostCheckResultMap: {
        [host: string]: SSHCheckResult
      } = {};
      results.forEach(result => {
        HostCheckResultMap[result.host] = result;
      });
      const _nodeSSHConfigConnectCheckMap = { ...nodeSSHConfigConnectCheckMap };
      Object.keys(HostCheckResultMap).forEach(host => {
        const id = HostIdMap[host];
        const result = HostCheckResultMap[host];
        _nodeSSHConfigConnectCheckMap[id] = result;
      });
      setNodeSSHConfigConnectCheckMap({ ..._nodeSSHConfigConnectCheckMap });
    }
  }, [results, HostIdMap]);

  const { connectSuccessCount, connectFailedCount } = useMemo(() => {
    const connectSuccessCount = Object.keys(nodeSSHConfigConnectCheckMap)
      .filter(id => nodeSSHConfigConnectCheckMap[id].status == SSHCheckStatus.Success).length;
    const connectFailedCount = Object.keys(nodeSSHConfigConnectCheckMap)
      .filter(id => HostIdMap[nodeSSHConfigConnectCheckMap[id].host] && nodeSSHConfigConnectCheckMap[id].status == SSHCheckStatus.Failed).length;
    return {
      connectSuccessCount,
      connectFailedCount
    }
  }, [nodeSSHConfigConnectCheckMap]);


  const startToCheck = () => {
    start();
  }

  return <>
    <Row>
      <Col span={24}>
        <Text strong type={invalidCount > 0 ? "danger" : "success"}>1. SSH配置合法性检查</Text>
      </Col>
      {
        invalidCount > 0 && <Col span={24} style={{ marginTop: "5px" }}>
          <Alert type="error" showIcon message={<>
            <Row>
              <Col span={24}>
                <Text>未通过 SSH 配置信息合法性检查数量:{invalidCount}</Text>
              </Col>
              <Col span={24}>
                {
                  Object.keys(nodeSSHConfigValidateCheckMap)
                    .filter(id => !nodeSSHConfigValidateCheckMap[(id)].isValid)
                    .map(id => {
                      const nodeSSHConfigValidateCheck = nodeSSHConfigValidateCheckMap[(id)];
                      return <>
                        <Row key={id}>
                          <Col span={4}>
                            <Text strong>主节点-{id}</Text>
                          </Col>
                          <Col span={18}>
                            <Text>{nodeSSHConfigValidateCheck.errMsg}</Text>
                          </Col>
                        </Row>
                      </>
                    })
                }
              </Col>
            </Row>
          </>} />
        </Col>
      }

      {
        validCount > 0 &&
        <Col span={24} style={{ marginTop: "5px" }}>
          <Alert type="success" showIcon message={<>
            <Row>
              <Col span={24}>
                <Text>已通过 SSH 配置信息合法性检查数量:{validCount}</Text>
              </Col>
            </Row>
          </>} />
        </Col>
      }
    </Row>

    {
      invalidCount == 0 && <Row style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Text strong type={(connectSuccessCount > 0 && connectFailedCount == 0) ? "success" : "danger"}>2. SSH连接有效性检查</Text>
        </Col>
        {
          connectFailedCount > 0 && <Col span={24} style={{ marginTop: "5px" }}>
            <Alert type="error" showIcon message={<>
              <Row>
                <Col span={24}>
                  <Text>无法进行 SSH 连接数量:{connectFailedCount}</Text>
                </Col>
                <Col span={24}>
                  {
                    Object.keys(nodeSSHConfigConnectCheckMap)
                      .filter(id => HostIdMap[nodeSSHConfigConnectCheckMap[id].host] && nodeSSHConfigConnectCheckMap[(id)].status == SSHCheckStatus.Failed)
                      .map(id => {
                        const nodeSSHConfigConnectCheck = nodeSSHConfigConnectCheckMap[(id)];
                        return <>
                          <Row key={id}>
                            <Col span={4}>
                              <Text strong>主节点-{HostIdMap[nodeSSHConfigConnectCheck.host]}</Text>
                            </Col>
                            <Col span={18}>
                              <Text>{nodeSSHConfigConnectCheck.message}</Text>
                            </Col>
                          </Row>
                        </>
                      })
                  }
                </Col>
              </Row>
            </>} />
          </Col>
        }
        {
          connectSuccessCount > 0 &&
          <Col span={24} style={{ marginTop: "5px" }}>
            <Alert type="success" showIcon message={<>
              <Row>
                <Col span={24}>
                  <Text>成功进行 SSH 连接数量:{connectSuccessCount}</Text>
                </Col>
              </Row>
            </>} />
          </Col>
        }
        <Col span={24} style={{ marginTop: "5px" }}>
          <Button type={connectSuccessCount > 0 && connectFailedCount == 0 ? "default" : "primary"} loading={poolStatus == SSHCheckPoolStatus.Running} onClick={startToCheck}>执行检查</Button>
        </Col>
      </Row>
    }
    {
      connectFailedCount == 0 && connectSuccessCount > 0 && poolStatus == SSHCheckPoolStatus.Finished && <Row style={{ marginTop: "20px" }}>
        <Col span={24}>
          <Text strong>3. 下一步,执行批量节点同步</Text>
        </Col>
        <Col span={24} style={{ marginTop: "5px" }}>
          <Button type="primary" onClick={startToSync}>
            批量同步
          </Button>
        </Col>
      </Row>
    }

  </>

}
