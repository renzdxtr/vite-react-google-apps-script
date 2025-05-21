'use client';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-4rem)]"> {/* Adjust height as needed */}
      {/* Placeholder Image/Block */}
      <div className="w-[600px] h-[300px] bg-gray-300 flex items-center justify-center text-gray-600 text-6xl font-bold rounded-lg shadow-lg mb-8">
        600 x 300
      </div>

      <h1 className="text-5xl font-bold text-blue-700 mb-4">
        Seed Inventory System
      </h1>
      <p className="text-xl text-gray-700 mb-8 max-w-2xl">
        Efficiently manage and track your seed inventory with precision and ease. Streamline your agricultural operations from storage to planting.
      </p>
      <Link to="/tasks"> {/* Link to your tasks page or appropriate route */}
        <Button size="lg" className="text-lg px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-lg transition duration-300 ease-in-out">
          Get Started →
        </Button>
      </Link>
    </div>
  );
}