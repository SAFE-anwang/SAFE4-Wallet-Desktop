
import { Collapse, Input, type CollapseProps, Alert } from 'antd';
import { Typography, Button, Card, Divider, Row, Col } from 'antd';
import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { applicationControlCompile, applicationControlDirectDeploy } from '../../../state/application/action';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

export default ({
  sourceCode, compileResult, compileOption
}: {
  sourceCode: string,
  compileResult: string,
  compileOption: {
    compileVersion: string,
    evmVersion: string,
    optimizer: {
      enabled: boolean,
      runs: number
    }
  }
}) => {

  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { contracts, errors, sources } = useMemo(() => {
    if (compileResult) {
      const compile = JSON.parse(compileResult);
      const {
        contracts, errors, sources
      } = compile;
      return {
        contracts,
        errors,
        sources
      }
    }
    return {
      contracts: undefined,
      errors: undefined,
      sources: undefined
    }
  }, [compileResult]);
  const severityErrors = useMemo(() => {
    if (errors) {
      return errors.filter((error: any) => error.severity == "error")
    }
    return undefined;
  }, [errors])

  const items = useMemo<CollapseProps['items'] | undefined>(() => {
    if (contracts && contracts["contract.sol"]) {
      return Object.keys(contracts["contract.sol"]).map((contractName) => {
        const contract = contracts["contract.sol"][contractName];
        const { abi, devdoc, evm, metadata, storageLayout, userdoc } = contract;
        const { assembly, bytecode, deployedBytecode, gasEstimates, legacyAssembly, methodIdentifiers } = evm;
        return {
          key: contractName,
          label: <Row>
            <Col span={24}>
              <Text strong>{contractName}</Text>
              <Button type='primary' onClick={(event) => {
                event.stopPropagation();
                dispatch(applicationControlDirectDeploy(false));
                dispatch(applicationControlCompile({
                  sourceCode,
                  compileResult,
                  abi: JSON.stringify(abi),
                  bytecode: bytecode.object,
                  name: contractName,
                  compileOption
                }));
                navigate("/main/contracts/deploy");
              }} size='small' style={{ float: "right" }}>
                {t("wallet_contracts_deploy_button")}
              </Button>
            </Col>
          </Row>,
          children: <Row>
            <Col span={24}>
              <Paragraph copyable={{ text: JSON.stringify(abi) }}>
                <Text type='secondary' strong>ABI</Text>
              </Paragraph>
              <Text>
                {JSON.stringify(abi)}
              </Text>
            </Col>
            <Col span={24} style={{ marginTop: "20px" }}>
              <Paragraph copyable={{ text: bytecode.object }}>
                <Text type='secondary' strong>{t("wallet_contracts_deploy_contractbytecode")}</Text>
              </Paragraph>
              <Text>
                {bytecode.object}
              </Text>
            </Col>
          </Row>,
        }
      });
    }
    return undefined;
  }, [contracts])

  return <>
    {
      severityErrors && severityErrors.length > 0 && <Alert showIcon type='error' message={<>
        {severityErrors.map((error: any) => {
          const { component, errorCode, formattedMessage, message } = error;
          return <Row key={formattedMessage}>
            <Col span={24}>
              <Text type='danger' strong>{message}</Text>
            </Col>
            <Col span={24} style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
              {formattedMessage}
            </Col>
          </Row>
        })}
      </>} />
    }
    {
      items && <Collapse items={items} />
    }
  </>
}
