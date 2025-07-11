import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import Chatbot from "@/components/chatbot";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <Chatbot />
    </div>
  );
}
