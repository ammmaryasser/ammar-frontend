import {AuthGate} from "@/contexts/AuthContext";
export default function PrintLayout({children}) { return <AuthGate>{children}</AuthGate>; }
