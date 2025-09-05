import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { BusinessData, MenuCategory, MenuItem, MenuData } from '@/types/business';

// Helper function to convert kebab-case to display name
function kebabToDisplayName(kebabCase: string): string {
  return kebabCase
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getBusinessBySubdomain(subdomain: string): Promise<BusinessData | null> {
  try {
    // Since subdomain is now the document ID, we can fetch directly
    const businessRef = doc(db, 'businesses', subdomain);
    const businessSnap = await getDoc(businessRef);
    
    if (businessSnap.exists()) {
      const businessData = businessSnap.data();
      return {
        id: businessSnap.id, // This is the subdomain
        name: businessData.name || 'Unknown Business',
        subdomain: businessSnap.id, // Use document ID as subdomain
        description: businessData.description || 'Fresh food made to order',
        theme: businessData.theme,
      };
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
        category: kebabToDisplayName(categoryDoc.id), // Convert kebab-case to display name
        order: categoryData.order || 0,
      };
      
      // Get items for this category
      const itemsRef = collection(db, `businesses/${businessId}/menu/${categoryDoc.id}/items`);
      const itemsSnapshot = await getDocs(itemsRef);
      
      const items: MenuItem[] = itemsSnapshot.docs.map(itemDoc => ({
        id: itemDoc.id,
        name: kebabToDisplayName(itemDoc.id), // Convert kebab-case to display name
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
