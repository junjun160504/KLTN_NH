// src/components/AppTheme.js
import React from "react";
import { ConfigProvider } from "antd";

const AppTheme = ({ children }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#226533",   // màu chủ đạo
          fontSize: 16,
        },
        components: {
          Menu: {
            itemHeight: 70,
            itemSelectedBg: "#226533",
            itemSelectedColor: "#fff",
            fontSize: 16,
            iconSize: 24,
          },
          Button: {
            borderRadius: 6,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default AppTheme;
