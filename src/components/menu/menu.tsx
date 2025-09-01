"use client";

import { useEffect, useState } from 'react';
import { MenuItem as MenuItemType } from '@/types/business';

interface MenuProps {
  categories: Array<{
    id: string;
    category: string;
    items: MenuItemType[];
    // optional order field may be present from Firestore
    order?: number;
  }>;
  onAddToCart: (item: MenuItemType & { category: string }, size: string) => void;
}

export default function Menu({ categories, onAddToCart }: MenuProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );

  // If categories include an 'order' field, prefer that ordering, otherwise use the received order.
  const sortedCategories = [...categories].sort((a, b) => {
    const ao = Number((a as unknown as { order?: number }).order);
    const bo = Number((b as unknown as { order?: number }).order);
    if (!Number.isNaN(ao) && !Number.isNaN(bo)) return ao - bo;
    if (!Number.isNaN(ao) && Number.isNaN(bo)) return -1;
    if (Number.isNaN(ao) && !Number.isNaN(bo)) return 1;
    return 0; // preserve incoming order when order field missing on both
  });

  useEffect(() => {
    // Observe which category is currently at the top of viewport (after scroll-margin)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          setActiveCategory(visible.target.id.replace('category-', ''));
        }
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: [0.25, 0.5, 0.75, 1],
      }
    );

    // attach
    sortedCategories.forEach((cat) => {
      const el = document.getElementById(`category-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sortedCategories]);

  const scrollToCategory = (id: string) => {
    const el = document.getElementById(`category-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveCategory(id);
    }
  };

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
    <div className="mb-8">
      {/* Sticky category bar */}
      <nav className="sticky z-30 backdrop-blur-md"
        style={{ top: 'var(--header-height, 3.25rem)' }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="overflow-x-auto">
            <ul className="flex gap-2 py-3 whitespace-nowrap">
              {sortedCategories.map((cat) => (
                <li key={cat.id} className="inline-flex">
                  <button
                    onClick={() => scrollToCategory(cat.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      activeCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                    }`}
                    aria-current={activeCategory === cat.id}
                    aria-label={`Jump to ${cat.category}`}
                  >
                    {cat.category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Menu sections - use the sortedCategories order */}
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {sortedCategories.map((category) => (
          <section
            id={`category-${category.id}`}
            key={category.id}
            // ensure anchored section sits below sticky nav; use header height variable as fallback
            style={{ scrollMarginTop: 'calc(var(--header-height, 3.25rem) + 1rem)' }}
          >
            <h2 className="text-2xl font-bold mb-4 capitalize">{category.category}</h2>
            <div className="grid gap-4">
              {category.items.map((item) => renderMenuItem(item, category.category))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
