import React from 'react';

export interface IWorkbenchProps extends React.HTMLAttributes<HTMLDivElement> {
  renderHeader?: () => any;
  renderActivePanel?: () => any;
  renderPropertyPanel?: () => any;
  renderStatusBar?: () => any;

  headerHeight?: number;
  activePanelWidth?: number;
  propertyPanelWidth?: number;

  loading?: string;
}

export const Workbench = ({
  renderHeader,
  renderActivePanel,
  renderPropertyPanel,
  renderStatusBar,
  headerHeight: _headerHeight = 24,
  activePanelWidth: _activePanelWidth = 320,
  propertyPanelWidth: _propertyPanelWidth = 320,
  children,
  loading,
  className,
  style,
  ...containerRestProps
}: IWorkbenchProps) => {
  const headerHeight = renderHeader ? _headerHeight : 0;
  const activePanelWidth = renderActivePanel ? _activePanelWidth : 0;
  const propertyPanelWidth = renderPropertyPanel ? _propertyPanelWidth : 0;
  const statusBarHeight = renderStatusBar ? 24 : 0;

  const __renderHeader = () => {
    return (
      <header
        style={{
          position: 'absolute',
          height: headerHeight,
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1,
        }}
      >
        {renderHeader?.()}
      </header>
    );
  };

  const __renderActivePanel = () => {
    return (
      renderActivePanel && (
        <aside
          style={{
            position: 'absolute',
            top: headerHeight,
            left: 0,
            bottom: statusBarHeight,
            width: activePanelWidth,
          }}
        >
          {renderActivePanel()}
        </aside>
      )
    );
  };

  const __renderPropertyPanel = () => {
    return (
      renderPropertyPanel && (
        <aside
          style={{
            position: 'absolute',
            top: headerHeight,
            right: 0,
            bottom: statusBarHeight,
            width: propertyPanelWidth,
          }}
        >
          {renderPropertyPanel()}
        </aside>
      )
    );
  };

  const __renderMain = () => {
    return (
      <div
        style={{
          paddingLeft: activePanelWidth,
          paddingRight: propertyPanelWidth,
          paddingBottom: statusBarHeight,
          height: '100%',
        }}
      >
        {children}
      </div>
    );
  };

  const __renderStatusBar = () => {
    return (
      renderStatusBar && (
        <footer
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: statusBarHeight,
          }}
        >
          {renderStatusBar()}
        </footer>
      )
    );
  };

  const __renderLoading = () => {
    if (!loading) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '100%',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading}
      </div>
    );
  };

  return (
    <div
      data-name='Workbench'
      className={className}
      style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%', ...style }}
      {...containerRestProps}
    >
      {__renderHeader()}
      <div
        // prettier-ignore
        style={{ paddingTop: headerHeight, position: 'relative', height: '100%', width: '100%', boxSizing: 'border-box' }}
      >
        {__renderActivePanel()}
        {__renderMain()}
        {__renderPropertyPanel()}
      </div>

      {__renderStatusBar()}
      {__renderLoading()}
    </div>
  );
};
