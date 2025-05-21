import { routes } from "../routes";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Bars3Icon as MenuIcon, XMarkIcon as XIcon } from "@heroicons/react/24/outline";
export const Navbar = () => {
 const location = useLocation();
 const [isOpen, setIsOpen] = useState(false);

 const toggleMenu = () => {
 setIsOpen(!isOpen);
  };

 return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
 <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
 <img src="/images/SIS LOGO.svg" alt="SIS Logo" className="h-8 w-auto" />
 {/* Page title placeholder (hidden for now) */}
 <h1 className="text-xl font-semibold text-foreground hidden sm:block">
 { /* You can add page title logic here if needed later */ }
 </h1>
 <button
 onClick={toggleMenu}
 className="text-gray-600 focus:outline-none"
 aria-label="Open menu"
 >
 <MenuIcon className="h-6 w-6" />
 </button>
 </div>

 {isOpen && (
 <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
 <button onClick={toggleMenu} className="absolute top-4 right-4 text-gray-600 focus:outline-none">
 <XIcon className="w-6 h-6" />
 </button>
 <ul className="flex flex-col space-y-4">
            {routes.map((route) => (
 <li key={route.title}>
 <Link
 to={route.url}
 className={`text-2xl font-medium ${
 location.pathname === route.url ? "text-blue-600" : "text-gray-800"
 }`}
 onClick={toggleMenu}
 >
 {route.title}
 </Link>
 </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};