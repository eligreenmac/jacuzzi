"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function InventoryPage() {
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "SANITIZER",
    quantity: "500",
    unit: "GRAMS",
    minThreshold: "100",
    notes: "",
    imageUrl: "",
  });
  const [saving, setSaving] = useState(false);

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
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddChemical = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/chemicals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          category: "SANITIZER",
          quantity: "500",
          unit: "GRAMS",
          minThreshold: "100",
          notes: "",
          imageUrl: "",
        });
        loadChemicals();
      }
    } catch (err) {
      console.error(err);
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
    SHOCK: "שוק מחמצן (ללא כלור)",
    ANTI_FOAM: "מסיר קצף (Anti-Foam)",
    CLARIFIER: "מצליל מים",
    TEST_STRIPS: "מקלונים לבדיקה",
    CLEANER: "שטיפת צנרת / פילטר",
    OTHER: "אחר",
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-cyan-400" />
            <span>ארון חומרים ומלאי כימיקלים</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            מעקב אחר כמויות החומרים שיש לך, צילומי אריזות וזיהוי חומרים קריטיים חסרים בעזרת AI.
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
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-600/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף חומר חדש</span>
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
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">ארון החומרים ריק</h3>
            <p className="text-sm text-slate-400">הוסף את החומרים שיש לך בבית או צלם את האריזות</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף חומר ראשון</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chemicals.map((chem) => {
            const isLow = chem.quantity <= (chem.minThreshold || 100);
            return (
              <div
                key={chem.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                  isLow ? "border-rose-900/80 shadow-rose-950/20 shadow-lg" : "border-slate-800 hover:border-cyan-500/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Photo or Placeholder */}
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

                  {/* Title & Info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-white">{chem.name}</h3>
                      {isLow && (
                        <span className="text-[10px] bg-rose-950 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>מלאי נמוך</span>
                        </span>
                      )}
                    </div>
                    {chem.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{chem.notes}</p>}
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">כמות נוכחית:</span>
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
            );
          })}
        </div>
      )}

      {/* Add Chemical Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>הוספת חומר לארון</span>
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChemical} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">שם החומר</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="למשל: גרגירי כלור מהיר, מוריד pH נוזלי..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">קטגוריה</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="SANITIZER">חיטוי (כלור / ברום)</option>
                    <option value="PH_MINUS">מוריד pH (חומצה)</option>
                    <option value="PH_PLUS">מעלה pH / בסיסיות</option>
                    <option value="SHOCK">שוק ללא כלור (MPS)</option>
                    <option value="ANTI_FOAM">מסיר קצף (Anti-Foam)</option>
                    <option value="CLARIFIER">מצליל מים</option>
                    <option value="TEST_STRIPS">מקלונים לבדיקה</option>
                    <option value="CLEANER">ניקוי פילטר / צנרת</option>
                    <option value="OTHER">אחר</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">יחידת מידה</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="GRAMS">גרמים (ג')</option>
                    <option value="ML">מיליליטר (מ"ל)</option>
                    <option value="TABLETS">טבליות / כדורים</option>
                    <option value="STRIPS">מקלונים (מארז)</option>
                    <option value="PIECES">יחידות</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">כמות נוכחית בארון</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">התראת מלאי נמוך כאשר נותר פחות מ-</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">צילום של האריזה / תווית</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold transition-colors border border-slate-700">
                    <Camera className="w-4 h-4" />
                    <span>בחר תמונה / צלם</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {formData.imageUrl && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>תמונה נטענה בהצלחה</span>
                    </span>
                  )}
                </div>

                {formData.imageUrl && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-700 mt-2">
                    <img src={formData.imageUrl} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="absolute top-1 right-1 p-1 bg-black/70 rounded-full text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">הערות נוספות (הוראות שימוש / מותג)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="למשל: נרכש ב-2026, יצרן HTH..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
                >
                  {saving ? "שומר..." : "שמור חומר בארון"}
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

                {/* Missing Materials */}
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

                {/* Safety Tips */}
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
    </div>
  );
}
