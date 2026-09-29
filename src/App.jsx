import React, { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { I18nProvider, useI18n } from "./i18n/index.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { RequireAuth } from "./auth/Guard.jsx";
import { isConfigured } from "./lib/supabase.js";
import Layout from "./components/Layout.jsx";
import { PageLoader } from "./components/ui.jsx";
import Home from "./pages/Home.jsx";

const CoursePage = lazy(() => import("./pages/CoursePage.jsx"));
const Learn = lazy(() => import("./pages/Learn.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const PaymentResult = lazy(() => import("./pages/PaymentResult.jsx"));
const Auth = lazy(() => import("./pages/Auth.jsx"));
const MyLearning = lazy(() => import("./pages/MyLearning.jsx"));
const Account = lazy(() => import("./pages/Account.jsx"));
const Verify = lazy(() => import("./pages/Verify.jsx"));
const Legal = lazy(() => import("./pages/Legal.jsx"));
const Admin = lazy(() => import("./pages/admin/Admin.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function SetupNotice() {
  const { t } = useI18n();
  return (
    <div className="shell py-20 max-w-2xl">
      <div className="panel p-8">
        <h1 className="text-2xl font-black">{t("setup.title")}</h1>
        <p className="mute mt-3 leading-loose">{t("setup.desc")}</p>
        <pre className="mt-5 p-4 rounded-xl text-sm overflow-x-auto" dir="ltr" style={{ background: "rgba(0,0,0,.4)", border: "1px solid var(--line)" }}>
{`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
        </pre>
      </div>
    </div>
  );
}

function AppRoutes() {
  if (!isConfigured) return <SetupNotice />;
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="courses/:slug" element={<CoursePage />} />
          <Route path="learn/:slug/:lessonId?" element={<Learn />} />
          <Route path="checkout/:slug" element={<RequireAuth><Checkout /></RequireAuth>} />
          <Route path="payment/result" element={<RequireAuth><PaymentResult /></RequireAuth>} />
          <Route path="login" element={<Auth key="signin" mode="signin" />} />
          <Route path="signup" element={<Auth key="signup" mode="signup" />} />
          <Route path="reset-password" element={<Auth key="update" mode="update" />} />
          <Route path="my-learning" element={<RequireAuth><MyLearning /></RequireAuth>} />
          <Route path="account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="verify/:code?" element={<Verify />} />
          <Route path="legal/:doc" element={<Legal />} />
          <Route path="admin" element={<RequireAuth role="admin"><Admin /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
