import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { Product, Order, Category } from "@/types";

// --- CATEGORY SERVICES ---
export const getCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, "categories"), orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (category: Omit<Category, 'id'>) => {
  const newDocRef = doc(collection(db, "categories"));
  await setDoc(newDocRef, { ...category, id: newDocRef.id });
  return newDocRef.id;
};

// --- PRODUCT SERVICES ---
export const getProducts = async (): Promise<Product[]> => {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getProduct = async (id: string): Promise<Product | null> => {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Product) : null;
};

export const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
  const newDocRef = doc(collection(db, "products"));
  const productData = { 
    ...product, 
    id: newDocRef.id,
    createdAt: serverTimestamp() 
  };
  await setDoc(newDocRef, productData);
  return newDocRef.id;
};

export const updateProduct = async (id: string, data: Partial<Product>) => {
  const docRef = doc(db, "products", id);
  await updateDoc(docRef, data);
};

export const deleteProduct = async (id: string) => {
  const docRef = doc(db, "products", id);
  await deleteDoc(docRef);
};

// --- ORDER SERVICES ---
export const getOrders = async (): Promise<Order[]> => {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
  const newDocRef = doc(collection(db, "orders"));
  const orderData = { 
    ...order, 
    id: newDocRef.id,
    createdAt: serverTimestamp() 
  };
  await setDoc(newDocRef, orderData);
  return newDocRef.id;
};

export const updateOrderStatus = async (id: string, newStatus: Order['status']) => {
  const orderRef = doc(db, "orders", id);
  const orderSnap = await getDoc(orderRef);

  if (orderSnap.exists()) {
    const orderData = orderSnap.data() as Order;
    const oldStatus = orderData.status;

    // When status changes to Paid for the first time, deduct stock
    if (newStatus === "Paid" && oldStatus !== "Paid") {
      for (const item of orderData.items) {
        if (item.product?.id) {
          const productRef = doc(db, "products", item.product.id);
          try {
            await updateDoc(productRef, {
              stockQuantity: increment(-item.quantity)
            });
          } catch (e) {
            console.warn(`Could not decrement stock for product ${item.product.id}`, e);
          }
        }
      }
    }

    await updateDoc(orderRef, { status: newStatus });
  }
};
