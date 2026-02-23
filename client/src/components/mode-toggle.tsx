import { Moon, Sun } from "lucide-react";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useTheme } from "./theme-provider";

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-zinc-700 cursor-pointer h-8.5 w-8.5 mr-1"
        >
          <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="font-sans rounded-xl p-1 shadow-lg border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-1 min-w-32"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="cursor-pointer text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md focus:bg-gray-50 dark:focus:bg-zinc-800 focus:text-gray-900 dark:focus:text-gray-100 text-sm"
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="cursor-pointer text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md focus:bg-gray-50 dark:focus:bg-zinc-800 focus:text-gray-900 dark:focus:text-gray-100 text-sm"
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="cursor-pointer text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-md focus:bg-gray-50 dark:focus:bg-zinc-800 focus:text-gray-900 dark:focus:text-gray-100 text-sm"
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
