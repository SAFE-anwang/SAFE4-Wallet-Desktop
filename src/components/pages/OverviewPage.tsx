import React from "react";
import {Breadcrumb, Layout} from "antd";
import {BreadcrumbItemType} from "antd/es/breadcrumb/Breadcrumb";

const {Content} = Layout;

export const OverviewPage: React.FC = () => {
  const items: BreadcrumbItemType[] = [
    {title: "Overview"}
  ];

  return (
    <Layout style={{padding: "0 24px 24px"}}>
      <Breadcrumb style={{margin: '16px 0'}} items={items}/>
      <Content
        style={{
          padding: 24,
          margin: 0,
          minHeight: 280,
          background: "#FFFFFF",
        }}
      >
        <div>wallet overview</div>
      </Content>
    </Layout>
  );
}