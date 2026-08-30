"use client";

import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  RefreshCw,
  BookOpen,
  AlertTriangle,
  X,
  Package,
  Globe,
  Info,
  ShieldAlert,
  Save,
  ExternalLink,
  FlaskConical,
} from "lucide-react";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Day Details Modal
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Task Completion Modal (Separated into Chemical Addition VS Water Testing)
  const [completingTask, setCompletingTask] = useState<any | null>(null);
  const [treatmentType, setTreatmentType] = useState<"CHEMICAL" | "WATER_TEST">("CHEMICAL");

  // Chemical Form
  const [chemicalSource, setChemicalSource] = useState<"INVENTORY" | "EXTERNAL">("INVENTORY");
  const [selectedChemicalId, setSelectedChemicalId] = useState("");
  const [deductAmount, setDeductAmount] = useState("20");
  const [externalChemicalName, setExternalChemicalName] = useState("");
  const [chemicalNotes, setChemicalNotes] = useState("");

  // Water Test Form
  const [ph, setPh] = useState("7.4");
  const [phUnknown, setPhUnknown] = useState(false);
  const [freeChlorine, setFreeChlorine] = useState("3.0");
  const [clUnknown, setClUnknown] = useState(false);
  const [alkalinity, setAlkalinity] = useState("90");
  const [alkUnknown, setAlkUnknown] = useState(false);
  const [clarity, setClarity] = useState("CLEAR");
  const [testNotes, setTestNotes] = useState("");

  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Emergency Overdose Warning Modal State
  const [overdoseAlert, setOverdoseAlert] = useState<any | null>(null);

  // Notification Banner State
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({
    title: "",
    description: "",
    category: "WEEKLY",
    frequencyDays: "7",
    priority: "MEDIUM",
    nextDueDate: "",
  });

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

  // Email reminder state
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ text: string; previewUrl?: string; isWarning?: boolean } | null>(null);

  const loadData = async () => {
    try {
      const [tasksRes, logsRes, chemRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/log"),
        fetch("/api/chemicals"),
      ]);

      if (tasksRes.ok) {
        const tData = await tasksRes.json();
        setTasks(tData.tasks || []);
      }
      if (logsRes.ok) {
        const lData = await logsRes.json();
        setEntries(lData.entries || []);
        setWaterLogs(lData.waterLogs || []);
      }
      if (chemRes.ok) {
        const cData = await chemRes.json();
        const chems = cData.chemicals || [];
        setChemicals(chems);
        if (chems.length > 0 && !selectedChemicalId) {
          setSelectedChemicalId(chems[0].id);
        }
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

  // Month navigation
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const hebrewMonths = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }

  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getEventsForDay = (date: Date) => {
    const dayTasks = tasks.filter((t) => isSameDay(new Date(t.nextDueDate), date));
    const doneTasks = tasks.filter(
      (t) => t.lastDoneDate && isSameDay(new Date(t.lastDoneDate), date)
    );
    const dayEntries = entries.filter((e) => isSameDay(new Date(e.entryDate), date));
    const dayWaterLogs = waterLogs.filter((w) => isSameDay(new Date(w.testedAt), date));

    return { dayTasks, doneTasks, dayEntries, dayWaterLogs };
  };

  // Open Completion Modal with automatic detection of task type
  const openCompletionModal = (task: any) => {
    setCompletingTask(task);
    const isTest =
      task.title.includes("בדיק") ||
      task.title.includes("איכות") ||
      task.title.includes("מקלון") ||
      task.title.includes("pH");

    setTreatmentType(isTest ? "WATER_TEST" : "CHEMICAL");
    setDeductAmount("20");
    setExternalChemicalName("");
    setChemicalNotes("");
    setTestNotes("");

    if (chemicals.length > 0) {
      setChemicalSource("INVENTORY");
      setSelectedChemicalId(chemicals[0].id);
    } else {
      setChemicalSource("EXTERNAL");
    }
  };

  const handleSaveCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;

    setIsSubmittingCompletion(true);
    try {
      if (treatmentType === "CHEMICAL") {
        const isFromInventory = chemicalSource === "INVENTORY" && selectedChemicalId;

        const res = await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: completingTask.id,
            markDoneAndReschedule: true,
            notes: chemicalNotes,
            chemicalInventoryId: isFromInventory ? selectedChemicalId : null,
            deductAmount: deductAmount,
            chemicalUsed: !isFromInventory ? externalChemicalName : null,
            amountAdded: !isFromInventory ? `${deductAmount} גרם/מ"ל` : null,
          }),
        });

        const data = await res.json();
        if (data.safetyCheck) {
          setOverdoseAlert(data.safetyCheck);
        }
        setActionNotice("הוספת החומר תועדה והמלאי עודכן בהצלחה!");
      } else {
        // Water Testing Completion
        const res = await fetch("/api/water-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testedAt: new Date().toISOString(),
            ph: phUnknown ? "UNKNOWN" : ph,
            freeChlorine: clUnknown ? "UNKNOWN" : freeChlorine,
            alkalinity: alkUnknown ? "UNKNOWN" : alkalinity,
            waterClarity: clarity,
            description: `משימה שבוצעה: ${completingTask.title}${testNotes ? ` - ${testNotes}` : ""}`,
          }),
        });

        // Mark task done & reschedule
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: completingTask.id,
            markDoneAndReschedule: true,
            valueAfter: `pH: ${phUnknown ? "לא נבדק" : ph}, כלור: ${clUnknown ? "לא נבדק" : freeChlorine}`,
            notes: testNotes,
          }),
        });

        setActionNotice("תוצאות הבדיקה נשמרו בעמוד בדיקות המים והמשימה סומנה כבוצעה!");
      }

      setCompletingTask(null);
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  // Reset / Undo Completed Task
  const handleResetTask = async (task: any) => {
    if (!confirm(`האם לאפס את האירוע "${task.title}" (להחזיר למצב טרם בוצע ולהחזיר את החומרים לארון)?`)) {
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          resetTask: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionNotice(
          data.restockedAmount > 0
            ? `האירוע אופס בהצלחה! ${data.restockedAmount} גרם/מ"ל הוחזרו חזרה לארון החומרים.`
            : "האירוע אופס והוחזר למצב טרם בוצע."
        );
        setTimeout(() => setActionNotice(null), 5000);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Task Modal
  const openEditTaskModal = (task: any) => {
    setEditingTask(task);
    setEditTaskForm({
      title: task.title || "",
      description: task.description || "",
      category: task.category || "WEEKLY",
      frequencyDays: task.frequencyDays?.toString() || "7",
      priority: task.priority || "MEDIUM",
      nextDueDate: task.nextDueDate ? new Date(task.nextDueDate).toISOString().split("T")[0] : "",
    });
  };

  const handleSaveEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          title: editTaskForm.title,
          description: editTaskForm.description,
          category: editTaskForm.category,
          frequencyDays: editTaskForm.frequencyDays,
          priority: editTaskForm.priority,
          nextDueDate: editTaskForm.nextDueDate ? new Date(editTaskForm.nextDueDate).toISOString() : undefined,
        }),
      });

      setEditingTask(null);
      setActionNotice("המשימה עודכנה בהצלחה!");
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("האם למחוק משימה זו? המלאי בארון יוחזר אוטומטית.")) return;
    try {
      await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      setActionNotice("המשימה נמחקה והמלאי הוחזר לארון.");
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetDate = selectedDay || new Date();
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          nextDueDate: targetDate.toISOString(),
        }),
      });
      setIsTaskModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetDate = selectedDay || new Date();
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...noteForm,
          entryDate: targetDate.toISOString(),
        }),
      });
      setIsNoteModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiaryEntry = async (id: string) => {
    if (!confirm("האם למחוק רשומה זו מהיומן?")) return;
    try {
      await fetch(`/api/log?id=${id}`, { method: "DELETE" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Automated Task Expiration Email Check
  const handleSendEmailReminder = async () => {
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await fetch("/api/reminders/send", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        const firstResult = data.results?.[0];
        if (firstResult?.skipped) {
          setEmailResult({
            text: "כל המשימות מעודכנות! אין משימות שלא סומנו כבוצע ופג תוקפן להיום.",
            isWarning: false,
          });
        } else if (firstResult?.success) {
          setEmailResult({
            text: `נשלח מייל התראה על ${firstResult.tasksDueCount} משימות שפגו תוקף / מיועדות להיום!`,
            previewUrl: firstResult.previewUrl,
            isWarning: true,
          });
        } else {
          setEmailResult({
            text: firstResult?.error || "שגיאה בשליחת המייל",
            isWarning: true,
          });
        }
      } else {
        setEmailResult({
          text: "שגיאה בבדיקת משימות: " + (data.error || ""),
          isWarning: true,
        });
      }
    } catch (err: any) {
      setEmailResult({ text: "שגיאה: " + err.message, isWarning: true });
    } finally {
      setEmailSending(false);
    }
  };

  const selectedChemObject = chemicals.find((c) => c.id === selectedChemicalId);
  const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  // Count overdue/due tasks for today
  const todayDate = new Date();
  const dueTodayOrOverdueCount = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const d = new Date(t.nextDueDate);
    return isSameDay(d, todayDate) || d < todayDate;
  }).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-cyan-400" />
            <span>לוח שנה ויומן תחזוקה חודשי</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            מעקב טיפולים מחזורי, איפוס ועריכת משימות, התראות במייל, ועדכון מלאי אוטומטי.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => {
              setSelectedDay(new Date());
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>משימה חדשה</span>
          </button>

          <button
            onClick={() => {
              setSelectedDay(new Date());
              setIsNoteModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 text-xs font-bold transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>הערה ביומן</span>
          </button>

          <button
            onClick={handleSendEmailReminder}
            disabled={emailSending}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all disabled:opacity-50 ${
              dueTodayOrOverdueCount > 0
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {emailSending
                ? "בודק משימות ושולח..."
                : dueTodayOrOverdueCount > 0
                ? `שלח התראה (${dueTodayOrOverdueCount} פג תוקף)`
                : "בדוק ושלח התראות פג תוקף"}
            </span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-700 text-cyan-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {emailResult && (
        <div
          className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${
            emailResult.isWarning
              ? "bg-slate-900 border-rose-800 text-rose-300"
              : "bg-slate-900 border-emerald-800 text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {emailResult.isWarning ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="font-semibold">{emailResult.text}</span>
            {emailResult.previewUrl && (
              <a
                href={emailResult.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:text-white hover:bg-cyan-600 border border-cyan-500/40 font-bold text-xs transition-all"
              >
                <span>🔍 צפה במייל המעוצב שנשלח</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <button onClick={() => setEmailResult(null)} className="text-slate-400 hover:text-white self-end sm:self-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Month Navigation Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {hebrewMonths[month]} {year}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 font-semibold transition-colors"
          >
            היום
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="חודש קודם"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="חודש הבא"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Monthly Calendar Grid */}
      {loading ? (
        <div className="text-center py-24 text-cyan-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-2 overflow-hidden">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
            {daysOfWeek.map((day, idx) => (
              <div key={idx} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              const { dayTasks, doneTasks, dayEntries } = getEventsForDay(cell.date);
              const isToday = isSameDay(cell.date, new Date());
              const isSelected = selectedDay && isSameDay(cell.date, selectedDay);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(cell.date)}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400 shadow-lg"
                      : isToday
                      ? "bg-slate-950/90 border-cyan-500/60 shadow-cyan-950/20"
                      : cell.isCurrentMonth
                      ? "bg-slate-950/60 border-slate-855 hover:border-slate-700"
                      : "bg-slate-950/20 border-slate-900 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded-lg ${
                        isToday
                          ? "bg-cyan-500 text-slate-950 font-black"
                          : cell.isCurrentMonth
                          ? "text-slate-200"
                          : "text-slate-600"
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    {isToday && (
                      <span className="hidden sm:inline text-[9px] text-cyan-400 font-bold bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                        היום
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-1 overflow-hidden">
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-800 truncate font-semibold flex items-center gap-1"
                        title={t.title}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}

                    {doneTasks.map((t) => (
                      <div
                        key={`done-${t.id}`}
                        className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-800 truncate font-medium flex items-center gap-1"
                        title={`בוצע: ${t.title}`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}

                    {dayEntries.map((e) => (
                      <div
                        key={e.id}
                        className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800 truncate flex items-center gap-1"
                        title={e.title}
                      >
                        <BookOpen className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="sm:hidden flex items-center gap-1 justify-end">
                    {dayTasks.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    {doneTasks.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {dayEntries.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Details Drawer */}
      {selectedDay && (
        <div className="bg-slate-900/90 border border-cyan-800/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                {selectedDay.getDate()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  אירועים וטיפולים לתאריך: {selectedDay.toLocaleDateString("he-IL")}
                </h2>
                <p className="text-xs text-slate-400">פרטי משימות, פעולות שבוצעו ורשומות יומן</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold border border-cyan-500/40"
              >
                + הוסף משימה לתאריך זה
              </button>
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-semibold border border-purple-500/40"
              >
                + הוסף הערה ביומן
              </button>
              <button onClick={() => setSelectedDay(null)} className="p-1.5 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {(() => {
            const { dayTasks, doneTasks, dayEntries } = getEventsForDay(selectedDay);
            const total = dayTasks.length + doneTasks.length + dayEntries.length;

            if (total === 0) {
              return (
                <div className="text-center py-8 text-slate-400 text-xs">
                  אין טיפולים או משימות מתועדות בתאריך זה.
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {dayTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>משימות מתוזמנות לביצוע:</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-950 border border-cyan-800/60 rounded-2xl p-4 space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                {task.category === "WEEKLY" ? "שבועי" : task.category === "MONTHLY" ? "חודשי" : "תקופתי"}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditTaskModal(task)}
                                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition-colors"
                                  title="ערוך משימה"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                                  title="מחק משימה"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-bold text-white text-sm pt-1">{task.title}</h4>
                            {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                          </div>

                          <button
                            onClick={() => openCompletionModal(task)}
                            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>סמן ביצוע ועדכן נתונים</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {doneTasks.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>טיפולים שבוצעו ותועדו:</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {doneTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-slate-950/80 border border-emerald-900/60 rounded-2xl p-4 space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{task.title}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleResetTask(task)}
                                className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-950/60 rounded-lg transition-colors flex items-center gap-1 border border-amber-800/40"
                                title="אפס אירוע (החזר למצב טרם בוצע והחזר חומרים לארון)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold">אפס אירוע</span>
                              </button>
                              <button
                                onClick={() => openEditTaskModal(task)}
                                className="text-slate-400 hover:text-cyan-300 p-1.5 hover:bg-slate-900 rounded-lg transition-colors"
                                title="ערוך פרטי ביצוע"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-900 rounded-lg transition-colors"
                                title="מחק טיפול והחזר מלאי"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {task.lastChemicalUsed && (
                            <div className="text-cyan-300 font-semibold bg-cyan-950/40 p-2 rounded-xl border border-cyan-900/50">
                              <span className="text-slate-400">חומר שהוסף: </span>
                              {task.lastChemicalUsed} ({task.lastAmountAdded || ""})
                            </div>
                          )}

                          {task.lastValueAfter && (
                            <div className="text-emerald-300 font-semibold">
                              <span className="text-slate-500">תוצאות שנמדדו: </span>
                              {task.lastValueAfter}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dayEntries.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>רשומות יומן תחזוקה:</span>
                    </h3>

                    <div className="space-y-2">
                      {dayEntries.map((e) => (
                        <div key={e.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-white text-sm">{e.title}</h4>
                            <button
                              onClick={() => handleDeleteDiaryEntry(e.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                              title="מחק רשומה"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap">{e.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Emergency Overdose Alert Modal */}
      {overdoseAlert && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl shadow-rose-950/50">
            <div className="flex items-center gap-3 border-b border-rose-900/60 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
                <ShieldAlert className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h2 className="text-lg font-black text-rose-300">{overdoseAlert.title}</h2>
                <p className="text-xs text-slate-300 font-medium">זיהוי מינון כימיקלים חריג בג'קוזי</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200 leading-relaxed">
              {overdoseAlert.whatHappened}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>פעולות מיידיות לטיפול:</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside">
                {overdoseAlert.immediateActions?.map((action: string, idx: number) => (
                  <li key={idx} className="font-semibold">{action}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>מה חל איסור לעשות כעת (הנחיות בריאות ומים):</span>
              </h3>
              <ul className="space-y-1 text-xs text-rose-300">
                {overdoseAlert.whatNotToDo?.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setOverdoseAlert(null)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>הבנתי, אני נוקט בפעולות הבטיחות כעת</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Task Completion - CLEAN SEPARATION BETWEEN CHEMICAL ADDITION AND WATER TESTING */}
      {completingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-800/80 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-6 h-6" />
                <h2 className="text-lg font-bold text-white">סימון ביצוע: {completingTask.title}</h2>
              </div>
              <button onClick={() => setCompletingTask(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTreatmentType("CHEMICAL")}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  treatmentType === "CHEMICAL"
                    ? "bg-cyan-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>📦 הוספת חומר / טיפול</span>
              </button>

              <button
                type="button"
                onClick={() => setTreatmentType("WATER_TEST")}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  treatmentType === "WATER_TEST"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FlaskConical className="w-4 h-4" />
                <span>🧪 בדיקת נתוני מים</span>
              </button>
            </div>

            <form onSubmit={handleSaveCompletion} className="space-y-5">
              {treatmentType === "CHEMICAL" ? (
                /* === 1. PURE CHEMICAL ADDITION FORM === */
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">1. מאיזה מקור נלקח החומר שהוספת?</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setChemicalSource("INVENTORY")}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2 ${
                          chemicalSource === "INVENTORY"
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Package className="w-4 h-4 shrink-0" />
                        <div className="text-xs">
                          <div>מארון החומרים שלי</div>
                          <div className="text-[10px] opacity-70 font-normal">מפחית מלאי אוטומטית</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setChemicalSource("EXTERNAL")}
                        className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2 ${
                          chemicalSource === "EXTERNAL"
                            ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Globe className="w-4 h-4 shrink-0" />
                        <div className="text-xs">
                          <div>ממקור חיצוני / אחר</div>
                          <div className="text-[10px] opacity-70 font-normal">לא משפיע על הארון</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {chemicalSource === "INVENTORY" ? (
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-cyan-900/60">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">בחר חומר מתוך הארון שלך:</label>
                        {chemicals.length === 0 ? (
                          <div className="text-xs text-amber-400 p-2">אין חומרים בארון כרגע. באפשרותך לבחור "מקור חיצוני".</div>
                        ) : (
                          <select
                            value={selectedChemicalId}
                            onChange={(e) => setSelectedChemicalId(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold focus:border-cyan-500"
                          >
                            {chemicals.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} (נותרו: {c.quantity} {c.unit === "GRAMS" ? 'גר\'' : c.unit === "ML" ? 'מ"ל' : c.unit})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300">כמות שהוספת לג'קוזי:</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={deductAmount}
                            onChange={(e) => setDeductAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-sm text-cyan-300"
                          />
                        </div>

                        {selectedChemObject && (
                          <div className="space-y-1">
                            <label className="text-[11px] text-slate-400">יתרה חדשה בארון:</label>
                            <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400">
                              {Math.max(0, selectedChemObject.quantity - (parseFloat(deductAmount) || 0))} {selectedChemObject.unit === "GRAMS" ? 'גר\'' : selectedChemObject.unit === "ML" ? 'מ"ל' : selectedChemObject.unit}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">שם החומר ממקור חיצוני:</label>
                        <input
                          type="text"
                          required
                          value={externalChemicalName}
                          onChange={(e) => setExternalChemicalName(e.target.value)}
                          placeholder="למשל: כלור טבליות, חומצת מלח..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">כמות שהוספת:</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={deductAmount}
                          onChange={(e) => setDeductAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">הערות לטיפול</label>
                    <textarea
                      value={chemicalNotes}
                      onChange={(e) => setChemicalNotes(e.target.value)}
                      rows={2}
                      placeholder="הערות ליומן..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                    />
                  </div>
                </div>
              ) : (
                /* === 2. PURE WATER TESTING FORM === */
                <div className="space-y-3.5">
                  <div className="bg-purple-950/40 p-3 rounded-2xl border border-purple-800/60 text-xs text-purple-200">
                    התוצאות שתזין יישמרו אוטומטית ב<b>יומן בדיקות המים</b> של הג'קוזי.
                  </div>

                  {/* pH Input */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">1. חומציות (pH)</span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={phUnknown}
                          onChange={(e) => setPhUnknown(e.target.checked)}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span>לא יודע / לא נבדק</span>
                      </label>
                    </div>
                    {!phUnknown ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          min="6.0"
                          max="8.8"
                          value={ph}
                          onChange={(e) => setPh(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center text-cyan-300"
                        />
                        <span className="text-[10px] text-slate-500 shrink-0">מומלץ: 7.2-7.6</span>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400/80 text-center py-1">מסומן כ-"לא ידוע"</div>
                    )}
                  </div>

                  {/* Chlorine Input */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">2. כלור חופשי / ברום (ppm)</span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={clUnknown}
                          onChange={(e) => setClUnknown(e.target.checked)}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span>לא יודע / לא נבדק</span>
                      </label>
                    </div>
                    {!clUnknown ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="15"
                          value={freeChlorine}
                          onChange={(e) => setFreeChlorine(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center text-cyan-300"
                        />
                        <span className="text-[10px] text-slate-500 shrink-0">מומלץ: 3.0-5.0</span>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400/80 text-center py-1">מסומן כ-"לא ידוע"</div>
                    )}
                  </div>

                  {/* Alkalinity Input */}
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">3. בסיסיות (TA ppm)</span>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={alkUnknown}
                          onChange={(e) => setAlkUnknown(e.target.checked)}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span>לא יודע / לא נבדק</span>
                      </label>
                    </div>
                    {!alkUnknown ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="5"
                          min="0"
                          max="300"
                          value={alkalinity}
                          onChange={(e) => setAlkalinity(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-bold text-sm text-center text-cyan-300"
                        />
                        <span className="text-[10px] text-slate-500 shrink-0">מומלץ: 80-120</span>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400/80 text-center py-1">מסומן כ-"לא ידוע"</div>
                    )}
                  </div>

                  {/* Clarity */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">4. צלילות המים</label>
                    <select
                      value={clarity}
                      onChange={(e) => setClarity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                    >
                      <option value="CLEAR">✨ מים צלולים</option>
                      <option value="SLIGHTLY_CLOUDY">🌫️ מעט עכורים</option>
                      <option value="VERY_CLOUDY">🥛 עכורים מאוד</option>
                      <option value="FOAMY">🧼 מקציפים</option>
                      <option value="GREEN">🌿 ירוקים</option>
                      <option value="BAD_ODOR">👃 ריח חריף</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">הערות לבדיקה</label>
                    <textarea
                      value={testNotes}
                      onChange={(e) => setTestNotes(e.target.value)}
                      rows={2}
                      placeholder="הערות לבדיקת המים..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompletingTask(null)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCompletion}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
                >
                  {isSubmittingCompletion ? "שומר..." : "שמור ביצוע משימה"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Task */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <span>עריכת משימת תחזוקה</span>
              </h2>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">כותרת המשימה</label>
                <input
                  type="text"
                  required
                  value={editTaskForm.title}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">תדירות (ימים)</label>
                  <input
                    type="number"
                    min="1"
                    value={editTaskForm.frequencyDays}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, frequencyDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">עדיפות</label>
                  <select
                    value={editTaskForm.priority}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    <option value="LOW">רגילה</option>
                    <option value="MEDIUM">בינונית</option>
                    <option value="HIGH">גבוהה</option>
                    <option value="URGENT">דחופה</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">תאריך יעד הבא</label>
                <input
                  type="date"
                  value={editTaskForm.nextDueDate}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, nextDueDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">פירוט והוראות ביצוע</label>
                <textarea
                  value={editTaskForm.description}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-xs text-slate-400"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>שמור שינויים</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Task */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">הוספת משימת תחזוקה חדשה</h2>
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
                    <option value="LOW">רגילה</option>
                    <option value="MEDIUM">בינונית</option>
                    <option value="HIGH">גבוהה</option>
                    <option value="URGENT">דחופה</option>
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

      {/* Modal: Add Diary Note */}
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
                  placeholder="למשל: אירוח בסופש, שטיפת פילטר, החלפת מים..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">דירוג איכות המים (1-5)</label>
                <select
                  value={noteForm.waterQualityRating}
                  onChange={(e) => setNoteForm({ ...noteForm, waterQualityRating: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                >
                  <option value="5">⭐⭐⭐⭐⭐ מושלם וצלול כקריסטל</option>
                  <option value="4">⭐⭐⭐⭐ טוב מאוד</option>
                  <option value="3">⭐⭐⭐ סביר אך מעט עכור</option>
                  <option value="2">⭐⭐ דורש טיפול</option>
                  <option value="1">⭐ ירוד / קצף ועכירות</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">תוכן ההערה</label>
                <textarea
                  required
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={3}
                  placeholder="פרט הערות כלליות, מצב מים, תקלות או אירועים..."
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
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white rounded-xl text-xs font-bold"
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
