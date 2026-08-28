"use client";

import React, { use } from "react";
import RoutesExplorerPage from "../page";

export default function DirectCorridorRoutePage({ params }: { params: Promise<{ corridor: string }> }) {
  use(params);
  return <RoutesExplorerPage />;
}

