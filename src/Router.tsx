import { useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Layout from "./Layout"

import InterviewPage from "./page/InterviewPage"
import HomePage from "./page/HomePage"
import useLocationStore from "./stores/useLocationStore"

function LocationUpdater() {
  const location = useLocation();
  const changeLocation = useLocationStore((state) => state.changeLocation);

  useEffect(() => {
    changeLocation(location.pathname);
  }, [location, changeLocation]);

  return null;
}

function Router() {
  return (
    <BrowserRouter>
      <Layout>
        <LocationUpdater />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/interview" element={<InterviewPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default Router;