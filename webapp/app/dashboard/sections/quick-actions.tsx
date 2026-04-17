"use client";

import { Search } from "../components/search";
import { Stats } from "../components/stats";
import { Settings } from "../components/settings";
import { Friends } from "../components/friends";

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-xl lg:max-w-3xl -mt-3">
      <Search />
      <Stats />
      <Settings />
      <Friends />
    </div>
  );
}
