import React from "react";
import PixelStudioIcon from "components/PixelStudioIcon";
import { Link } from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Layers,
  PenTool,
  User,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";
// import { useLoggedInUser } from "~/hooks";

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
  <a
    href={link}
    className="w-full flex items-center px-3 py-2 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium"
    {...props}
  >
    {icon}
    {/* </span> */}
    <span className="ml-2">{title}</span>
  </a>
);

const NavigationSidebar = () => {
  const [credits, setCredits] = React.useState(31);
  // const userData = React.useContext(UserContext);
  // const userData = useLoggedInUser();
  // const isLoggedIn = Boolean(userData?.id);
  const userData = {
    name: "John Doe",
    username: "johndoe",
  };
  const NAV_LINKS = [
    {
      title: "Explore",
      icon: <Search className="md:h-4 md:w-4" />,
      href: "/explore",
    },
    {
      title: "Collections",
      icon: <Layers className="md:h-4 md:w-4" />,
      href: "/collections",
    },
    {
      title: "Create",
      icon: <PenTool className="md:h-4 md:w-4" />,
      href: "/create",
    },
    {
      title: "Profile",
      icon: <User className="md:h-4 md:w-4" />,
      // href: `/profile/${userData?.username || ""}`,
      href: `/profile/`,
    },
    // ! TODO: Hide for now, get barebones out first
    // {
    //   title: "Manage",
    //   icon: <Settings className="md:h-4 md:w-4" />,
    //   href: "/manage",
    // },
  ];

  // const navLinksToRender = isLoggedIn ? NAV_LINKS : [];
  const navLinksToRender = NAV_LINKS;

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

        <div className="mt-auto pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                <Avatar>
                  <AvatarImage
                    src="/placeholder.svg?height=32&width=32"
                    alt="User"
                  />
                  <AvatarFallback>JS</AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <div className="font-medium">Jon Smith</div>
                  <div className="text-xs text-gray-400">jonsmith</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Jon Smith</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    jonsmith
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>{credits} Credits</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Buy Credits</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
      {/* </div> */}
      <div
        className="flex flex-col min-w-0 flex-1 overflow-hidden"
        style={{
          borderBottom: "rgb(38, 38, 38) 1px solid",
        }}
      >
        <div className="md:hidden">
          <div
            className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between bg-black py-4 px-5"
            style={{
              borderBottom: "rgb(38, 38, 38) 1px solid",
            }}
          >
            <div>
              <Link to="/" className="flex align-baseline">
                <div className="w-8 mr-3">
                  <PixelStudioIcon />
                </div>
                <h2 className="text-2xl m-0">Pixel Studio</h2>
              </Link>
            </div>

            {/* <div className="w-3"> */}
            {/* <div className="w-8">
                <PixelStudioIcon />
              </div> */}
            {/* </div> */}
            {/* {isLoggedIn && ( */}
            <div className="flex items-center">
              {/* <UserAvatar /> */}
              <Avatar>
                <AvatarImage
                  src="/placeholder.svg?height=32&width=32"
                  alt="User"
                />
                <AvatarFallback>JS</AvatarFallback>
              </Avatar>
            </div>
            {/* )} */}
          </div>

          {/* {isLoggedIn && ( */}
          <div
            className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around bg-black py-4"
            style={{
              borderTop: "rgb(38, 38, 38) 1px solid",
            }}
          >
            {navLinksToRender.map((link) => (
              <Link
                key={link.href}
                className="text-white group flex items-center px-2 py-2 text-medium font-medium rounded-md"
                // className="bg-gray-900 text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                to={link.href}
              >
                <span>{link.icon}</span>
              </Link>
            ))}
          </div>
          {/* )} */}
        </div>
      </div>
    </>
  );
};

export default NavigationSidebar;
