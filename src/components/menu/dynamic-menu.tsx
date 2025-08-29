'use client';

import { MenuItem as MenuItemType } from '@/types/business';

interface DynamicMenuProps {
  categories: Array<{
    id: string;
    category: string;
    items: MenuItemType[];
  }>;
  onAddToCart: (item: MenuItemType & { category: string }, size: string) => void;
}

export default function DynamicMenu({ categories, onAddToCart }: DynamicMenuProps) {
  const renderMenuItem = (item: MenuItemType, categoryName: string) => {
    const isMultiSize = typeof item.price === 'object' && item.price !== null;
    
    return (
      <div key={item.id} className="border p-4 rounded">
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-sm mb-2">{item.description}</p>
        
        {isMultiSize ? (
          <div className="flex gap-2 flex-wrap">
            {Object.entries(item.price as Record<string, number>).map(([sizeName, price]) => (
              <button
                key={sizeName}
                onClick={() => onAddToCart({ ...item, category: categoryName }, sizeName)}
                className="btn btn-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
              >
                {sizeName}: ${price.toFixed(2)}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => onAddToCart({ ...item, category: categoryName }, 'Regular')}
            className="btn btn-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            ${((item.price as number)).toFixed(2)}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {categories.map((category) => (
        <section key={category.id}>
          <h2 className="text-2xl font-bold mb-4 capitalize">{category.category}</h2>
          <div className="grid gap-4">
            {category.items.map((item) => renderMenuItem(item, category.category))}
          </div>
        </section>
      ))}
    </div>
  );
}
