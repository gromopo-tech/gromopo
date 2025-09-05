import { adminDb } from '@/lib/firebase/adminConfig';

{/*
  Run with: curl -X POST -H "Content-Type: application/json" http://localhost:5002/api/seed-data
  */}

// Sample data based on your static files
const sampleBusinessData = {
  name: "Duck and Decanter",
  description: "Fresh sandwiches made to order",
  normalizedName: "duckanddecanter",
  menuUploaded: true,
  menuIntegrated: true,
  hasWallet: false,
  theme: {
    primaryColor: "yellow",
    secondaryColor: "yellow",
    backgroundColor: "white"
  }
};

const sampleMenuData = [
  {
    categoryName: "signature-nooners",
    order: 1,
    items: [
      {
        itemName: 'the-duckling',
        description: 'Smoked duck breast, roasted turkey breast, cream cheese, cranberry relish & spring mix on cranberry walnut country bread',
        price: { FULL: 13.99, MINI: 7.99 }
      },
      {
        itemName: 'the-btc',
        description: 'Dried cured smoked ham, tomato, Swiss cheese, lettuce, mayo and spicy brown mustard',
        price: { FULL: 14.99, MINI: 8.59 }
      },
      {
        itemName: 'vermont-treat',
        description: 'Honey glazed ham, pine nuts, spinach, sliced apples, Duck and Decanter\'s famous cheddar cheese spread on multigrain bread',
        price: { FULL: 12.99, MINI: 6.99 }
      }
    ]
  },
  {
    categoryName: "drinks",
    order: 2,
    items: [
      {
        itemName: 'craft-soda',
        description: 'Locally made artisan sodas in various flavors',
        price: { REGULAR: 3.49 }
      },
      {
        itemName: 'iced-tea',
        description: 'Freshly brewed and lightly sweetened black tea with lemon',
        price: { REGULAR: 2.99 }
      },
      {
        itemName: 'fresh-lemonade',
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
    const businessRef = adminDb.doc(`businesses/duck-and-decanter`);
    await businessRef.set(sampleBusinessData);
    console.log('✅ Business created with ID:', 'duck-and-decanter');
    
    // Create menu categories and items
    for (const menuCategory of sampleMenuData) {
      const menuRef = adminDb.collection(`businesses/duck-and-decanter/menu`).doc(menuCategory.categoryName);
      await menuRef.set({
        order: menuCategory.order
      });
      console.log(`✅ Menu category created: ${menuCategory.categoryName}`);
      
      // Add items to this category
      for (const item of menuCategory.items) {
        const itemRef = adminDb.collection(`businesses/duck-and-decanter/menu/${menuCategory.categoryName}/items`).doc(item.itemName);
        await itemRef.set({
          description: item.description,
          price: item.price
        });
        console.log(`   ✅ Item added: ${item.itemName}`);
      }
    }
    
    console.log('🎉 Firestore seeding completed!');
    console.log('Business ID:', 'duck-and-decanter');
    return 'duck-and-decanter';

  } catch (error) {
    console.error('❌ Error seeding Firestore:', error);
    throw error;
  }
}