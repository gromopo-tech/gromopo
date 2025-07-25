"use client";

import { useState, useEffect, useContext } from "react";
import { RagChat } from "./ragChat";
import Sidebar from "@/components/business/dashboard/sidebar";
import { db, auth } from "@/lib/firebase/config";
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp, getDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { BusinessIdProvider, BusinessIdContext } from "@/components/business/business-id-provider";

type Chat = {
  id: string;
  name: string;
  history: { role: string; text: string }[];
  createdAt: import('firebase/firestore').Timestamp | Date;
};

function DashboardPage() {
  const businessId = useContext(BusinessIdContext);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    const fetchChats = async () => {
      setLoading(true);
      const chatsRef = collection(db, `businesses/${businessId}/chats`);
      const q = query(chatsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      let chatList: Chat[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Chat, 'id'>) }));
      if (chatList.length === 0) {
        const newChat = {
          name: "New chat",
          history: [],
          createdAt: serverTimestamp(),
        };
        const docRef = await addDoc(chatsRef, newChat);
        const newDocSnap = await getDoc(doc(db, `businesses/${businessId}/chats/${docRef.id}`));
        let newDocData: Chat;
        if (newDocSnap.exists()) {
          const data = newDocSnap.data();
          newDocData = {
            id: docRef.id,
            name: data.name ?? "New chat",
            history: data.history ?? [],
            createdAt: data.createdAt ?? new Date(),
          };
        } else {
          newDocData = { id: docRef.id, name: "New chat", history: [], createdAt: new Date() };
        }
        chatList = [newDocData];
      }
      setChats(chatList);
      setSelectedChatId(chatList[0].id);
      setChatHistory(chatList[0].history || []);
      setLoading(false);
    };
    fetchChats();
  }, [businessId]);

  useEffect(() => {
    if (!selectedChatId || !businessId) return;
    const fetchChat = async () => {
      const chatDoc = await getDoc(doc(db, `businesses/${businessId}/chats/${selectedChatId}`));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        setChatHistory(data.history || []);
      } else {
        setChatHistory([]);
      }
    };
    fetchChat();
  }, [selectedChatId, businessId]);

  const handleNewChat = async () => {
    if (!businessId) return;
    const chatsRef = collection(db, `businesses/${businessId}/chats`);
    const newChat = {
      name: "New chat",
      history: [],
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(chatsRef, newChat);
    const newDocSnap = await getDoc(doc(db, `businesses/${businessId}/chats/${docRef.id}`));
    let newDocData: Chat;
    if (newDocSnap.exists()) {
      const data = newDocSnap.data();
      newDocData = {
        id: docRef.id,
        name: data.name ?? "New chat",
        history: data.history ?? [],
        createdAt: data.createdAt ?? new Date(),
      };
    } else {
      newDocData = { id: docRef.id, name: "New chat", history: [], createdAt: new Date() };
    }
    setChats((chats) => [newDocData, ...chats]);
    setSelectedChatId(docRef.id);
    setChatHistory([]);
  };

  const handleEditName = async (chatId: string, newName: string) => {
    if (!businessId) return;
    await updateDoc(doc(db, `businesses/${businessId}/chats/${chatId}`), { name: newName });
    setChats((chats) => chats.map((c) => ({
      ...c,
      name: c.id === chatId ? newName : c.name,
    })));
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!businessId) return;
    await deleteDoc(doc(db, `businesses/${businessId}/chats/${chatId}`));
    setChats((prevChats) => {
      const filtered = prevChats.filter((c: Chat) => c.id !== chatId);
      if (selectedChatId === chatId && filtered.length > 0) {
        setSelectedChatId(filtered[0].id);
        setChatHistory(filtered[0].history || []);
      }
      return filtered;
    });
  };

  if (!businessId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        chats={chats}
        setChats={setChats}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        onNewChat={handleNewChat}
        onEditName={handleEditName}
        onDeleteChat={handleDeleteChat}
        loading={loading}
      />
      <div className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">GMPchat</h1>
        <RagChat
          placeId="ChIJuVyExGENK4cRooPhJIUgnxk"
          selectedChatId={selectedChatId}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      </div>
    </div>
  );
}

export default function DashboardPageWrapper() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdTokenResult();
        setBusinessId(token.claims.businessId ? String(token.claims.businessId) : null);
      } else {
        setBusinessId(null);
      }
      setChecked(true);
    });
    return () => unsubscribe();
  }, []);

  if (!checked) return <div>Loading...</div>;
  if (!businessId) return <div>No business found for user.</div>;

  return (
    <BusinessIdProvider businessId={businessId}>
      <DashboardPage />
    </BusinessIdProvider>
  );
}