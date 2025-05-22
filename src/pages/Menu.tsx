import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Menu = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Main Menu</h1>
        <p className="mt-2 text-lg text-gray-600">
          Select an option to manage your seed inventory.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <Card className="p-6 shadow-lg flex flex-col items-center text-center">
          {/* Monitor Inventory Icon */}
          <div className="mb-4 text-primary">
            <img src="/icons/inventory.svg" alt="Monitor Inventory Icon" className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Monitor Inventory</h2>
          <p className="mb-6 text-gray-700">View and manage current seed stock, track volumes, and analyze storage data across locations.</p>
          <Button asChild className="w-full" variant="outline">
            <Link to="/monitor-inventory">
              Go to Monitor Inventory
            </Link>
          </Button>
        </Card>

        <Card className="p-6 shadow-lg flex flex-col items-center text-center">
          {/* Scan QR Codes Icon */}
          <div className="mb-4 text-primary">
            <img src="/icons/scan-qr.svg" alt="Scan QR Codes Icon" className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Scan QR Codes</h2>
          <p className="mb-6 text-gray-700">Quickly access seed details by scanning QR codes. Ideal for field or warehouse operations.</p>
          <Button asChild className="w-full" variant="outline">
            <Link to="/scan-qr">
              Go to Scan QR Codes
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Menu;
