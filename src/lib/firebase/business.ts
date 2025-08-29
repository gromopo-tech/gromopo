import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { BusinessData, MenuCategory, MenuItem, MenuData } from '@/types/business';

export async function getBusinessBySubdomain(subdomain: string): Promise<BusinessData | null> {
  try {
    const businessesRef = collection(db, 'businesses');
    const businessesSnapshot = await getDocs(businessesRef);
    
    for (const businessDoc of businessesSnapshot.docs) {
      const businessData = businessDoc.data();
      if (businessData.subdomain === subdomain) {
        return {
          id: businessDoc.id,
          name: businessData.name || 'Unknown Business',
          subdomain: businessData.subdomain,
          description: businessData.description || 'Fresh food made to order',
          theme: businessData.theme,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching business by subdomain:', error);
    return null;
  }
}

export async function getBusinessMenu(businessId: string): Promise<MenuData> {
  try {
    const menuRef = collection(db, `businesses/${businessId}/menu`);
    const menuQuery = query(menuRef, orderBy('order', 'asc'));
    const menuSnapshot = await getDocs(menuQuery);
    
    const categories: (MenuCategory & { items: MenuItem[] })[] = [];
    
    for (const categoryDoc of menuSnapshot.docs) {
      const categoryData = categoryDoc.data();
      const category: MenuCategory = {
        id: categoryDoc.id,
        category: categoryData.category || 'Untitled Category',
        order: categoryData.order || 0,
      };
      
      // Get items for this category
      const itemsRef = collection(db, `businesses/${businessId}/menu/${categoryDoc.id}/items`);
      const itemsSnapshot = await getDocs(itemsRef);
      
      const items: MenuItem[] = itemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        name: itemDoc.data().name || 'Unnamed Item',
        description: itemDoc.data().description || 'No description available',
        price: itemDoc.data().price || { REGULAR: 0 },
      }));
      
      categories.push({ ...category, items });
    }
    
    return { categories };
  } catch (error) {
    console.error('Error fetching business menu:', error);
    return { categories: [] };
  }
}
