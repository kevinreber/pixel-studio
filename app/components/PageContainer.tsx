import React from "react";
import { useLocation } from "@remix-run/react";

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
  const location = useLocation();
  const isHome = location.pathname === "/";
  const navigationSidebarPadding = isHome ? "" : "md:pl-64";

  return (
    <div
      className={`flex flex-col mx-auto w-11/12 mt-24 pt-4 pb-20 md:mt-6 ${className} ${navigationSidebarPadding}`}
      style={styles}
    >
      {children}
    </div>
  );
};

export { PageContainer };
