import type { sideBarItemType } from "./SideBar"


const SideBarContent = ({ text, link, icon, select }: sideBarItemType) => {

  return (
    <a
      href={link}
      className={
        `w-full flex flex-row gap-3 items-center cursor-pointer 
        hover:bg-[#F5F5F5] p-2 rounded color-[#646464] text-sm

        ${select ? 'bg-[#F5F5F5]' : ''}
        `
      }
    > 
      <div>
        {icon}
      </div>
      {text}
    </a>
  )
}

export default SideBarContent