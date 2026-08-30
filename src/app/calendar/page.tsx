"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Star,
  RefreshCw,
  BookOpen,
  Filter,
  AlertCircle,
  X,
} from "lucide-react";

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState<"TASKS" | "DIARY">("TASKS");
  const [tasks, setTasks] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Add Task Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    category: "WEEKLY",
    frequencyDays: "7",
    priority: "MEDIUM",
  });

  // Add Diary Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    waterQualityRating: "5",
  });

  // Email state
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [tasksRes, logsRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/log")]);

      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setEntries(lData.entries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkDone = async (taskId: string) => {
    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, markDoneAndReschedule: true }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("האם למחוק משימה זו?")) return;
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskForm),
      });
      if (res.ok) {
        setIsTaskModalOpen(false);
        setTaskForm({
          title: "",
          description: "",
          category: "WEEKLY",
          frequencyDays: "7",
          priority: "MEDIUM",
        });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteForm),
      });
      if (res.ok) {
        setIsNoteModalOpen(false);
        setNoteForm({
          title: "",
          content: "",
          waterQualityRating: "5",
        });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm("האם למחוק רשומה זו מהיומן?")) return;
    try {
      await fetch(`/api/log?id=${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendEmailReminder = async () => {
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/reminders/send", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setEmailResult(
          data.results?.[0]?.mock
            ? "מצב הדגמה: תזכורת נרשמה בהצלחה (לשליחה אמיתית הזן פרטי SMTP ב-.env)"
            : "מייל תזכורת נשלח בהצלחה לכתובת שלך!"
        );
      } else {
        setEmailResult("שגיאה בשליחת המייל: " + (data.error || ""));
      }
    } catch (err: any) {
      setEmailResult("שגיאה: " + err.message);
    } finally {
      setEmailSending(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter === "ALL") return true;
    return t.category === categoryFilter;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-cyan-400" />
            <span>לוח טיפולים ויומן תחזוקה אישי</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            מעקב אחר משימות מחזוריות (שבועי, חודשי, רבעוני) וכתיבת הערות ומעקב אישי.
          </p>
        </div>

        <button
          onClick={handleSendEmailReminder}
          disabled={emailSending}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{emailSending ? "שולח תזכורת..." : "שלח לי תזכורת עכשיו למייל"}</span>
        </button>
      </div>

      {emailResult && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>{emailResult}</span>
          <button onClick={() => setEmailResult(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("TASKS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "TASKS"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>משימות תחזוקה מחזוריות ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("DIARY")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === "DIARY"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>יומן טיפולים והערות אישיות ({entries.length})</span>
        </button>
      </div>

      {/* Tab 1: Tasks */}
      {activeTab === "TASKS" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {["ALL", "WEEKLY", "MONTHLY", "QUARTERLY"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    categoryFilter === cat
                      ? "bg-slate-800 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-950 text-slate-400 hover:text-white border border-slate-850"
                  }`}
                >
                  {cat === "ALL"
                    ? "הכל"
                    : cat === "WEEKLY"
                    ? "שבועי"
                    : cat === "MONTHLY"
                    ? "חודשי"
                    : "רבעוני / מילוי מים"}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>הוסף משימה מותאמת אישית</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-cyan-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 text-sm">
              אין משימות להצגה בקטגוריה זו.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const isOverdue = new Date(task.nextDueDate).getTime() < Date.now();
                return (
                  <div
                    key={task.id}
                    className={`bg-slate-900/90 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                      isOverdue ? "border-rose-900/70" : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            task.priority === "URGENT"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : task.priority === "HIGH"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                          }`}
                        >
                          {task.category === "WEEKLY"
                            ? "שבועי"
                            : task.category === "MONTHLY"
                            ? "חודשי"
                            : task.category === "QUARTERLY"
                            ? "רבעוני"
                            : "מותאם אישית"}
                        </span>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="מחק משימה"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-white text-base">{task.title}</h3>
                      {task.description && <p className="text-xs text-slate-400 leading-relaxed">{task.description}</p>}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="text-xs">
                        <span className="text-slate-500">יעד הבא: </span>
                        <span className={`font-bold ${isOverdue ? "text-rose-400" : "text-slate-300"}`}>
                          {new Date(task.nextDueDate).toLocaleDateString("he-IL")}
                        </span>
                        {isOverdue && <span className="text-[10px] text-rose-400 mr-1">(באיחור)</span>}
                      </div>

                      <button
                        onClick={() => handleMarkDone(task.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>בוצע היום ותזמן</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Diary & Notes */}
      {activeTab === "DIARY" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">רישום חופשי של טיפולים, תקלות, הוספת כימיקלים והערות שונות</p>
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>רשום הערה / טיפול ביומן</span>
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-slate-300 text-sm font-semibold">היומן שלך ריק</div>
              <p className="text-xs text-slate-500">הוסף הערות על טיפולים מיוחדים שביצעת, מסיבות או החלפת מים</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{entry.title}</h3>
                      <span className="text-xs text-slate-500">
                        • {new Date(entry.entryDate).toLocaleDateString("he-IL")}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {entry.waterQualityRating && (
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: entry.waterQualityRating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteNote(entry.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="מחק רשומה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">הוספת משימת תחזוקה</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">כותרת המשימה</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="למשל: בדיקת משאבת סירקולציה"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">תדירות (ימים)</label>
                  <input
                    type="number"
                    min="1"
                    value={taskForm.frequencyDays}
                    onChange={(e) => setTaskForm({ ...taskForm, frequencyDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">עדיפות</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="LOW">רגילה (Low)</option>
                    <option value="MEDIUM">בינונית (Medium)</option>
                    <option value="HIGH">גבוהה (High)</option>
                    <option value="URGENT">דחופה (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">פירוט והוראות ביצוע</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold"
                >
                  שמור משימה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Diary Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">רישום הערה ביומן</h2>
              <button onClick={() => setIsNoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">כותרת הרשומה</label>
                <input
                  type="text"
                  required
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  placeholder="למשל: טיפול שוק אחרי אירוח, שטיפת פילטר"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">דירוג צלילות ואיכות המים (1-5)</label>
                <select
                  value={noteForm.waterQualityRating}
                  onChange={(e) => setNoteForm({ ...noteForm, waterQualityRating: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="5">⭐⭐⭐⭐⭐ מושלם וצלול כקריסטל</option>
                  <option value="4">⭐⭐⭐⭐ טוב מאוד</option>
                  <option value="3">⭐⭐⭐ סביר אך מעט עכור</option>
                  <option value="2">⭐⭐ דורש טיפול מיידי</option>
                  <option value="1">⭐ ירוד / קצף ועכירות קשה</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">תוכן ההערה / מה נעשה</label>
                <textarea
                  required
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={3}
                  placeholder="פרט מה בוצע, כמה גרם הוספת, הערות כלליות..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white rounded-xl text-xs font-bold"
                >
                  שמור ביומן
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
