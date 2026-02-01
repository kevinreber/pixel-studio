import React from "react";
import PixelStudioIcon from "components/PixelStudioIcon";
import { Link } from "@remix-run/react";
import { Search, PenTool, User, Users, Images, Heart, Video, Rss, Shield } from "lucide-react";
import { UserAvatarButton } from "./UserAvatarButton";
import { useLoggedInUser } from "~/hooks";
import { NotificationDropdown } from "./NotificationDropdown";
import { isUserAdmin, type UserWithRoles } from "~/utils/isAdmin";

const NavButton = ({
  title,
  icon,
  link,
  ...props
}: {
  title: string;
  icon: React.ReactElement;
  link: string;
}) => (
  <Link
    to={link}
    prefetch="intent"
    className="w-full flex items-center px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium"
    {...props}
  >
    {icon}
    <span className="ml-2">{title}</span>
  </Link>
);

const MobileNavLink = ({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactElement;
  title: string;
}) => {
  // Clone the icon with consistent sizing
  const styledIcon = React.cloneElement(icon, {
    className: "w-5 h-5",
  });

  return (
    <Link
      to={href}
      prefetch="intent"
      className="flex flex-col items-center justify-center min-w-[56px] py-1.5 px-2 rounded-xl text-gray-400 hover:text-white hover:bg-zinc-800/50 active:bg-zinc-700/50 transition-all"
    >
      <span className="mb-0.5">{styledIcon}</span>
      <span className="text-[10px] font-medium truncate max-w-[56px]">{title}</span>
    </Link>
  );
};

const NavigationSidebar = () => {
  // const userData = React.useContext(UserContext);
  const userData = useLoggedInUser();
  const isLoggedIn = Boolean(userData?.id);
  const isAdmin = isUserAdmin(userData as UserWithRoles);

  const NAV_LINKS = [
    {
      title: "Explore",
      icon: <Search className="md:h-4 md:w-4" />,
      href: "/explore",
    },
    {
      title: "Users",
      icon: <Users className="md:h-4 md:w-4" />,
      href: "/users",
    },
    {
      title: "Feed",
      icon: <Rss className="md:h-4 md:w-4" />,
      href: "/feed",
    },
    {
      title: "Create",
      icon: <PenTool className="md:h-4 md:w-4" />,
      href: "/create",
    },
    {
      title: "Create Video",
      icon: <Video className="md:h-4 md:w-4" />,
      href: "/create-video",
    },
    {
      title: "Sets",
      icon: <Images className="md:h-4 md:w-4" />,
      href: "/sets",
    },
    {
      title: "Liked",
      icon: <Heart className="md:h-4 md:w-4" />,
      href: "/likes",
    },
    // {
    //   title: "Collections",
    //   icon: <Layers className="md:h-4 md:w-4" />,
    //   href: "/collections",
    // },
    {
      title: "Profile",
      icon: <User className="md:h-4 md:w-4" />,
      href: `/profile/${userData?.id || ""}`,
    },
    // ! TODO: Hide for now, get barebones out first
    // {
    //   title: "Manage",
    //   icon: <Settings className="md:h-4 md:w-4" />,
    //   href: "/manage",
    // },
  ];

  // Add admin link for admin users
  const adminLink = {
    title: "Admin",
    icon: <Shield className="md:h-4 md:w-4" />,
    href: "/admin",
  };

  const navLinksToRender = isLoggedIn
    ? isAdmin
      ? [...NAV_LINKS, adminLink]
      : NAV_LINKS
    : [];

  return (
    <>
      {/* <div className="flex h-screen bg-black text-white"> */}
      <aside className="hidden md:flex flex-col w-64 p-4 border-r h-screen fixed top-0 left-0 bottom-0 z-10 text-xl">
        {/* <aside className="flex flex-col w-64 bg-[#111] p-4"> */}
        <div className="flex items-center mb-8">
          <div className="flex align-baseline">
            <div className="w-8 mr-3">
              <PixelStudioIcon />
            </div>
            <h2 className="text-2xl m-0">Pixel Studio</h2>
          </div>
        </div>

        <nav className="flex-1 space-y-1 font-medium">
          {navLinksToRender.map((link) => (
            <NavButton
              key={link.href}
              title={link.title}
              icon={link.icon}
              link={link.href}
            />
          ))}
        </nav>
        {isLoggedIn && (
          <div className="mt-auto pt-4 space-y-1">
            <NotificationDropdown showLabel />
            <UserAvatarButton />
          </div>
        )}
      </aside>
      {/* Mobile View **********************/}
      {/* Mobile Top Navigation */}
      <div className="md:hidden">
        <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-black/95 backdrop-blur-md py-3 px-4 border-b border-zinc-800/80">
          <Link to="/" prefetch="intent" className="flex items-center gap-2">
            <div className="w-7">
              <PixelStudioIcon />
            </div>
            <h2 className="text-xl font-semibold m-0">Pixel Studio</h2>
          </Link>
          {isLoggedIn && (
            <div className="flex items-center gap-1">
              <NotificationDropdown />
              <UserAvatarButton />
            </div>
          )}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-black/95 backdrop-blur-md border-t border-zinc-800/80 pb-safe">
          <nav className="flex items-center justify-around px-2 py-2">
            {navLinksToRender.slice(0, 5).map((link) => (
              <MobileNavLink key={link.href} href={link.href} icon={link.icon} title={link.title} />
            ))}
            {navLinksToRender.length > 5 && (
              <MobileNavLink href="/profile" icon={<User className="w-5 h-5" />} title="Profile" />
            )}
          </nav>
        </div>
      </div>
    </>
  );
};

export default NavigationSidebar;
