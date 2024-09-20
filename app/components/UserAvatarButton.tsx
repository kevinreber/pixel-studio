import { CreditCard, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { LogOutButton } from "./LogOutButton";

const userData = {
  name: "John Doe",
  username: "johndoe",
};

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
    className="w-full flex items-center rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors font-medium"
    {...props}
  >
    {icon}
    <span className="ml-2">{title}</span>
  </a>
);

const NAV_LINKS = [
  //   {
  //     title: "Profile",
  //     icon: <User className="md:h-4 md:w-4" />,
  //     href: "/profile",
  //   },
  {
    title: "Buy Credits",
    icon: <CreditCard className="md:h-4 md:w-4" />,
    href: "/buy-credits",
  },
  {
    title: "Settings",
    icon: <Settings className="md:h-4 md:w-4" />,
    href: "/settings",
  },
];

const UserAvatarButton = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
          <Avatar>
            <AvatarImage
              // src="/placeholder.svg?height=32&width=32"
              alt="User"
            />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div className="md:flex flex-col hidden text-left flex-1">
            <div className="font-medium">{userData.name}</div>
            <div className="text-xs text-gray-400">{userData.username}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        style={{ zIndex: 9999, backgroundColor: "rgba(0, 0, 0, 1)" }}
      >
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator className="border-[1px]" />
        <DropdownMenuGroup>
          {NAV_LINKS.map((link) => (
            <DropdownMenuItem key={link.title}>
              <NavButton title={link.title} icon={link.icon} link={link.href} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuItem>
          <LogOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { UserAvatarButton };
