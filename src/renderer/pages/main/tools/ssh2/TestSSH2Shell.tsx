import { useCallback, useEffect, useMemo, useState } from "react"
import { Alert, Button, Card, Col, Divider, Input, Radio, Row, Select, Space, Spin, Typography } from "antd";
import SSH2CMDTerminal from "../../../components/SSH2CMDTerminal";
import SSH2ShellTermial from "../../../components/SSH2ShellTermial";

const { Text, Title } = Typography

export default () => {

  return <>

    <Row style={{ marginTop: "20px", width: "100%" }}>
      <Card style={{ width: "100%" }}>
        <Row style={{ marginTop: "20px", marginBottom: "20px" , height:"800px" }}>
          <SSH2ShellTermial connectConfig={{
            host: "39.108.69.183",
            username: "root",
            password: "Zy123456!",
            port:22,
          }} />
        </Row>
      </Card>
    </Row>

  </>

}

