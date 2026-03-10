// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getApiErrorMessage } from "../api";
import Header from "../components/header";

export default function AdminLogin() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ لا تغيير على رابط الباك
      const res = await api.post("/auth/login", { username, password });

      const token = res.data?.token || res.data?.data?.token;
      if (!token) throw new Error("لم يتم العثور على token في الاستجابة");

      localStorage.setItem("token", token);

      nav("/AdminPage", { replace: true });
    } catch (err) {
      alert(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <section className="min-h-screen bg-[#202C28] font-Vazirmatn flex items-center justify-center p-4">
        <div dir="rtl" className="w-full max-w-md p-6">
          <h1 className="text-center text-[#E7F2E2] text-2xl font-bold mb-6">
            تسجيل الدخول
          </h1>

          <form onSubmit={submit} autoComplete="on" className="space-y-5">
            {/* USERNAME */}
            <div>
              <label className="block text-[#E7F2E2] font-semibold mb-2">
                اسم المستخدم
              </label>

              <input
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-[#D8AC4B] bg-transparent text-white rounded-md px-4 py-3 outline-none
                           focus:ring-2 focus:ring-[#D8AC4B]/50"
                placeholder="اسم المستخدم"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-[#E7F2E2] font-semibold mb-2">
                كلمة المرور
              </label>

              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#D8AC4B] bg-transparent text-white rounded-md px-4 py-3 outline-none
                           focus:ring-2 focus:ring-[#D8AC4B]/50"
                placeholder="**********"
                required
              />
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D8AC4B] text-white rounded-md py-3 font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}