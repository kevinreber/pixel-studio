import React from "react";

type PageContainerTypes = {
  children: React.ReactNode;
  styles?: React.CSSProperties;
  className?: string | undefined;
};

/**
 * @description
 * General Page Container for content that is displayed in the main content area to the right side of the left sidebar.
 */
const PageContainer = ({
  children,
  styles = {},
  className = "",
}: PageContainerTypes) => {
  return (
    <div
      className={`flex flex-col mx-auto w-11/12 mt-20 md:mt-6 ${className}`}
      style={styles}
    >
      {children}
    </div>
  );
};

export default PageContainer;
