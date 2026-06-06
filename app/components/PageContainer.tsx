import React from "react";

type PageContainerTypes = {
  children: React.ReactNode;
  styles?: React.CSSProperties;
  className?: string | undefined;
};

/**
 * Page container — the redesign's AppShell already supplies the sidebar
 * offset, top bar, and max-width gutter, so this is now a thin
 * vertical-rhythm wrapper used by individual pages.
 */
const PageContainer = ({
  children,
  styles = {},
  className = "",
}: PageContainerTypes) => {
  return (
    <div
      className={`flex flex-col py-6 md:py-10 ${className}`.trim()}
      style={styles}
    >
      {children}
    </div>
  );
};

export { PageContainer };
