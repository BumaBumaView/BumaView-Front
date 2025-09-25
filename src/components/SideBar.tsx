import { IconDeviceDesktopPause, IconHome } from "@tabler/icons-react";
import SideBarContent from "./SideBarContent";
import useLocationStore from "../stores/useLocationStore";

export type sideBarItemType = {
  text: string;
  link: string;
  icon: React.ReactNode;
  select?: boolean;
}

const sideBarItems: sideBarItemType[] = [
  {
    text: "홈",
    link: "/",
    icon: <IconHome color="#646464"/>
  },
  {
    text: "압박면접",
    link: "/interview",
    icon: <IconDeviceDesktopPause color="#646464"/>
  }
]

const SideBar = () => {
  const location = useLocationStore((state) => state.currentLocation)
  console.log(location)

  return (
    <div className="w-52 h-full border-r-[0.4px] border-[#f4f2f2] py-5 px-3 flex flex-col gap-3">
      <div className="bg-gradient-to-br from-[#AB6DFC] to-[#7559FA] w-fit h-fit rounded-md mb-8 p-2">
        <img
          src="/icon.svg"
        />
      </div>
      {sideBarItems.map((item) => (
        <SideBarContent 
          text={item.text}
          link={item.link}
          icon={item.icon}
          key={item.text}
          select={location === `${item.link}`}
        />
      ))}
    </div>
  )
}

export default SideBar;