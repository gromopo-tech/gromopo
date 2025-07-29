'use client';

import { signatureSandwiches } from './items/signature-nooners';
import { hotSandwiches } from './items/hot-nooners';
import { MenuItem } from '@/types/menu';

interface MenuProps {
  onAddToCart: (item: MenuItem, size: string) => void;
}

export default function Menu({ onAddToCart }: MenuProps) {
  const renderMenuItem = (item: MenuItem) => {
    const isMultiSize = typeof item.price === 'object';
    
    return (
      <div key={item.name} className="border p-4 rounded">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
        
        {isMultiSize ? (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(item.price as Record<string, number>).map(([sizeName, price]) => (
              <button
                key={sizeName}
                onClick={() => onAddToCart(item, sizeName)}
                className="btn btn-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                {sizeName}: ${price.toFixed(2)}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => onAddToCart(item, 'Regular')}
            className="btn btn-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            ${(item.price as number).toFixed(2)}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Signature Nooners</h2>
        <div className="grid gap-4">
          {signatureSandwiches.map(renderMenuItem)}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">Hot Nooners</h2>
        <div className="grid gap-4">
          {hotSandwiches.map(renderMenuItem)}
        </div>
      </section>
    </div>
  );
}