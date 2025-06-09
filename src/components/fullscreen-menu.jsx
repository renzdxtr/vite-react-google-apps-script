"use client";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MENU_ITEMS, APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function FullscreenMenu({ isMenuOpen, setIsMenuOpen }) {
  const { pathname } = useLocation();

  if (!isMenuOpen) return null;

  return (
    <div className="flex flex-col bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 animate-in fade-in-20">
      
      {/* Top header inside fullscreen menu */}
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b">
        <div className="flex items-center gap-3">
          <img src="/logos/square.svg" alt="SIS Logo" className="h-8 w-auto" />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
        >
          <XIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center p-8 space-y-6 mt-16">
        <ul className="space-y-4 text-center w-full max-w-xs">
          {MENU_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className={cn(
                  "text-2xl font-medium text-foreground hover:text-primary transition-colors block py-3 rounded-md",
                  pathname === item.href ? "bg-muted text-primary" : ""
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
