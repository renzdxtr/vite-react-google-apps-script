import { X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { MENU_ITEMS, APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function FullscreenMenu({ isMenuOpen, setIsMenuOpen }) {
  const pathname = useLocation().pathname;

  if (!isMenuOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 animate-in fade-in-20">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 border-b">
        <h2 className="text-2xl font-bold text-primary">{APP_NAME} Menu</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Close menu"
        >
          <XIcon className="h-6 w-6" />
        </Button>
      </div>
      <nav className="flex flex-col items-center p-8 mt-16">
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
