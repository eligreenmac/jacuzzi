"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  ShieldAlert,
  Info,
  Calendar,
  Clock,
  Cpu,
  Zap,
  ChevronRight,
} from "lucide-react";
import { compressImageForAI } from "@/lib/image-utils";

export default function InventoryPage() {
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Photo-first AI Identification Form State
  const [imagePreview, setImagePreview] = useState("");
  const [imageMimeType, setImageMimeType] = useState("");
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [scanStage, setScanStage] = useState<"IDLE" | "COMPRESSING" | "SCANNING_AI" | "DECODING" | "DONE">("IDLE");
  const [scanStats, setScanStats] = useState<{ original: string; compressed: string; reduction: number } | null>(null);
  const [scanSeconds, setScanSeconds] = useState(0);
  const [identifiedData, setIdentifiedData] = useState<any>(null);

  // Editable fields (auto-filled by AI Vision OCR, with full manual override)
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("OTHER");
  const [customUnit, setCustomUnit] = useState("GRAMS");
  const [customActiveIngredients, setCustomActiveIngredients] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  const [quantity, setQuantity] = useState("500");
  const [minThreshold, setMinThreshold] = useState("100");
  const [addedDate, setAddedDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Existing Chemical State
  const [editingChemical, setEditingChemical] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "OTHER",
    quantity: "500",
    unit: "GRAMS",
    minThreshold: "100",
    notes: "",
    addedDate: "",
  });

  const [showInventoryGuide, setShowInventoryGuide] = useState(false);

  const loadChemicals = async () => {
    try {
      const res = await fetch("/api/chemicals");
      if (res.ok) {
        const data = await res.json();
        setChemicals(data.chemicals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChemicals();
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("has_seen_inventory_guide");
      if (!hasSeen) {
        setShowInventoryGuide(true);
      }
    }
  }, []);

  const handleDismissInventoryGuide = () => {
    setShowInventoryGuide(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("has_seen_inventory_guide", "true");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setIsScanningPhoto(true);
    setScanStage("COMPRESSING");
    setScanSeconds(0);
    setScanStats(null);
    setIdentifiedData(null);

    const startTime = Date.now();
    const timer = setInterval(() => {
      setScanSeconds(parseFloat(((Date.now() - startTime) / 1000).toFixed(1)));
    }, 100);

    try {
      // 1. Client-side instant image compression & optimization (< 100ms)
      const compressed = await compressImageForAI(file, 1200, 0.8);
      setImagePreview(compressed.base64);
      setImageMimeType(compressed.mimeType);
      setScanStats({
        original: compressed.originalSizeReadable,
        compressed: compressed.compressedSizeReadable,
        reduction: compressed.reductionPercentage,
      });

      // 2. High-Speed AI Vision OCR & Chemical Extraction
      setScanStage("SCANNING_AI");
      const res = await fetch("/api/ai/identify-chemical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          imageMimeType: compressed.mimeType,
        }),
      });

      setScanStage("DECODING");
      const json = await res.json();
      if (json.success && json.data) {
        setIdentifiedData(json.data);
        setCustomName(json.data.name || "");
        setCustomCategory(json.data.category || "OTHER");
        setCustomUnit(json.data.unit || "GRAMS");
        setCustomActiveIngredients(json.data.activeIngredients || "");
        if (json.data.defaultMinThreshold) {
          setMinThreshold(json.data.defaultMinThreshold.toString());
        }
        setScanStage("DONE");
      } else {
        setErrorMsg(json.error || "לא ניתן היה לפענח את התמונה. ניתן להזין את פרטי החומר ידנית.");
        setScanStage("IDLE");
      }
    } catch (err: any) {
      console.error("Failed to identify photo:", err);
      setErrorMsg(err.message || "שגיאה בפענוח התמונה. ניתן להזין את פרטי החומר ידנית.");
      setScanStage("IDLE");
    } finally {
      clearInterval(timer);
      setIsScanningPhoto(false);
    }
  };

  const handleSaveChemical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      setErrorMsg("חובה להעלות צילום של החומר לזיהוי");
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const finalName = customName.trim() || identifiedData?.name || "חומר ללא שם";
    const finalCategory = customCategory || identifiedData?.category || "OTHER";
    const finalUnit = customUnit || identifiedData?.unit || "GRAMS";

    try {
      const res = await fetch("/api/chemicals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          category: finalCategory,
          quantity: parseFloat(quantity) || 0,
          unit: finalUnit,
          minThreshold: parseFloat(minThreshold) || 100,
          imageUrl: imagePreview,
          notes: customActiveIngredients ? `חומר פעיל: ${customActiveIngredients}. ` + (identifiedData?.usageSummary || "") : (identifiedData?.usageSummary || identifiedData?.safetyNotes || ""),
          addedDate: addedDate ? new Date(addedDate).toISOString() : new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setImagePreview("");
        setIdentifiedData(null);
        setCustomName("");
        setCustomCategory("OTHER");
        setCustomActiveIngredients("");
        setQuantity("500");
        setAddedDate(new Date().toISOString().split("T")[0]);
        loadChemicals();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "שגיאה בשמירת החומר");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChemical = async (id: string) => {
    if (!confirm("האם למחוק פריט זה מהארון?")) return;
    try {
      await fetch(`/api/chemicals?id=${id}`, { method: "DELETE" });
      loadChemicals();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (chem: any) => {
    setEditingChemical(chem);
    setEditForm({
      name: chem.name || "",
      category: chem.category || "OTHER",
      quantity: chem.quantity?.toString() || "0",
      unit: chem.unit || "GRAMS",
      minThreshold: chem.minThreshold?.toString() || "100",
      notes: chem.notes || "",
      addedDate: chem.addedDate ? new Date(chem.addedDate).toISOString().split("T")[0] : "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateChemical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChemical) return;
    setSaving(true);
    try {
      const res = await fetch("/api/chemicals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingChemical.id,
          name: editForm.name,
          category: editForm.category,
          quantity: parseFloat(editForm.quantity) || 0,
          unit: editForm.unit,
          minThreshold: parseFloat(editForm.minThreshold) || 100,
          notes: editForm.notes,
          addedDate: editForm.addedDate ? new Date(editForm.addedDate).toISOString() : undefined,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        setEditingChemical(null);
        loadChemicals();
      } else {
        const d = await res.json();
        alert(d.error || "שגיאה בעדכון החומר");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    setIsAiModalOpen(true);
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/inventory-check", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const updateQuantityQuick = async (chem: any, delta: number) => {
    const newQty = Math.max(0, chem.quantity + delta);
    try {
      await fetch("/api/chemicals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: chem.id, quantity: newQty }),
      });
      setChemicals((prev) =>
        prev.map((c) => (c.id === chem.id ? { ...c, quantity: newQty } : c))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const categoryLabels: Record<string, string> = {
    SANITIZER: "חיטוי (כלור / ברום)",
    PH_MINUS: "מוריד pH",
    PH_PLUS: "מעלה pH / בסיסיות",
    SHOCK: "שוק מחמצן",
    ANTI_FOAM: "מסיר קצף (Anti-Foam)",
    CLARIFIER: "מצליל מים",
    TEST_STRIPS: "מקלונים לבדיקה",
    CLEANER: "שטיפת צנרת / פילטר",
    OTHER: "אחר",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Return to Dashboard / Control Cards Button */}
      <div className="flex items-center justify-between pb-3 border-b border-sky-900/40">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 cursor-pointer select-none"
        >
          <ChevronRight className="w-4 h-4" />
          <span>חזרה לכרטיסי הבקרה</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-cyan-400" />
            <span>ארון חומרים ומלאי כימיקלים</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            מעקב תאריכי הוספה לארון, צילומי אריזות, כמויות שנותרו ואיתור חומרים חסרים.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAiAnalysis}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/20 transition-all hover:scale-105"
          >
            <Sparkles className="w-4 h-4" />
            <span>בדוק חומרים חסרים ב-AI</span>
          </button>

          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setImagePreview("");
              setIdentifiedData(null);
              setAddedDate(new Date().toISOString().split("T")[0]);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-600/20 transition-all hover:scale-105"
          >
            <Camera className="w-4 h-4" />
            <span>צלם והוסף חומר לארון</span>
          </button>
        </div>
      </div>

      {/* Inventory Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-cyan-400">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      ) : chemicals.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
          <Camera className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">ארון החומרים ריק</h3>
            <p className="text-sm text-slate-400">צלם את אריזת החומר שקנית וה-AI יזהה ויתעד את תאריך ההוספה</p>
          </div>
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setImagePreview("");
              setIdentifiedData(null);
              setAddedDate(new Date().toISOString().split("T")[0]);
            }}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>צלם חומר ראשון</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chemicals.map((chem) => {
            const isLow = chem.quantity <= (chem.minThreshold || 100);
            const dateStr = chem.addedDate
              ? new Date(chem.addedDate).toLocaleDateString("he-IL")
              : new Date(chem.createdAt).toLocaleDateString("he-IL");

            return (
              <div
                key={chem.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isLow ? "border-rose-900/80 shadow-rose-950/20 shadow-lg" : "border-slate-800 hover:border-cyan-500/40"
                }`}
              >
                <div className="space-y-3">
                  {chem.imageUrl ? (
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img src={chem.imageUrl} alt={chem.name} className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-800/60">
                        {categoryLabels[chem.category] || chem.category}
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 w-full rounded-2xl bg-slate-950/80 border border-slate-850 flex items-center justify-between px-4">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                        <Package className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-slate-900 text-[11px] font-semibold text-slate-300 border border-slate-800">
                        {categoryLabels[chem.category] || chem.category}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-white">{chem.name}</h3>
                      {isLow && (
                        <span className="text-[10px] bg-rose-950 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>מלאי נמוך</span>
                        </span>
                      )}
                    </div>

                    {/* Date added badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-cyan-400/80 pt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>תאריך הוספה לארון: {dateStr}</span>
                    </div>

                    {chem.lastUsedDate && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>
                          שימוש אחרון: {new Date(chem.lastUsedDate).toLocaleDateString("he-IL")} ({chem.lastUsedAmount} {chem.unit === "GRAMS" ? "ג'" : 'מ"ל'})
                        </span>
                      </div>
                    )}

                    {chem.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{chem.notes}</p>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">כמות נוכחית בארון:</span>
                    <span className="font-black text-sm text-cyan-300">
                      {chem.quantity} {chem.unit === "GRAMS" ? 'גר\'' : chem.unit === "ML" ? 'מ"ל' : chem.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantityQuick(chem, -50)}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center transition-colors"
                        title="הפחת 50"
                      >
                        -50
                      </button>
                      <button
                        onClick={() => updateQuantityQuick(chem, 50)}
                        className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-bold flex items-center justify-center transition-colors"
                        title="הוסף 50"
                      >
                        +50
                      </button>
                      <button
                        onClick={() => updateQuantityQuick(chem, 200)}
                        className="w-8 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-bold flex items-center justify-center transition-colors"
                        title="הוסף 200"
                      >
                        +200
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(chem)}
                        className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                        title="ערוך פרטי חומר"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChemical(chem.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="מחק מהארון"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo-First Add Chemical Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <span>זיהוי חומר לפי צילום (Gemini 3.7 Vision)</span>
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setImagePreview("");
                  setIdentifiedData(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveChemical} className="space-y-5">
              {/* Step 1: Photo Upload Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  1. צלם את האריזה או התווית של החומר:
                </label>

                {!imagePreview ? (
                  <label className="border-2 border-dashed border-cyan-800/60 hover:border-cyan-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="text-sm font-bold text-white block">לחץ כאן לצילום או בחירת תמונה</span>
                      <span className="text-xs text-slate-400 block">התמונה תכווץ אוטומטית לזיהוי אולטרה-מהיר ב-AI</span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-[11px] text-cyan-300 mt-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>דחיסה חכמה + זיהוי OCR תווית ב-1-2 שניות בלבד</span>
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-lg">
                    <img src={imagePreview} alt="צילום חומר" className="w-full h-52 object-contain bg-slate-950" />

                    {/* Active AI Scanning Overlay with laser beam & thinking animation */}
                    {isScanningPhoto && (
                      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-3 animate-in fade-in">
                        {/* Laser Scan Animation Line */}
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce" />

                        {/* Pulsing AI Icon */}
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 animate-pulse">
                            <Sparkles className="w-7 h-7 text-white animate-spin" style={{ animationDuration: "3s" }} />
                          </div>
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
                          </span>
                        </div>

                        <div className="space-y-1 max-w-xs">
                          <div className="flex items-center justify-center gap-1.5 text-sm font-black text-cyan-300">
                            {scanStage === "COMPRESSING" && <span>⚡ ממטב ודוחס תמונה...</span>}
                            {scanStage === "SCANNING_AI" && <span>🤖 רופא מים AI סורק תווית...</span>}
                            {scanStage === "DECODING" && <span>🧪 מפענח רכיבים ומינונים...</span>}
                          </div>
                          <p className="text-[11px] text-slate-300">
                            {scanStage === "COMPRESSING" && "ממיר את הצילום לגודל אופטימלי לקריאת OCR מהירה"}
                            {scanStage === "SCANNING_AI" && "קריאת טקסט מלאה (OCR), יצרן, מותג והוראות בטיחות"}
                            {scanStage === "DECODING" && "חילוץ סוג החומר, יחידת המידה וכמויות מומלצות"}
                          </p>
                        </div>

                        {/* Real-time thinking timer & compression pill */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-[11px] text-amber-300 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                            <span>{scanSeconds.toFixed(1)}s</span>
                          </span>
                          {scanStats && (
                            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-300 font-bold">
                              כווץ: {scanStats.original} ➔ {scanStats.compressed} ({scanStats.reduction}%-)
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Change / Retake Photo Button */}
                    {!isScanningPhoto && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview("");
                          setIdentifiedData(null);
                          setScanStats(null);
                        }}
                        className="absolute top-2 right-2 px-3 py-1.5 bg-black/80 hover:bg-black rounded-full text-white text-xs flex items-center gap-1 shadow-md border border-slate-700"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>החלף תמונה</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Recognized or Editable Chemical Form */}
              {imagePreview && !isScanningPhoto && (
                <div className="space-y-4 p-4 rounded-2xl bg-slate-950/90 border border-cyan-900/60 shadow-inner">
                  {/* Identification Success Banner */}
                  {identifiedData && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/80 to-cyan-950/80 border border-emerald-500/50 shadow-sm flex items-start gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-emerald-300 block">
                          ✓ זוהה בהצלחה: {identifiedData.name}
                        </span>
                        <p className="text-[11px] text-slate-300 leading-tight">
                          {identifiedData.activeIngredients ? `חומר פעיל: ${identifiedData.activeIngredients}. ` : ""}
                          {identifiedData.usageSummary || "הפרטים נטענו אוטומטית לשדות למטה — ניתן לערוך כל שדה."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                      <Sparkles className="w-4 h-4" />
                      <span>{identifiedData ? "פרטי החומר (חולצו ב-AI — ניתן לערוך הכל):" : "פרטי החומר לארון:"}</span>
                    </div>
                    {identifiedData && (
                      <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full font-bold">
                        זיהוי חכם ✓
                      </span>
                    )}
                  </div>

                  {/* Chemical Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      1. שם המוצר והמותג (ניתן לעריכה חופשית):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="לדוגמה: מסיר קצף Anti-Foam SpaTime או טבליות ברום"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:border-cyan-500"
                    />
                  </div>

                  {/* Category & Unit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        2. קטגוריית החומר:
                      </label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-cyan-500"
                      >
                        <option value="ANTI_FOAM">🫧 מסיר / מונע קצף (Anti-Foam)</option>
                        <option value="SANITIZER">🧪 חומר חיטוי (כלור / ברום)</option>
                        <option value="PH_MINUS">📉 מוריד pH (חומצה)</option>
                        <option value="PH_PLUS">📈 מעלה pH / בסיסיות</option>
                        <option value="SHOCK">⚡ שוק מחמצן (ללא כלור / מהיר)</option>
                        <option value="CLARIFIER">✨ מצליל מים (Clarifier)</option>
                        <option value="TEST_STRIPS">📏 מקלונים / ערכת בדיקה</option>
                        <option value="CLEANER">🧽 חומר ניקוי / שטיפת פילטר</option>
                        <option value="OTHER">📦 אחר / תוסף תחזוקה</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        3. יחידת מידה:
                      </label>
                      <select
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-cyan-500"
                      >
                        <option value="GRAMS">גרם (אבקה / גרגירים)</option>
                        <option value="ML">מ"ל (נוזל)</option>
                        <option value="TABLETS">טבליות / כדורים</option>
                        <option value="STRIPS">מקלונים</option>
                        <option value="PIECES">יחידות</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Ingredients */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      4. חומר פעיל וריכוז (Active Ingredient):
                    </label>
                    <input
                      type="text"
                      placeholder="לדוגמה: דימתיקון / סודיום דיכלור 56% / סודיום ביסולפט"
                      value={customActiveIngredients}
                      onChange={(e) => setCustomActiveIngredients(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500"
                    />
                  </div>

                  {/* Quantity, Min Threshold & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-300 block">
                        5. כמות שנותרה:
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-sm text-cyan-300 focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-300 block">
                        6. רף התראת חוסר:
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={minThreshold}
                        onChange={(e) => setMinThreshold(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-300 block">7. תאריך הוספה:</span>
                      <input
                        type="date"
                        value={addedDate}
                        onChange={(e) => setAddedDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* Usage Summary & Notes */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      8. הוראות מינון, שימוש ובטיחות:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="הוראות מינון שזוהו או הערות אישיות..."
                      value={customNotes || identifiedData?.usageSummary || ""}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white text-xs resize-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setImagePreview("");
                    setIdentifiedData(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving || !imagePreview || isScanningPhoto}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>שומר בארון...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>שמור חומר בארון</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Chemical Modal */}
      {isEditModalOpen && editingChemical && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <span>עריכת פרטי חומר בארון</span>
              </h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingChemical(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateChemical} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">שם המוצר והמותג:</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-bold text-sm focus:border-cyan-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">קטגוריית החומר:</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-cyan-500"
                  >
                    <option value="ANTI_FOAM">🫧 מסיר / מונע קצף (Anti-Foam)</option>
                    <option value="SANITIZER">🧪 חומר חיטוי (כלור / ברום)</option>
                    <option value="PH_MINUS">📉 מוריד pH (חומצה)</option>
                    <option value="PH_PLUS">📈 מעלה pH / בסיסיות</option>
                    <option value="SHOCK">⚡ שוק מחמצן (ללא כלור / מהיר)</option>
                    <option value="CLARIFIER">✨ מצליל מים (Clarifier)</option>
                    <option value="TEST_STRIPS">📏 מקלונים / ערכת בדיקה</option>
                    <option value="CLEANER">🧽 חומר ניקוי / שטיפת פילטר</option>
                    <option value="OTHER">📦 אחר / תוסף תחזוקה</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">יחידת מידה:</label>
                  <select
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-cyan-500"
                  >
                    <option value="GRAMS">גרם (אבקה / גרגירים)</option>
                    <option value="ML">מ"ל (נוזל)</option>
                    <option value="TABLETS">טבליות / כדורים</option>
                    <option value="STRIPS">מקלונים</option>
                    <option value="PIECES">יחידות</option>
                  </select>
                </div>
              </div>

              {/* Quantity, Threshold & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">כמות שנותרה:</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-sm text-cyan-300 focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">רף התראת חוסר:</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={editForm.minThreshold}
                    onChange={(e) => setEditForm({ ...editForm, minThreshold: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">תאריך הוספה:</label>
                  <input
                    type="date"
                    value={editForm.addedDate}
                    onChange={(e) => setEditForm({ ...editForm, addedDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">הוראות שימוש, חומר פעיל והערות:</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs resize-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingChemical(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>מעדכן...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>שמור שינויים</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Missing Material Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-900/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <span>ניתוח מלאי חומרים וזיהוי חוסרים (Gemini AI)</span>
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiLoading ? (
              <div className="text-center py-12 space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-300 font-medium">הבינה המלאכותית בודקת את תכולת הארון מול דרישות הג'קוזי...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-sm text-purple-200">
                  {aiAnalysis.inventorySummary}
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <span>חומרים קריטיים שחסרים בארון שלך</span>
                  </h3>

                  {aiAnalysis.missingCritical?.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>מעולה! ארון החומרים שלך מצויד בכל הכימיקלים הנדרשים לתחזוקה תקינה.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiAnalysis.missingCritical?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-slate-950/80 border border-rose-900/50 rounded-2xl p-4 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white">{item.nameHe}</span>
                            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-800">
                              {item.urgency === "CRITICAL" ? "חובה קריטית" : "מומלץ מאוד"}
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{item.whyNeeded}</p>
                          <div className="text-[11px] text-cyan-400 pt-1">מוצר מומלץ: {item.suggestedProduct}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {aiAnalysis.safetyRecommendations?.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      <span>הנחיות בטיחות ואחסון</span>
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                      {aiAnalysis.safetyRecommendations.map((tip: string, idx: number) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <div className="text-left pt-2">
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 Inventory Onboarding Guide Modal */}
      {showInventoryGuide && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
          dir="rtl"
          onClick={handleDismissInventoryGuide}
        >
          <div
            className="bg-[#0e1823] border border-sky-500/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 text-right relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-sky-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-950/90 border border-sky-500/60 flex items-center justify-center text-sky-300 shadow-inner">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                    הסבר ליכולות המערכת 📦
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                    ארון חומרים ומלאי 🧪
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">שליטה מלאה במלאי, צילום תוויות וסריקת AI</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismissInventoryGuide}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* General Purpose */}
            <div className="bg-[#080e14]/90 p-3.5 rounded-2xl border border-sky-900/40 text-xs text-slate-200 leading-relaxed">
              <span className="text-sky-300 font-bold block mb-1">למה נועד ארון החומרים?</span>
              <p>
                כאן תוכל לנהל את כל הכימיקלים והחומרים שברשותך, לעקוב אחר יתרות מדויקות בגרמים/מ&quot;ל ולקבל התראות לפני סיום המלאי.
              </p>
            </div>

            {/* Core Capabilities */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>יכולות מרכזיות בארון החומרים:</span>
              </span>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-sky-400 font-bold shrink-0">📸</span>
                  <span><strong>צילום וסריקת תווית עם AI:</strong> זיהוי אוטומטי של שם החומר, מרכיבים פעילים ומינונים מומלצים.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-sky-400 font-bold shrink-0">⚖️</span>
                  <span><strong>מעקב כמויות בזמן אמת:</strong> ניהול כמויות בגרמים/מ&quot;ל וקביעת סף מינימום מותאם.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080e14]/70 border border-sky-900/30 flex items-start gap-2 text-xs text-slate-300 leading-snug">
                  <span className="text-sky-400 font-bold shrink-0">🔔</span>
                  <span><strong>התראות מלאי נמוך:</strong> התראה מיידית כאשר חומר עומד להיגמר כדי שלא תיתקע ללא חיטוי.</span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismissInventoryGuide}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>הבנתי, תודה! 👍</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
