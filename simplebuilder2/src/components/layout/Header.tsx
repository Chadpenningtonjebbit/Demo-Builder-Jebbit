"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoonIcon, SunIcon, SaveIcon, EyeIcon, RocketIcon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export function Header() {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="border-b border-border h-12 flex items-center justify-between pr-4 bg-background/95 backdrop-blur-sm z-40 relative">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold pl-4">SimpleBuilder</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <SaveIcon className="h-4 w-4" />
              <span className="sr-only">Save</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Save your project</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <EyeIcon className="h-4 w-4" />
              <span className="sr-only">Preview</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Preview your project</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="default" size="sm" className="h-8">
              <RocketIcon className="h-4 w-4 mr-1" />
              Publish
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Publish your project</p>
          </TooltipContent>
        </Tooltip>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <SunIcon className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <MoonIcon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Toggle {theme === "dark" ? "light" : "dark"} mode</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
} 