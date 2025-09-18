import { BrowserRouter, Route } from "react-router-dom"

function Router() {

  return (
    <BrowserRouter>
      <Route path="/*" element={<div></div>} />
    </BrowserRouter>
  )
}

export default Router
