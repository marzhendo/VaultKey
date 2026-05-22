import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { StatusBar } from "./StatusBar";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="app-shell">
      <div className="title-bar" data-tauri-drag-region="true">
        <span className="title-bar-label">VaultKey</span>
      </div>
      <div className="app-main-layout">
        <Sidebar />
        <div className="app-content-area">
          <TopBar />
          <main className="app-main-content">{children}</main>
          <StatusBar />
        </div>
      </div>
    </div>
  );
};
