import { createBrowserRouter } from "react-router-dom";

import { CollectionsPage } from "../pages/CollectionsPage";
import { Dashboard } from "../pages/Dashboard";
import { PromptCreate } from "../pages/PromptCreate";
import { PromptDetailsPage } from "../pages/PromptDetailsPage";
import { PromptEdit } from "../pages/PromptEdit";
import { StatusPage } from "../pages/StatusPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard />,
  },
  {
    path: "/prompts/new",
    element: <PromptCreate />,
  },
  {
    path: "/prompts/:id",
    element: <PromptDetailsPage />,
  },
  {
    path: "/prompts/:id/edit",
    element: <PromptEdit />,
  },
  {
    path: "/collections",
    element: <CollectionsPage />,
  },
  {
    path: "/status",
    element: <StatusPage />,
  },
]);
