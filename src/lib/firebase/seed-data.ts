import { adminDb } from '@/lib/firebase/adminConfig';

{/*
  Run with: curl -X POST -H "Content-Type: application/json" http://localhost:5002/api/seed-data
  */}

// Sample data based on your static files
const sampleBusinessData = {
  name: "Sandra's Sandwiches",
  subdomain: "sandras-sandwiches",
  description: "Fresh sandwiches made to order",
  theme: {
    primaryColor: "yellow",
    secondaryColor: "yellow",
    backgroundColor: "white"
  }
};

const sampleMenuData = [
  {
    id: "signature-nooners",
    category: "Signature Nooners",
    order: 1,
    items: [
      {
        name: 'The Duckling',
        description: 'Smoked duck breast, roasted turkey breast, cream cheese, cranberry relish & spring mix on cranberry walnut country bread',
        price: { FULL: 13.99, MINI: 7.99 },
        availableSizes: ["Mini", "Full"]
      },
      {
        name: 'The BTC',
        description: 'Dried cured smoked ham, tomato, Swiss cheese, lettuce, mayo and spicy brown mustard',
        price: { FULL: 14.99, MINI: 8.59 },
        availableSizes: ["Mini", "Full"]
      },
      {
        name: 'Vermont Treat',
        description: 'Honey glazed ham, pine nuts, spinach, sliced apples, Duck and Decanter\'s famous cheddar cheese spread on multigrain bread',
        price: { FULL: 12.99, MINI: 6.99 },
        availableSizes: ["Mini", "Full"]
      }
    ]
  },
  {
    id: "drinks",
    category: "Drinks", 
    order: 2,
    items: [
      {
        name: 'Craft Soda',
        description: 'Locally made artisan sodas in various flavors',
        price: { REGULAR: 3.49 }
      },
      {
        name: 'Iced Tea',
        description: 'Freshly brewed and lightly sweetened black tea with lemon',
        price: { REGULAR: 2.99 }
      },
      {
        name: 'Fresh Lemonade',
        description: 'House-made with fresh-squeezed lemons and a touch of honey',
        price: { REGULAR: 3.99 }
      }
    ]
  }
];

export async function seedFirestoreData() {
  try {
    console.log('Seeding Firestore with sample data...');
    
    // Create business document
    const businessRef = adminDb.collection('businesses').doc();
    await businessRef.set(sampleBusinessData);
    console.log('✅ Business created with ID:', businessRef.id);
    
    // Create menu categories and items
    for (const menuCategory of sampleMenuData) {
      const menuRef = adminDb.collection(`businesses/${businessRef.id}/menu`).doc();
      await menuRef.set({
        category: menuCategory.category,
        order: menuCategory.order
      });
      console.log(`✅ Menu category created: ${menuCategory.category}`);
      
      // Add items to this category
      for (const item of menuCategory.items) {
        const itemRef = adminDb.collection(`businesses/${businessRef.id}/menu/${menuRef.id}/items`).doc();
        await itemRef.set(item);
        console.log(`   ✅ Item added: ${item.name}`);
      }
    }
    
    console.log('🎉 Firestore seeding completed!');
    console.log('Business ID:', businessRef.id);
    return businessRef.id;
    
  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    throw error;
  }
}