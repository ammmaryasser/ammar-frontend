"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/contexts/AuthContext";
import {useLang} from "@/contexts/LanguageContext";
import {safeReturnPath} from "@/lib/api";
export default function LoginPage() {
  const {signIn} = useAuth(); const {isAr, toggle} = useLang(); const router = useRouter();
  const [username, setUsername] = useState("owner"); const [password, setPassword] = useState("");
  const [error, setError] = useState(null); const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      await signIn(username, password);
      router.replace(safeReturnPath(new URLSearchParams(window.location.search).get("next")));
    } catch (e) { setError(e); } finally { setSaving(false); }
  }
  return <main className="max-w-md mx-auto mt-20 p-6 bg-surface rounded-lg border border-line space-y-5">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">{isAr ? "تسجيل الدخول" : "Sign in"}</h1>
      <button onClick={toggle}>EN / العربية</button></div>
    <form onSubmit={submit} className="space-y-4">
      <label className="block">{isAr ? "اسم المستخدم" : "Username"}<input name="username" autoComplete="username" required
        value={username} onChange={e => setUsername(e.target.value)} className="block w-full border border-line rounded p-2 bg-bg"/></label>
      <label className="block">{isAr ? "كلمة المرور" : "Password"}<input name="password" type="password" autoComplete="current-password" required
        value={password} onChange={e => setPassword(e.target.value)} className="block w-full border border-line rounded p-2 bg-bg"/></label>
      {error && <p role="alert" className="text-bad">{isAr ? (error.status === 401 ? "اسم المستخدم أو كلمة المرور غير صحيحة" :
        error.status === 429 ? "محاولات كثيرة. حاول لاحقاً." : "تعذر الاتصال بالخادم. حاول مرة أخرى.") : error.message}</p>}
      <button disabled={saving} className="bg-accent text-accent-ink rounded p-2 w-full disabled:opacity-50">
        {saving ? (isAr ? "جارٍ الدخول…" : "Signing in…") : (isAr ? "دخول" : "Sign in")}</button>
    </form></main>;
}
