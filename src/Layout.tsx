import React from "react";
import SideBar from "./components/SideBar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full flex">
      <SideBar />
      <div 
        className='bg-gradient-to-t from-[#FFF] via-[#E8D4ED] to-[#6E77CC] w-full h-full px-72 pt-20 pb-40'
      >
        <div className="w-full h-full bg-white rounded-2xl">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout;