import React, { useEffect, useMemo, useState, useRef } from "react";
import api, { getApiErrorMessage } from "../api";
import { FiUsers } from "react-icons/fi";
import { BsCamera } from "react-icons/bs";
import { MdOutlinePhotoLibrary } from "react-icons/md";
import { FaTrash, FaPen } from "react-icons/fa";
import Header from "../components/header";

/* ===================== UI HELPERS ===================== */

function SectionBar({ title }) {
  return (
    <div className="bg-[#3C635A] text-white/90 font-Vazirmatn text-center py-3 sm:py-4">
      <span className="text-lg sm:text-xl font-semibold">{title}</span>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="border border-[#D8AC4B]/60 rounded-md px-4 py-4 flex items-center justify-between gap-3 w-full max-w-[420px] bg-[#202C28]/30">
      <div className="flex items-center gap-3">
        <div className="text-white/90 text-3xl">{icon}</div>
        <div className="text-right font-Vazirmatn">
          <div className="text-white/90 font-semibold">{label}</div>
          <div className="text-white/90 text-lg">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Button({ className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "font-Vazirmatn rounded-md px-6 py-2 text-sm sm:text-base transition disabled:opacity-50 disabled:cursor-not-allowed " +
        className
      }
    />
  );
}

function Modal({ open, onClose, title, children, max = "max-w-3xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={`w-full ${max} bg-[#E6E6E6] rounded-lg shadow-xl overflow-hidden`}>
          <div className="flex items-center justify-between p-4">
            <button
              onClick={onClose}
              className="text-[#3C635A] text-3xl leading-none"
              aria-label="close"
              type="button"
            >
              ×
            </button>
            <h3 className="font-Vazirmatn text-[#3C635A] text-xl font-semibold">{title}</h3>
            <div className="w-8" />
          </div>
          <div className="px-6 pb-6 max-h-[75vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div className="font-Vazirmatn text-[#3C635A] font-semibold text-base sm:text-lg mb-2 text-right">
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full bg-[#3C635A] text-white placeholder-white/60 rounded-md px-4 py-3 outline-none font-Vazirmatn"
    />
  );
}

function Textarea(props) {
  return (
    <textarea
      {...props}
      className="w-full bg-[#3C635A] text-white placeholder-white/60 rounded-md px-4 py-3 outline-none font-Vazirmatn min-h-[140px]"
    />
  );
}

function RowBox({ right, left }) {
  return (
    <div className="bg-[#E7F2E2] rounded-md px-3 py-3 flex items-center justify-between gap-3">
      <div className="text-right">{right}</div>
      <div className="flex items-center gap-2 flex-wrap">{left}</div>
    </div>
  );
}

function Toast({ open, type = "success", msg, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed z-[9999] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[460px]">
      <div
        className={[
          "rounded-lg px-4 py-3 font-Vazirmatn shadow-xl border",
          type === "success"
            ? "bg-[#E7F2E2] border-[#2EA44F]/40 text-[#202C28]"
            : "bg-[#2B1B1B] border-red-400/40 text-white",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm sm:text-base whitespace-pre-line">{msg}</div>
          <button
            onClick={onClose}
            className="text-xl leading-none opacity-70 hover:opacity-100"
            type="button"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== MAIN ===================== */

export default function AdminPage() {
  // ✅ PROTECTED SERVICES (no delete button)
  const PROTECTED_SERVICE_IDS = useMemo(() => new Set([1, 2]), []);
  function isProtectedService(service) {
    return PROTECTED_SERVICE_IDS.has(Number(service?.id));
  }

  // ====== DATA ======
  const [stats, setStats] = useState({ services: 0, occasions: 0, totalPhotos: 0 });
  const [services, setServices] = useState([]);
  const [occasionsByService, setOccasionsByService] = useState({}); // serviceId -> occasions[]

  // ====== UI ======
  const [loading, setLoading] = useState(true);

  // ====== Toast ======
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });

  function showToast(type, msg) {
    setToast({ open: true, type, msg });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast((t) => ({ ...t, open: false }));
    }, 3200);
  }

  function showApiError(err) {
    const apiMsg =
      err?.response?.data?.error || err?.response?.data?.message || getApiErrorMessage(err);
    showToast("error", apiMsg);
  }

  // ====== MODALS ======
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [openOccasionModal, setOpenOccasionModal] = useState(false);

  // ====== CONFIRM MODAL ======
  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    message: "",
    loading: false,
    onConfirm: null,
  });

  function closeConfirm() {
    setConfirm((c) => ({ ...c, open: false, loading: false, onConfirm: null }));
  }

  function askConfirm({ title, message, onConfirm }) {
    setConfirm({
      open: true,
      title,
      message,
      loading: false,
      onConfirm,
    });
  }

  // ====== SERVICE FORM (add/edit) ======
  const [serviceMode, setServiceMode] = useState("add"); // add | edit
  const [editingService, setEditingService] = useState(null);
  const [sName, setSName] = useState("");
  const [sCovers, setSCovers] = useState([]); // ملفات جديدة
  const [sCoverPreviews, setSCoverPreviews] = useState([]); // معاينات جديدة
  const [sExistingCoverUrls, setSExistingCoverUrls] = useState([]); // روابط الغلاف الحالية

  // ====== OCCASION FORM (add/edit) ======
  const [occasionMode, setOccasionMode] = useState("add"); // add | edit
  const [editingOccasion, setEditingOccasion] = useState(null);

  const [targetServiceId, setTargetServiceId] = useState(null);
  const [oTitle, setOTitle] = useState("");
  const [oDesc, setODesc] = useState("");
  const [oDate, setODate] = useState("");

  // ✅ كفر واحد فقط للتغطية
  const [oThumbFiles, setOThumbFiles] = useState([]); // always 0 or 1
  const [oThumbPreviews, setOThumbPreviews] = useState([]); // always 0 or 1
  const [oExistingThumbUrls, setOExistingThumbUrls] = useState([]);

  // ====== ALBUM MANAGER ======
  const [openPhotosModal, setOpenPhotosModal] = useState(false);
  const [photosOccasionId, setPhotosOccasionId] = useState(null);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState(new Set());

  const [uploadOccasionId, setUploadOccasionId] = useState(null);
  const [uploadImages, setUploadImages] = useState([]);
  const [uploadPreviews, setUploadPreviews] = useState([]);

  // ✅ Progress للرفع بالدفعات
  const [batchProg, setBatchProg] = useState({
    running: false,
    uploaded: 0,
    total: 0,
    batchIndex: 0,
    totalBatches: 0,
    percent: 0,
    failedBatches: 0,
  });

  const servicesWithOccasions = useMemo(() => {
    return services.map((s) => ({
      ...s,
      occasions: occasionsByService[String(s.id)] || [],
    }));
  }, [services, occasionsByService]);

  /* ===================== HELPERS ===================== */

  function revokeAll(urls) {
    (urls || []).forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
  }

  function toNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function toArr(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === "string") {
          try {
            const doubleParsed = JSON.parse(parsed);
            if (Array.isArray(doubleParsed)) return doubleParsed;
          } catch {}
          return parsed.split(",").map((s) => s.trim()).filter(Boolean);
        }
      } catch {
        const clean = val.replace(/^["'\[]+|["'\]]+$/g, "");
        return clean.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return [val];
  }

  function getAbsoluteUrlMaybe(pathOrUrl) {
    if (!pathOrUrl) return "";
    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;

    try {
      const base = api?.defaults?.baseURL || "";
      const origin = new URL(base).origin;
      return origin + pathOrUrl;
    } catch {
      return pathOrUrl;
    }
  }

  function getServiceCoverUrls(service) {
    const arr = toArr(service?.coverImages);
    return Array.from(new Set(arr.map(getAbsoluteUrlMaybe).filter(Boolean)));
  }

  function getOccasionThumbUrls(occasion) {
    const arr = toArr(occasion?.thumbnails);
    return Array.from(new Set(arr.map(getAbsoluteUrlMaybe).filter(Boolean)));
  }

  // ✅ نفس طريقة رابط صورك (uploads/filename)
  function getPhotoSrc(p) {
    let src = p?.imageUrl || p?.url || p?.src || "";
    if (!src) return "";

    const filename = src.split("/").pop();
    const baseAsset = import.meta.env.VITE_ASSET_BASE_URL || "";
    const base = baseAsset.endsWith("/") ? baseAsset : baseAsset + "/";
    return `${base}uploads/${filename}`;
  }

  /* ===================== API FETCH (NO CHANGES) ===================== */

  async function fetchStats() {
    const res = await api.get("/admin/stats");
    const root = res.data ?? {};
    const summary = root?.summary || {};
    setStats({
      services: toNumber(summary.services),
      occasions: toNumber(summary.occasions),
      totalPhotos: toNumber(summary.photos),
    });
  }

  async function fetchServices() {
    const res = await api.get("/services/");
    const arr = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    setServices(arr);
    return arr;
  }

  async function fetchOccasionsForService(serviceId) {
    const res = await api.get(`/services/${serviceId}/occasions`);
    const arr = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    setOccasionsByService((prev) => ({ ...prev, [String(serviceId)]: arr }));
  }

  async function fetchAllOccasions(arrServices) {
    await Promise.all(
      (arrServices || []).map(async (s) => {
        try {
          await fetchOccasionsForService(s.id);
        } catch (err) {
          showApiError(err);
        }
      })
    );
  }

  async function init() {
    setLoading(true);
    try {
      const arr = await fetchServices();
      await Promise.all([fetchStats(), fetchAllOccasions(arr)]);
    } catch (err) {
      showApiError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    init();
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);

      revokeAll(sCoverPreviews);
      revokeAll(oThumbPreviews);
      revokeAll(uploadPreviews);
    };
    // eslint-disable-next-line
  }, []);

  /* ===================== SERVICES ===================== */

  function openAddService() {
    revokeAll(sCoverPreviews);
    setServiceMode("add");
    setEditingService(null);
    setSName("");
    setSCovers([]);
    setSCoverPreviews([]);
    setSExistingCoverUrls([]);
    setOpenServiceModal(true);
  }

  function openEditService(service) {
    revokeAll(sCoverPreviews);
    setServiceMode("edit");
    setEditingService(service);
    setSName(service?.name || "");
    setSCovers([]);
    setSCoverPreviews([]);
    setSExistingCoverUrls(getServiceCoverUrls(service));
    setOpenServiceModal(true);
  }

  async function submitService(e) {
    e.preventDefault();

    if (!sName.trim()) return showToast("error", "يرجى كتابة عنوان القسم");
    if (serviceMode === "edit" && !editingService?.id)
      return showToast("error", "تعذر تحديد القسم للتعديل");
    if (serviceMode === "add" && (!sCovers || sCovers.length === 0))
      return showToast("error", "يرجى رفع صورة غلاف واحدة على الأقل");

    try {
      const fd = new FormData();
      fd.append("name", sName);
      [...sCovers].slice(0, 5).forEach((f) => fd.append("coverImages", f));

      if (serviceMode === "add") {
        await api.post("/services/", fd, { headers: { "Content-Type": "multipart/form-data" } });
        showToast("success", "تمت إضافة القسم ✅");
      } else {
        await api.put(`/services/${editingService.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("success", "تم تعديل القسم ✅");
      }

      setOpenServiceModal(false);
      revokeAll(sCoverPreviews);
      setSCoverPreviews([]);
      setSCovers([]);
      setSExistingCoverUrls([]);
      await init();
    } catch (err) {
      showApiError(err);
    }
  }

  function deleteService(service) {
    const id = service?.id;
    if (!id) return;

    if (isProtectedService(service)) return showToast("error", "هذا القسم محمي ولا يمكن حذفه");

    askConfirm({
      title: "تأكيد حذف القسم",
      message: `هل أنت متأكد أنك تريد حذف القسم: "${service?.name || ""}" ؟\nقد تُحذف التغطيات التابعة له.`,
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await api.delete(`/services/${id}`);
          showToast("success", "تم حذف القسم ✅");
          closeConfirm();
          await init();
        } catch (err) {
          closeConfirm();
          showApiError(err);
        }
      },
    });
  }

  /* ===================== OCCASIONS ===================== */

  function openAddOccasion(serviceId) {
    revokeAll(oThumbPreviews);
    setOccasionMode("add");
    setEditingOccasion(null);

    setTargetServiceId(serviceId);
    setOTitle("");
    setODesc("");
    setODate("");

    setOThumbFiles([]);
    setOThumbPreviews([]);
    setOExistingThumbUrls([]);
    setOpenOccasionModal(true);
  }

  function openEditOccasion(serviceId, occasion) {
    revokeAll(oThumbPreviews);
    setOccasionMode("edit");
    setEditingOccasion(occasion);

    setTargetServiceId(serviceId);
    setOTitle(occasion?.title || "");
    setODesc(occasion?.description || "");
    setODate(occasion?.date || "");

    setOExistingThumbUrls(getOccasionThumbUrls(occasion));
    setOThumbFiles([]);
    setOThumbPreviews([]);
    setOpenOccasionModal(true);
  }

  // ✅ form-data: title, date, description, thumbnails(file واحد)
  async function submitOccasion(e) {
    e.preventDefault();
    if (!targetServiceId) return;

    if (!oTitle.trim()) return showToast("error", "يرجى كتابة عنوان التغطية");
    if (occasionMode === "add" && oThumbFiles.length === 0)
      return showToast("error", "يرجى رفع كفر واحد");
    if (occasionMode === "edit" && !editingOccasion?.id)
      return showToast("error", "تعذر تحديد التغطية للتعديل");

    try {
      const fd = new FormData();
      fd.append("title", oTitle);
      fd.append("date", oDate || "");
      fd.append("description", oDesc || "");

      // ✅ صورة واحدة فقط
     if (oThumbFiles[0]) fd.append("images", oThumbFiles[0]);

      if (occasionMode === "add") {
        await api.post(`/services/${targetServiceId}/occasions`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("success", "تمت إضافة التغطية ✅");
      } else {
        await api.put(`/services/${targetServiceId}/occasions/${editingOccasion.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast("success", "تم تعديل التغطية ✅");
      }

      setOpenOccasionModal(false);
      revokeAll(oThumbPreviews);
      setOThumbPreviews([]);
      setOThumbFiles([]);
      setOExistingThumbUrls([]);

      await fetchOccasionsForService(targetServiceId);
      await fetchStats();
    } catch (err) {
      showApiError(err);
    }
  }

  function deleteOccasion(serviceId, occasion) {
    const id = occasion?.id;
    if (!id) return;

    askConfirm({
      title: "تأكيد حذف التغطية",
      message: `هل أنت متأكد أنك تريد حذف التغطية: "${occasion?.title || ""}" ؟\nقد تُحذف صور التغطية التابعة لها.`,
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await api.delete(`/services/${serviceId}/occasions/${id}`);
          showToast("success", "تم حذف التغطية ✅");
          closeConfirm();
          await fetchOccasionsForService(serviceId);
          await fetchStats();
        } catch (err) {
          closeConfirm();
          showApiError(err);
        }
      },
    });
  }

  /* ===================== ALBUM MANAGER ===================== */

  async function openAlbumPhotos(occasionId) {
    setPhotosOccasionId(occasionId);
    setOpenPhotosModal(true);
    setPhotosLoading(true);
    setSelectedPhotoIds(new Set());

    try {
      const res = await api.get(`/uploads-manager/photos/occasion/${occasionId}?t=${Date.now()}`);
      const arr = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setPhotos(arr);
    } catch (err) {
      showApiError(err);
    } finally {
      setPhotosLoading(false);
    }
  }

  function openAlbumManager(occasionId) {
    openAlbumPhotos(occasionId);

    revokeAll(uploadPreviews);
    setUploadOccasionId(occasionId);
    setUploadImages([]);
    setUploadPreviews([]);

    setBatchProg({
      running: false,
      uploaded: 0,
      total: 0,
      batchIndex: 0,
      totalBatches: 0,
      percent: 0,
      failedBatches: 0,
    });
  }

  function toggleSelectPhoto(id) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllPhotos() {
    setSelectedPhotoIds(new Set(photos.map((p) => p.id)));
  }

  function clearSelectedPhotos() {
    setSelectedPhotoIds(new Set());
  }

  async function deleteSelectedPhotos() {
    const ids = Array.from(selectedPhotoIds)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n));

    if (!ids.length) return showToast("error", "ما فيه صور محددة للحذف");

    try {
      await api.post("/uploads-manager/photos/bulk-delete", { photoIds: ids });
      setPhotos((prev) => prev.filter((p) => !ids.includes(Number(p.id))));
      setSelectedPhotoIds(new Set());
      await fetchStats();
      showToast("success", `تم حذف ${ids.length} صورة ✅`);
    } catch (err) {
      showApiError(err);
    }
  }

  // ✅ رفع دفعات (نفس API، نفس الحقول)
  async function uploadInBatchesSameApi({ occasionId, allFiles }) {
    const BATCH_SIZE = 50;
    const totalBatches = Math.ceil(allFiles.length / BATCH_SIZE);

    setBatchProg({
      running: true,
      uploaded: 0,
      total: allFiles.length,
      batchIndex: 1,
      totalBatches,
      percent: 0,
      failedBatches: 0,
    });

    let uploaded = 0;
    let failedBatches = 0;

    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      const fd = new FormData();
      fd.append("occasionId", occasionId);
      batch.forEach((file) => fd.append("images", file));

      try {
        await api.post("/uploads-manager/upload", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 10 * 60 * 1000,
          onUploadProgress: (pe) => {
            const percentBatch = pe?.total ? Math.round((pe.loaded * 100) / pe.total) : 0;
            const approxOverall = Math.min(
              100,
              Math.round(((uploaded + (percentBatch / 100) * batch.length) * 100) / allFiles.length)
            );

            setBatchProg((p) => ({
              ...p,
              running: true,
              total: allFiles.length,
              batchIndex: batchNumber,
              totalBatches,
              uploaded,
              percent: approxOverall,
              failedBatches,
            }));
          },
        });

        uploaded += batch.length;

        setBatchProg((p) => ({
          ...p,
          running: true,
          uploaded,
          total: allFiles.length,
          batchIndex: batchNumber,
          totalBatches,
          percent: Math.round((uploaded * 100) / allFiles.length),
          failedBatches,
        }));

        showToast("success", `تم رفع الدفعة ${batchNumber}/${totalBatches} ✅ (${uploaded}/${allFiles.length})`);
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        failedBatches += 1;

        if (err?.code === "ECONNABORTED") {
          showToast("error", `انتهت مهلة رفع الدفعة ${batchNumber}.`);
        } else {
          showToast("error", `فشلت الدفعة ${batchNumber}/${totalBatches} — جاري المتابعة`);
        }

        setBatchProg((p) => ({
          ...p,
          running: true,
          failedBatches,
          batchIndex: batchNumber,
        }));
        console.error(err);
      }
    }

    setBatchProg((p) => ({
      ...p,
      running: false,
      uploaded,
      total: allFiles.length,
      percent: Math.round((uploaded * 100) / allFiles.length),
      failedBatches,
    }));

    if (failedBatches > 0) showToast("error", `اكتمل الرفع مع مشاكل: ${uploaded}/${allFiles.length}`);
    else showToast("success", "اكتمل رفع الصور ✅");

    return { uploaded, failedBatches };
  }

  async function uploadFromManager() {
    if (!uploadOccasionId || uploadImages.length === 0) return showToast("error", "اختر صور قبل الرفع");

    try {
      showToast("success", `بدء رفع ${uploadImages.length} صورة على دفعات...`);

      await uploadInBatchesSameApi({
        occasionId: uploadOccasionId,
        allFiles: uploadImages,
      });

      revokeAll(uploadPreviews);
      setUploadImages([]);
      setUploadPreviews([]);

      await openAlbumPhotos(photosOccasionId);
      await fetchStats();
    } catch (err) {
      showApiError(err);
    }
  }

  /* ===================== RENDER ===================== */

  return (
    <>
      <Header />

      <section dir="rtl" className="min-h-screen bg-[#202C28] font-Vazirmatn">
        <Toast
          open={toast.open}
          type={toast.type}
          msg={toast.msg}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
        />

        <div className="pt-28 sm:pt-32 pb-8 text-center text-white/90">
          <h1 className="text-2xl sm:text-4xl font-semibold">
            حياك الله <span className="text-[#D8AC4B]">عمر</span>
          </h1>
        </div>

        <SectionBar title="الإحصائيات" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 text-center">
          {loading ? (
            <div className="text-center text-white/60">تحميل...</div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4 text-center">
              <StatCard icon={<MdOutlinePhotoLibrary />} label="عدد الأقسام" value={stats.services} />
              <StatCard icon={<BsCamera />} label="عدد التغطيات" value={stats.occasions} />
              <StatCard icon={<FiUsers />} label="عدد الصور" value={stats.totalPhotos} />
            </div>
          )}
        </div>

        <SectionBar title="قسم تعديل الموقع" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <div className="text-center text-white/90 text-xl sm:text-2xl font-semibold">تعديل الأقسام الرئيسية</div>

          <div className="flex justify-center">
            <Button type="button" onClick={openAddService} className="bg-[#D8AC4B] text-white hover:opacity-90">
              إضافة
            </Button>
          </div>

          <div className="border border-[#D8AC4B]/60 rounded-lg p-4 sm:p-6">
            <div className="space-y-3">
              {services.map((s) => (
                <RowBox
                  key={s.id}
                  right={<div className="font-Vazirmatn font-semibold text-[#202C28]">{s.name}</div>}
                  left={
                    <>
                      {!isProtectedService(s) && (
                        <button
                          type="button"
                          onClick={() => deleteService(s)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
                          title="حذف"
                        >
                          <FaTrash />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditService(s)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded px-4 py-2"
                        title="تعديل"
                      >
                        <FaPen />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          </div>

          {servicesWithOccasions.map((s) => (
            <div key={s.id} className="space-y-4">
              <div className="text-center text-white/90 text-xl sm:text-2xl font-semibold">تعديل قسم {s.name}</div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={() => openAddOccasion(s.id)}
                  className="bg-[#D8AC4B] text-white hover:opacity-90"
                >
                  إضافة
                </Button>
              </div>

              <div className="border border-[#D8AC4B]/60 rounded-lg p-4 sm:p-6">
                <div className="space-y-3">
                  {s.occasions.map((o) => (
                    <RowBox
                      key={o.id}
                      right={
                        <div className="text-right">
                          <div className="font-Vazirmatn text-[#202C28] font-semibold">{o.title}</div>
                          {o.date ? <div className="text-xs text-[#202C28]/70">{o.date}</div> : null}
                        </div>
                      }
                      left={
                        <>
                          <button
                            type="button"
                            onClick={() => deleteOccasion(s.id, o)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded px-4 py-2"
                            title="حذف"
                          >
                            <FaTrash />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditOccasion(s.id, o)}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white rounded px-4 py-2"
                            title="تعديل"
                          >
                            <FaPen />
                          </button>

                          <button
                            type="button"
                            onClick={() => openAlbumManager(o.id)}
                            className="bg-[#3C635A] hover:opacity-90 text-white rounded px-4 py-2"
                            title="إدارة صور التغطية"
                          >
                            إدارة الصور
                          </button>
                        </>
                      }
                    />
                  ))}

                  {s.occasions.length === 0 && (
                    <div className="text-center text-white/60 py-6">ما فيه عناصر داخل {s.name} حالياً</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== Service Modal ===== */}
        <Modal
          open={openServiceModal}
          onClose={() => {
            revokeAll(sCoverPreviews);
            setSCoverPreviews([]);
            setSCovers([]);
            setSExistingCoverUrls([]);
            setOpenServiceModal(false);
          }}
          title={serviceMode === "add" ? "إضافة قسم" : "تعديل قسم"}
          max="max-w-3xl"
        >
          <form onSubmit={submitService} className="space-y-6">
            <div>
              <FieldLabel>عنوان الصفحة</FieldLabel>
              <Input value={sName} onChange={(e) => setSName(e.target.value)} />
            </div>

            <div>
              <FieldLabel>صور القسم (حد أقصى 5)</FieldLabel>
              <label className="cursor-pointer bg-[#3C635A] text-white px-6 py-3 rounded-md inline-block">
                اختيار الصور
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files || []);
                    if (!picked.length) return;

                    const merged = [...sCovers, ...picked].slice(0, 5);
                    if (sCovers.length + picked.length > 5)
                      showToast("error", "حد الصور 5 فقط (تم تجاهل الزائد)");

                    revokeAll(sCoverPreviews);
                    setSCovers(merged);
                    setSCoverPreviews(merged.map((f) => URL.createObjectURL(f)));
                    e.target.value = null;
                  }}
                />
              </label>

              {serviceMode === "edit" && sExistingCoverUrls.length > 0 && (
                <div className="mt-4">
                  <div className="text-right text-sm font-Vazirmatn text-[#3C635A] mb-2">صور الغلاف الحالية</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sExistingCoverUrls.map((src, idx) => (
                      <div key={idx} className="rounded-md overflow-hidden border border-[#3C635A]/20">
                        <img src={src} alt={`old-cover-${idx}`} className="w-full h-24 sm:h-28 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sCoverPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="text-right text-sm font-Vazirmatn text-[#3C635A] mb-2">
                    صور جديدة (سيتم رفعها عند الحفظ)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sCoverPreviews.map((src, idx) => (
                      <div key={idx} className="relative rounded-md overflow-hidden border border-[#3C635A]/20">
                        <img src={src} alt={`new-cover-${idx}`} className="w-full h-24 sm:h-28 object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-md p-1.5 shadow"
                          onClick={() => {
                            setSCovers((prev) => prev.filter((_, i) => i !== idx));
                            setSCoverPreviews((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#3C635A] text-white hover:opacity-90 px-10">
                {serviceMode === "add" ? "إضافة" : "تعديل"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ===== Occasion Modal ===== */}
        <Modal
          open={openOccasionModal}
          onClose={() => {
            revokeAll(oThumbPreviews);
            setOThumbPreviews([]);
            setOThumbFiles([]);
            setOExistingThumbUrls([]);
            setEditingOccasion(null);
            setOccasionMode("add");
            setOpenOccasionModal(false);
          }}
          title={occasionMode === "add" ? "إضافة" : "تعديل"}
          max="max-w-3xl"
        >
          <form onSubmit={submitOccasion} className="space-y-6">
            <div>
              <FieldLabel>عنوان الصفحة</FieldLabel>
              <Input value={oTitle} onChange={(e) => setOTitle(e.target.value)} />
            </div>

            <div>
              <FieldLabel>التاريخ</FieldLabel>
              <Input type="date" value={oDate} onChange={(e) => setODate(e.target.value)} />
            </div>

            <div>
              <FieldLabel>وصف الصفحة</FieldLabel>
              <Textarea value={oDesc} onChange={(e) => setODesc(e.target.value)} />
            </div>

            {/* ✅ كفر واحد فقط */}
            <div>
              <FieldLabel>كفر التغطية (صورة واحدة فقط)</FieldLabel>
              <label className="cursor-pointer bg-[#3C635A] text-white px-6 py-3 rounded-md inline-block">
                اختيار صورة
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = (e.target.files || [])[0];
                    if (!file) return;

                    revokeAll(oThumbPreviews);
                    setOThumbFiles([file]);
                    setOThumbPreviews([URL.createObjectURL(file)]);
                    e.target.value = null;
                  }}
                />
              </label>

              {occasionMode === "edit" && oExistingThumbUrls.length > 0 && (
                <div className="mt-4">
                  <div className="text-right text-sm font-Vazirmatn text-[#3C635A] mb-2">الكفر الحالي</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {oExistingThumbUrls.map((url, i) => (
                      <div key={i} className="rounded-md overflow-hidden border border-[#3C635A]/20">
                        <img src={url} alt={`old-thumb-${i}`} className="w-full h-24 sm:h-28 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {oThumbPreviews.length > 0 && (
                <div className="mt-4">
                  <div className="text-right text-sm font-Vazirmatn text-[#3C635A] mb-2">
                    كفر جديد (سيتم رفعه عند الحفظ)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {oThumbPreviews.map((src, i) => (
                      <div key={i} className="rounded-md overflow-hidden border border-[#3C635A]/20">
                        <img src={src} alt={`new-thumb-${i}`} className="w-full h-24 sm:h-28 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" className="bg-[#3C635A] text-white hover:opacity-90 px-10">
                {occasionMode === "add" ? "إضافة" : "حفظ التعديل"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ===== Photos Modal ===== */}
        <Modal
          open={openPhotosModal}
          onClose={() => {
            setOpenPhotosModal(false);
            setPhotosOccasionId(null);
            setPhotos([]);
            setSelectedPhotoIds(new Set());
            revokeAll(uploadPreviews);
            setUploadImages([]);
            setUploadPreviews([]);
            setUploadOccasionId(null);
            setBatchProg({
              running: false,
              uploaded: 0,
              total: 0,
              batchIndex: 0,
              totalBatches: 0,
              percent: 0,
              failedBatches: 0,
            });
          }}
          title="إدارة صور التغطية"
          max="max-w-5xl"
        >
          <div className="bg-white/70 rounded-md p-3 border border-[#3C635A]/20 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-Vazirmatn text-[#3C635A] font-semibold">رفع صور جديدة</div>

              <label className="cursor-pointer bg-[#3C635A] text-white px-4 py-2 rounded-md inline-block">
                اختيار الصور
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={batchProg.running}
                  onChange={(e) => {
                    revokeAll(uploadPreviews);
                    const files = Array.from(e.target.files || []);
                    setUploadImages(files);
                    setUploadPreviews(files.map((f) => URL.createObjectURL(f)));
                  }}
                />
              </label>

              <button
                type="button"
                disabled={!uploadImages.length || batchProg.running}
                onClick={uploadFromManager}
                className="bg-[#D8AC4B] text-white rounded-md px-4 py-2 hover:opacity-90 disabled:opacity-50"
              >
                {batchProg.running ? "جارٍ الرفع..." : "رفع"}
              </button>
            </div>

            {batchProg.total > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-Vazirmatn text-[#3C635A] mb-2">
                  <div>
                    {batchProg.running ? (
                      <>
                        دفعة {batchProg.batchIndex}/{batchProg.totalBatches} — {batchProg.uploaded}/{batchProg.total} (
                        {batchProg.percent}%)
                      </>
                    ) : (
                      <>
                        اكتمل: {batchProg.uploaded}/{batchProg.total} ({batchProg.percent}%)
                        {batchProg.failedBatches ? ` — دفعات فشلت: ${batchProg.failedBatches}` : ""}
                      </>
                    )}
                  </div>
                  <div>{batchProg.percent}%</div>
                </div>

                <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-[#3C635A]/20">
                  <div
                    className="h-full bg-[#3C635A]"
                    style={{ width: `${Math.max(0, Math.min(100, batchProg.percent))}%` }}
                  />
                </div>
              </div>
            )}

            {uploadPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                {uploadPreviews.map((src, idx) => (
                  <div key={idx} className="rounded-md overflow-hidden border border-[#3C635A]/20">
                    <img src={src} alt={`new-${idx}`} className="w-full h-20 object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {photosLoading ? (
            <div className="text-center font-Vazirmatn text-[#3C635A]">تحميل...</div>
          ) : photos.length === 0 ? (
            <div className="text-center font-Vazirmatn text-[#3C635A]">لا توجد صور</div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="text-right text-[#3C635A] font-Vazirmatn font-semibold">
                  عدد الصور: {photos.length} — المحدد: {selectedPhotoIds.size}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllPhotos}
                    className="bg-[#3C635A] text-white rounded-md px-4 py-2 hover:opacity-90"
                  >
                    تحديد الكل
                  </button>

                  <button
                    type="button"
                    onClick={clearSelectedPhotos}
                    className="bg-white text-[#3C635A] rounded-md px-4 py-2 hover:opacity-90 border border-[#3C635A]/20"
                  >
                    إلغاء التحديد
                  </button>

                  <button
                    type="button"
                    onClick={deleteSelectedPhotos}
                    disabled={selectedPhotoIds.size === 0}
                    className="bg-red-600 text-white rounded-md px-4 py-2 hover:bg-red-700 disabled:opacity-50"
                  >
                    حذف المحدد
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((p) => {
                  const src = getPhotoSrc(p);
                  const checked = selectedPhotoIds.has(p.id);

                  return (
                    <div
                      key={p.id}
                      className={[
                        "relative rounded-md overflow-hidden border",
                        checked ? "border-[#D8AC4B]" : "border-[#3C635A]/20",
                      ].join(" ")}
                    >
                      <img src={src} alt={`photo-${p.id}`} className="w-full h-28 sm:h-32 object-cover" />

                      <label className="absolute top-2 right-2 flex items-center gap-2 bg-black/55 text-white rounded-md px-2 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelectPhoto(p.id)}
                          className="accent-[#D8AC4B]"
                        />
                        <span className="text-xs font-Vazirmatn">تحديد</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Modal>

        {/* ===== Confirm Delete Modal ===== */}
        <Modal
          open={confirm.open}
          onClose={confirm.loading ? () => {} : closeConfirm}
          title={confirm.title || "تأكيد"}
          max="max-w-lg"
        >
          <div className="space-y-6">
            <div className="font-Vazirmatn text-[#3C635A] text-right whitespace-pre-line leading-7">
              {confirm.message}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={confirm.loading}
                onClick={closeConfirm}
                className="bg-white text-[#3C635A] rounded-md px-5 py-2 hover:opacity-90 border border-[#3C635A]/20 disabled:opacity-50"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={confirm.loading}
                onClick={() => confirm.onConfirm?.()}
                className="bg-red-600 text-white rounded-md px-6 py-2 font-Vazirmatn hover:opacity-90 disabled:opacity-50"
              >
                {confirm.loading ? "جارٍ الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </Modal>
      </section>
    </>
  );
}