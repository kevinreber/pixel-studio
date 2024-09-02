import React from "react";
import PixelStudioIcon from "components/PixelStudioIcon";
import { Link } from "@remix-run/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Layers,
  PenTool,
  User,
  Settings,
  LogOut,
  CreditCard,
} from "lucide-react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/remix";

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
    <span className="ml-2">{title}</span>
  </a>
);

const NavigationSidebar = () => {
  const { user } = useUser();
  console.log(user);

  const [credits, setCredits] = React.useState(31);
  // const userData = React.useContext(UserContext);
  // const userData = useLoggedInUser();
  // const isLoggedIn = Boolean(userData?.id);

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 p-4 border-r h-screen fixed top-0 left-0 bottom-0 z-10 text-xl">
        <div className="flex items-center mb-8">
          <div className="flex align-baseline">
            <div className="w-8 mr-3">
              <PixelStudioIcon />
            </div>
            <h2 className="text-2xl m-0">Pixel Studio</h2>
          </div>
        </div>

        <nav className="flex-1 space-y-1 font-medium">
          <SignedIn>
            {NAV_LINKS.map((link) => (
              <NavButton
                key={link.href}
                title={link.title}
                icon={link.icon}
                link={link.href}
              />
            ))}
          </SignedIn>
        </nav>

        <div className="mt-auto pt-4">
          <SignedIn>
            <div className="w-full flex flex-col items-start align-baseline px-3 py-2 rounded-md text-gray-300 transition-colors font-medium mb-3">
              <div className="flex items-center ">
                <CreditCard className="md:h-4 md:w-4" />
                <span className="ml-2">{credits} Credits</span>
              </div>
              <div className="underline text-xs text-gray-400 ml-6">
                <a href="/">Buy Credits</a>
              </div>
            </div>
            <div className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md text-gray-300 ">
              <UserButton />
              <div className="text-left flex-1">
                <div className="font-medium">{user?.fullName}</div>
                <div className="text-xs text-gray-400">{user?.username}</div>
              </div>
            </div>
          </SignedIn>
          <SignedOut>
            <div className="flex flex-col text-center">
              <SignInButton>
                <button className="rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 border border-gray-500 hover:bg-gray-800 hover:text-gray-200 mb-4">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <a href="/sign-up" className="text-sm underline">
                  Create an account
                </a>
              </SignUpButton>
            </div>
          </SignedOut>
        </div>
      </aside>

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

            <SignedIn>
              <UserButton />
            </SignedIn>
          </div>

          <div
            className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around bg-black py-4"
            style={{
              borderTop: "rgb(38, 38, 38) 1px solid",
            }}
          >
            <SignedIn>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  className="text-white group flex items-center px-2 py-2 text-medium font-medium rounded-md"
                  to={link.href}
                >
                  <span>{link.icon}</span>
                </Link>
              ))}
            </SignedIn>
            <SignedOut>
              <SignInButton>
                <button className="mx-6 w-full rounded-md px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500 border border-gray-500 hover:bg-gray-800 hover:text-gray-200">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </>
  );
};

export default NavigationSidebar;
