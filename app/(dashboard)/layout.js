import {AuthGate} from "@/contexts/AuthContext";
import Sidebar from "@/components/app/Sidebar";
import Topbar from "@/components/app/Topbar";
import MobileNav from "@/components/app/MobileNav";

export default function DashboardLayout({ children }) {
  return (
    <AuthGate><div className="min-h-screen">
      <Sidebar />
      <div className="md:ps-60 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-4 pb-24 md:pb-8 md:p-8">{children}</main>
      </div>
      <MobileNav />
    </div></AuthGate>
  );
}
