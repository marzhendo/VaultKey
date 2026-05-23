import React from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { StatusBar } from "./StatusBar";
import { appWindow } from "@tauri-apps/api/window";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async () => {
    try {
      await appWindow.close();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app-shell">
      <div className="title-bar" data-tauri-drag-region="true">
        <span className="title-bar-label" data-tauri-drag-region="true">VaultKey</span>
        <div className="window-controls">
          <button className="window-control-btn" onClick={handleMinimize} title="Minimize">&#8212;</button>
          <button className="window-control-btn" onClick={handleMaximize} title="Maximize">&#9633;</button>
          <button className="window-control-btn close" onClick={handleClose} title="Close">&times;</button>
        </div>
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

