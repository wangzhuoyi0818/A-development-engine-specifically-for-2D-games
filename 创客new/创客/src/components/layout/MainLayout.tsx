import React from 'react';
import { Layout } from 'antd';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import Workspace from './Workspace';
import { PreviewDebugPanel } from '@/components/panels';
import { useUIStore } from '@/stores';

interface MainLayoutProps {
  onExport?: () => void;
  onBack?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onExport, onBack }) => {
  const { showDebugPanel, isPlaying } = useUIStore();

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <LeftSidebar />
      <Layout style={{ display: 'flex', flexDirection: 'column' }}>
        <Header onExport={onExport} onBack={onBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Workspace />
          </div>
          {(showDebugPanel || isPlaying) && <PreviewDebugPanel />}
        </div>
      </Layout>
      <RightSidebar />
    </Layout>
  );
};

export default MainLayout;
