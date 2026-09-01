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
  Zap,
  Droplets,
  Lock,
} from "lucide-react";

// Standard Test Strip Range Scales (5 Distinct Domains: Very Low, Low, OK, High, Very High)
const PH_RANGES = [
  { id: "VERY_LOW", label: "Very Low (< 6.8)", val: 6.6 },
  { id: "LOW", label: "Low (6.8 - 7.1)", val: 7.0 },
  { id: "OK", label: "OK (7.2 - 7.6)", val: 7.4 },
  { id: "HIGH", label: "High (7.7 - 8.0)", val: 7.8 },
  { id: "VERY_HIGH", label: "Very High (> 8.0)", val: 8.2 },
  { id: "UNKNOWN", label: "לא נבדק", val: null },
];

const CHLORINE_RANGES = [
  { id: "VERY_LOW", label: "Very Low (0 - 0.5 ppm)", val: 0.0 },
  { id: "LOW", label: "Low (0.5 - 1.5 ppm)", val: 1.0 },
  { id: "OK", label: "OK (2.0 - 4.0 ppm)", val: 3.0 },
  { id: "HIGH", label: "High (5.0 - 8.0 ppm)", val: 6.0 },
  { id: "VERY_HIGH", label: "Very High (> 8.0 ppm)", val: 10.0 },
  { id: "UNKNOWN", label: "לא נבדק", val: null },
];

const ALKALINITY_RANGES = [
  { id: "VERY_LOW", label: "Very Low (< 40 ppm)", val: 30 },
  { id: "LOW", label: "Low (40 - 70 ppm)", val: 60 },
  { id: "OK", label: "OK (80 - 120 ppm)", val: 100 },
  { id: "HIGH", label: "High (130 - 180 ppm)", val: 150 },
  { id: "VERY_HIGH", label: "Very High (> 180 ppm)", val: 200 },
  { id: "UNKNOWN", label: "לא נבדק", val: null },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"WEEK" | "MONTH">("WEEK");
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

  // Water Test Form (5 Range Domains + Optional Manual Values)
  const [selectedPhRange, setSelectedPhRange] = useState("OK");
  const [noNumericPh, setNoNumericPh] = useState(true);
  const [manualPh, setManualPh] = useState("");
  const [selectedClRange, setSelectedClRange] = useState("OK");
  const [noNumericCl, setNoNumericCl] = useState(true);
  const [manualCl, setManualCl] = useState("");
  const [selectedAlkRange, setSelectedAlkRange] = useState("OK");
  const [noNumericAlk, setNoNumericAlk] = useState(true);
  const [manualAlk, setManualAlk] = useState("");
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

  // Jacuzzi data for water age
  const [jacuzzi, setJacuzzi] = useState<any | null>(null);

  // Proactive Maintenance (פעולת אחזקה יזומה)
  const [isProactiveModalOpen, setIsProactiveModalOpen] = useState(false);
  const [proactiveText, setProactiveText] = useState("");
  const [proactiveDate, setProactiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [priorWaterAge, setPriorWaterAge] = useState<number>(60);
  const [isAnalyzingProactive, setIsAnalyzingProactive] = useState(false);
  const [proactiveAnalysis, setProactiveAnalysis] = useState<any | null>(null);
  const [isApplyingProactive, setIsApplyingProactive] = useState(false);

  const handleAnalyzeProactive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proactiveText.trim()) return;

    setIsAnalyzingProactive(true);
    try {
      const res = await fetch("/api/ai/proactive-maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeText: proactiveText,
          actionDate: proactiveDate,
          currentWaterAgeDays: priorWaterAge,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בניתוח הפעולה");

      setProactiveAnalysis(data.analysis);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsAnalyzingProactive(false);
    }
  };

  const handleApplyProactive = async () => {
    if (!proactiveAnalysis) return;

    setIsApplyingProactive(true);
    try {
      const res = await fetch("/api/ai/proactive-maintenance/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeText: proactiveText,
          actionDate: proactiveDate,
          currentWaterAgeDays: priorWaterAge,
          refillPercentage: proactiveAnalysis.refillPercentage,
          scheduleShifts: proactiveAnalysis.scheduleShifts,
          newTasksToCreate: proactiveAnalysis.newTasksToCreate,
          updateJacuzziRefill: proactiveAnalysis.updateJacuzziRefill,
          suggestedDiaryTitle: proactiveAnalysis.suggestedDiaryTitle,
          suggestedDiaryContent: proactiveAnalysis.suggestedDiaryContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהחלת השינויים");

      setActionNotice(data.message || "פעולת האחזקה עודכנה ולוח הזמנים הותאם בהצלחה!");
      setIsProactiveModalOpen(false);
      setProactiveAnalysis(null);
      setProactiveText("");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsApplyingProactive(false);
    }
  };

  // Routine Optimizer AI State
  const [isOptimizingRoutine, setIsOptimizingRoutine] = useState(false);
  const [routineOptimization, setRoutineOptimization] = useState<any | null>(null);
  const [isApplyingOptimization, setIsApplyingOptimization] = useState(false);
  const [selectedDeletions, setSelectedDeletions] = useState<string[]>([]);
  const [selectedAdditions, setSelectedAdditions] = useState<number[]>([]);

  const handleScanRoutine = async () => {
    setIsOptimizingRoutine(true);
    try {
      const res = await fetch("/api/ai/optimize-routine", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בסריקת שגרת הטיפולים");

      setRoutineOptimization(data.optimization);
      if (data.optimization?.tasksToDelete) {
        setSelectedDeletions(data.optimization.tasksToDelete.map((t: any) => t.taskId));
      }
      if (data.optimization?.tasksToCreate) {
        setSelectedAdditions(data.optimization.tasksToCreate.map((_: any, idx: number) => idx));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsOptimizingRoutine(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!routineOptimization) return;

    setIsApplyingOptimization(true);
    try {
      const tasksToDelete = (routineOptimization.tasksToDelete || [])
        .filter((t: any) => selectedDeletions.includes(t.taskId))
        .map((t: any) => t.taskId);

      const tasksToCreate = (routineOptimization.tasksToCreate || []).filter((_: any, idx: number) =>
        selectedAdditions.includes(idx)
      );

      const res = await fetch("/api/ai/optimize-routine/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasksToDelete,
          tasksToUpdate: routineOptimization.tasksToUpdate || [],
          tasksToCreate,
          summary: routineOptimization.executiveSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בהחלת אופטימיזציית השגרה");

      setActionNotice(data.message || "שגרת הטיפולים עודכנה וסונכרנה בהצלחה!");
      setRoutineOptimization(null);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsApplyingOptimization(false);
    }
  };

  const loadData = async () => {
    try {
      const [tasksRes, logsRes, chemRes, jacuzziRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/log"),
        fetch("/api/chemicals"),
        fetch("/api/jacuzzi"),
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
      if (jacuzziRes.ok) {
        const jData = await jacuzziRes.json();
        const j = jData.jacuzzi || null;
        setJacuzzi(j);
        if (j?.lastRefillDate) {
          const age = Math.max(0, Math.floor((Date.now() - new Date(j.lastRefillDate).getTime()) / (1000 * 60 * 60 * 24)));
          setPriorWaterAge(age > 0 ? age : 60);
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

  // Week & Month navigation
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };
  const prevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getWeekDays = (baseDate: Date) => {
    const current = new Date(baseDate);
    const day = current.getDay(); // 0 (Sunday) to 6 (Saturday)
    const sunday = new Date(current);
    sunday.setDate(current.getDate() - day);
    sunday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  };

  const weekDays = getWeekDays(currentDate);
  const startOfWeek = weekDays[0];
  const endOfWeek = weekDays[6];

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

  const firstDay = new Date(year, month, 1).getDay();
  const firstDayIndex = firstDay;
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
    const dayTasks = tasks.filter((t) => !t.isCompleted && isSameDay(new Date(t.nextDueDate), date));
    const doneTasks = tasks.filter(
      (t) => t.isCompleted && t.lastDoneDate && isSameDay(new Date(t.lastDoneDate), date)
    );
    const dayEntries = entries.filter((e) => isSameDay(new Date(e.entryDate), date));
    const dayWaterLogs = waterLogs.filter((w) => isSameDay(new Date(w.testedAt), date));

    return { dayTasks, doneTasks, dayEntries, dayWaterLogs };
  };

  const isTaskFuture = (task: any) => {
    if (!task || !task.nextDueDate) return false;
    const dueDate = new Date(task.nextDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDay = new Date(dueDate);
    taskDay.setHours(0, 0, 0, 0);
    return taskDay.getTime() > today.getTime();
  };

  // Open Completion Modal with automatic detection of task type (Locked for future tasks!)
  const openCompletionModal = (task: any) => {
    if (isTaskFuture(task)) {
      alert(`משימה זו מתוכננת לתאריך ${new Date(task.nextDueDate).toLocaleDateString("he-IL")}. סימון ביצוע ועדכון נתונים ייפתחו החל מתאריך היעד המתוכנן.`);
      return;
    }

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
    setSelectedPhRange("IDEAL");
    setSelectedClRange("IDEAL");
    setSelectedAlkRange("IDEAL");

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
        // Water Testing Completion with Test Strip Ranges
        const phObj = PH_RANGES.find((r) => r.id === selectedPhRange);
        const clObj = CHLORINE_RANGES.find((r) => r.id === selectedClRange);
        const alkObj = ALKALINITY_RANGES.find((r) => r.id === selectedAlkRange);

        const parsedPh = (!noNumericPh && manualPh.trim()) ? parseFloat(manualPh) : null;
        const parsedCl = (!noNumericCl && manualCl.trim()) ? parseFloat(manualCl) : null;
        const parsedAlk = (!noNumericAlk && manualAlk.trim()) ? parseFloat(manualAlk) : null;

        await fetch("/api/water-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            testedAt: new Date().toISOString(),
            ph: parsedPh,
            phRange: phObj?.label || selectedPhRange,
            freeChlorine: parsedCl,
            chlorineRange: clObj?.label || selectedClRange,
            alkalinity: parsedAlk,
            alkalinityRange: alkObj?.label || selectedAlkRange,
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
            valueAfter: `pH: ${phObj?.label || "לא נבדק"}${parsedPh ? ` (${parsedPh})` : ""}, כלור: ${clObj?.label || "לא נבדק"}${parsedCl ? ` (${parsedCl} ppm)` : ""}`,
            notes: testNotes,
          }),
        });

        setManualPh("");
        setNoNumericPh(true);
        setManualCl("");
        setNoNumericCl(true);
        setManualAlk("");
        setNoNumericAlk(true);
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
    const task = tasks.find((t) => t.id === id);
    if (task && !task.isCompleted && isTaskFuture(task)) {
      alert(`לא ניתן למחוק משימה עתידית מתוכננת (${task.title}). משימות עתידיות נעולות למחיקה.`);
      return;
    }

    if (!confirm("האם למחוק משימה זו? המלאי בארון יוחזר אוטומטית.")) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה במחיקת המשימה");

      setActionNotice("המשימה נמחקה והמלאי הוחזר לארון.");
      setTimeout(() => setActionNotice(null), 4000);
      loadData();
    } catch (err: any) {
      alert(err.message);
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
            <span>לוח שנה ויומן תחזוקה שבועי</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            מעקב טיפולים מחזורי, סקירה שבועית מפורטת, עדכון מלאי אוטומטי ואופטימיזציית AI.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. הזן משימה עתידית */}
          <button
            onClick={() => {
              setSelectedDay(new Date());
              setIsTaskModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>הזן משימה עתידית</span>
          </button>

          {/* 2. הזן פעולת אחזקה שבוצעה */}
          <button
            onClick={() => {
              setIsProactiveModalOpen(true);
              setProactiveAnalysis(null);
              setProactiveText("");
            }}
            className="h-10 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>הזן פעולת אחזקה שבוצעה</span>
          </button>

          {/* 3. הערה ביומן */}
          <button
            onClick={() => {
              setSelectedDay(new Date());
              setIsNoteModalOpen(true);
            }}
            className="h-10 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>הערה ביומן</span>
          </button>

          {/* 4. סנכרון שגרה AI */}
          <button
            onClick={handleScanRoutine}
            disabled={isOptimizingRoutine}
            className="h-10 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: isOptimizingRoutine ? "1s" : "0s" }} />
            <span>{isOptimizingRoutine ? "מסנכרן שגרה..." : "סנכרון שגרה AI"}</span>
          </button>

          {/* 5. שלח התראה */}
          <button
            onClick={handleSendEmailReminder}
            disabled={emailSending}
            className="h-10 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-rose-400" />
            <span>
              {emailSending
                ? "בודק משימות..."
                : dueTodayOrOverdueCount > 0
                ? `שלח התראה (${dueTodayOrOverdueCount} פג תוקף)`
                : "שלח התראות"}
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

      {/* Calendar Navigation Bar with Weekly / Monthly switch */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-xl flex-wrap gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <h2 className="text-lg sm:text-2xl font-black text-white">
            {viewMode === "WEEK"
              ? `שבוע: ${startOfWeek.toLocaleDateString("he-IL", { day: "numeric", month: "short" })} – ${endOfWeek.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}`
              : `${hebrewMonths[month]} ${year}`}
          </h2>
          <button
            onClick={goToToday}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl border border-slate-700 font-bold transition-colors"
          >
            {viewMode === "WEEK" ? "השבוע הנוכחי" : "היום"}
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("WEEK")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === "WEEK"
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              תצוגה שבועית
            </button>
            <button
              type="button"
              onClick={() => setViewMode("MONTH")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                viewMode === "MONTH"
                  ? "bg-cyan-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              תצוגה חודשית
            </button>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={viewMode === "WEEK" ? prevWeek : prevMonth}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title={viewMode === "WEEK" ? "שבוע קודם" : "חודש קודם"}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={viewMode === "WEEK" ? nextWeek : nextMonth}
              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              title={viewMode === "WEEK" ? "שבוע הבא" : "חודש הבא"}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Section */}
      {loading ? (
        <div className="text-center py-24 text-cyan-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto" />
        </div>
      ) : viewMode === "WEEK" ? (
        /* WEEKLY 7-DAY SPACIOUS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-stretch">
          {weekDays.map((dayDate, idx) => {
            const { dayTasks, doneTasks, dayEntries, dayWaterLogs } = getEventsForDay(dayDate);
            const isToday = isSameDay(dayDate, new Date());
            const isSelected = selectedDay && isSameDay(dayDate, selectedDay);
            const dayName = daysOfWeek[dayDate.getDay()];
            const pendingDayTasks = dayTasks.filter((t: any) => !t.isCompleted);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(dayDate)}
                className={`p-3.5 rounded-3xl border flex flex-col justify-between transition-all min-h-[420px] shadow-lg cursor-pointer ${
                  isSelected
                    ? "bg-cyan-950/30 border-cyan-400 ring-1 ring-cyan-400 shadow-cyan-950/30"
                    : isToday
                    ? "bg-slate-900/95 border-cyan-500/80 shadow-cyan-950/30"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Day Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <div className="text-xs font-bold text-slate-300">יום {dayName}</div>
                      <div className="text-sm font-black text-white">
                        {dayDate.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" })}
                      </div>
                    </div>
                    {isToday ? (
                      <span className="text-[10px] font-black bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full shadow">
                        היום
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDay(dayDate);
                          setIsTaskModalOpen(true);
                        }}
                        className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 transition-all text-xs"
                        title="הוסף משימה ליום זה"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Day Events List */}
                  <div className="space-y-2">
                    {/* Pending Tasks */}
                    {pendingDayTasks.map((t: any) => {
                      const isFuture = isTaskFuture(t);
                      return (
                        <div
                          key={t.id}
                          className="p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-700 transition-all space-y-1.5 text-xs shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-white leading-tight">
                              {t.title}
                            </span>
                          </div>

                          {/* Complete / Lock Button */}
                          {isFuture ? (
                            <div className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 flex items-center justify-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>נעול עד המועד</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openCompletionModal(t);
                              }}
                              className="w-full py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] font-bold shadow flex items-center justify-center gap-1 transition-all hover:scale-[1.02]"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>סמן ביצוע</span>
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Completed Tasks - Clickable to Reset / Undo */}
                    {doneTasks.map((t: any) => (
                      <div
                        key={`done-${t.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetTask(t);
                        }}
                        className="p-2 rounded-2xl bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-900/60 hover:border-emerald-600 text-[10px] text-emerald-300 flex items-center justify-between gap-1 font-semibold transition-all cursor-pointer group shadow-sm"
                        title="לחץ כאן כדי לבטל את סימון הביצוע ולהחזיר למצב לא בוצע"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:text-amber-400" />
                          <span className="truncate group-hover:text-amber-200">{t.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResetTask(t);
                          }}
                          className="text-[8px] bg-emerald-900/80 group-hover:bg-rose-950 group-hover:text-rose-300 group-hover:border-rose-800 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-700 shrink-0 transition-colors"
                          title="לחץ לביטול ביצוע"
                        >
                          <span className="group-hover:hidden">בוצע ✓</span>
                          <span className="hidden group-hover:inline">בטל ✕</span>
                        </button>
                      </div>
                    ))}

                    {/* Water Tests */}
                    {dayWaterLogs.map((w: any) => (
                      <div
                        key={w.id}
                        className="p-2 rounded-2xl bg-cyan-950/30 border border-cyan-900/50 text-[10px] text-cyan-300 space-y-0.5"
                      >
                        <div className="flex items-center gap-1 font-bold">
                          <FlaskConical className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>בדיקת מים</span>
                        </div>
                        <div className="text-[9px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                          {w.ph && <span>pH: {w.ph}</span>}
                          {w.freeChlorine && <span>חיטוי: {w.freeChlorine}</span>}
                          {w.alkalinity && <span>TA: {w.alkalinity}</span>}
                        </div>
                      </div>
                    ))}

                    {/* Diary Notes */}
                    {dayEntries.map((e: any) => (
                      <div
                        key={e.id}
                        className="p-2 rounded-2xl bg-purple-950/25 border border-purple-900/50 text-[10px] text-purple-300 flex items-center gap-1.5 truncate"
                        title={e.title}
                      >
                        <BookOpen className="w-3 h-3 text-purple-400 shrink-0" />
                        <span className="truncate">{e.title}</span>
                      </div>
                    ))}

                    {pendingDayTasks.length === 0 && doneTasks.length === 0 && dayWaterLogs.length === 0 && dayEntries.length === 0 && (
                      <div className="text-center py-10 text-slate-500 text-[11px] border border-dashed border-slate-800/70 rounded-2xl">
                        <span>אין משימות</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Day Footer Status */}
                <div className="pt-2 border-t border-slate-850 text-[10px] text-slate-400 text-center font-medium">
                  {pendingDayTasks.length > 0 ? `${pendingDayTasks.length} משימות להשלמה` : "✓ יום פנוי ומאוזן"}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MONTHLY GRID VIEW */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-2 overflow-hidden">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
            {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map((day, idx) => (
              <div key={idx} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((cell, idx) => {
              const { dayTasks, doneTasks, dayEntries, dayWaterLogs } = getEventsForDay(cell.date);
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

                    {dayWaterLogs.map((w: any) => (
                      <div
                        key={`w-${w.id}`}
                        className="text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 truncate flex items-center gap-1 font-medium"
                        title="בדיקת איכות מים (מקלון)"
                      >
                        <FlaskConical className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span className="truncate">בדיקת מים</span>
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
                    {dayWaterLogs.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300" />}
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
            const { dayTasks, doneTasks, dayEntries, dayWaterLogs } = getEventsForDay(selectedDay);
            const total = dayTasks.length + doneTasks.length + dayEntries.length + dayWaterLogs.length;

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
                      {dayTasks.map((task) => {
                        const isFuture = isTaskFuture(task);
                        return (
                          <div
                            key={task.id}
                            className={`border rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-all ${
                              isFuture
                                ? "bg-slate-950/70 border-slate-800/80"
                                : "bg-slate-950 border-cyan-800/60 shadow-lg"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                    {task.category === "WEEKLY" ? "שבועי" : task.category === "MONTHLY" ? "חודשי" : task.category === "QUARTERLY" ? "רבעוני" : "תקופתי"}
                                  </span>
                                  {isFuture && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>מתוזמן לעתיד ({new Date(task.nextDueDate).toLocaleDateString("he-IL")})</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditTaskModal(task)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition-colors"
                                    title="ערוך משימה"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete button: DISABLED/BLOCKED for future tasks */}
                                  {!isFuture ? (
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                                      title="מחק משימה"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1.5 text-slate-600 cursor-not-allowed opacity-50 flex items-center gap-0.5"
                                      title="לא ניתן למחוק משימות עתידיות מתוכננות"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <h4 className="font-bold text-white text-sm pt-1">{task.title}</h4>
                              {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                            </div>

                            {/* Button: Disabled if future, enabled starting from planned date */}
                            <div className="pt-2 border-t border-slate-800/80">
                              {isFuture ? (
                                <div className="text-[10px] text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center justify-center gap-1 font-medium">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>ייפתח לביצוע במועד ({new Date(task.nextDueDate).toLocaleDateString("he-IL")})</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openCompletionModal(task)}
                                  className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>סמן ביצוע</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Completed Tasks */}
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

                {/* Water Tests performed on this date */}
                {dayWaterLogs.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4" />
                      <span>בדיקות איכות מים שבוצעו ותועדו:</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dayWaterLogs.map((w: any) => {
                        const phStr = w.phRange || (w.ph !== null ? `pH ${w.ph}` : null);
                        const clStr = w.chlorineRange || (w.freeChlorine !== null ? `${w.freeChlorine} ppm` : null);
                        const alkStr = w.alkalinityRange || (w.alkalinity !== null ? `${w.alkalinity} ppm` : null);
                        return (
                          <div key={w.id} className="bg-slate-950/90 border border-cyan-900/60 rounded-2xl p-4 space-y-2 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800">
                                  <FlaskConical className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-white text-xs">בדיקת איכות מים (מקלון)</span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                שעה {new Date(w.testedAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1 border-t border-slate-800">
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <div className="text-slate-400">חומציות</div>
                                <div className="font-bold text-cyan-300">{phStr || "—"}</div>
                              </div>
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <div className="text-slate-400">חיטוי</div>
                                <div className="font-bold text-cyan-300">{clStr || "—"}</div>
                              </div>
                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                                <div className="text-slate-400">בסיסיות</div>
                                <div className="font-bold text-cyan-300">{alkStr || "—"}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
                <span>🧪 בדיקת מקלון מים</span>
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
                /* === 2. PURE WATER TESTING FORM (TEST STRIP RANGES) === */
                <div className="space-y-3.5">
                  <div className="bg-purple-950/40 p-3 rounded-2xl border border-purple-800/60 text-xs text-purple-200">
                    בחר את טווחי הצבעים שנראו במקלון הבדיקה. התוצאות יישמרו ישירות ב<b>יומן בדיקות המים</b>.
                  </div>

                  {/* 1. pH Range Picker */}
                  <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">1. רמת pH (חומציות):</span>
                      <span className="text-[10px] text-cyan-400">יעד: 7.2 - 7.6</span>
                    </div>
                    <select
                      value={selectedPhRange}
                      onChange={(e) => setSelectedPhRange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                    >
                      {PH_RANGES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק:</label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={noNumericPh}
                            onChange={(e) => {
                              setNoNumericPh(e.target.checked);
                              if (e.target.checked) setManualPh("");
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                        </label>
                      </div>
                      {!noNumericPh && (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="הזן ערך מספרי (למשל: 7.4)"
                          value={manualPh}
                          onChange={(e) => setManualPh(e.target.value)}
                          className="w-full bg-slate-900/90 border border-slate-750 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* 2. Chlorine Range Picker */}
                  <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">2. כלור / ברום (חיטוי):</span>
                      <span className="text-[10px] text-cyan-400">יעד: 2.0 - 4.0 ppm</span>
                    </div>
                    <select
                      value={selectedClRange}
                      onChange={(e) => setSelectedClRange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                    >
                      {CHLORINE_RANGES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={noNumericCl}
                            onChange={(e) => {
                              setNoNumericCl(e.target.checked);
                              if (e.target.checked) setManualCl("");
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                        </label>
                      </div>
                      {!noNumericCl && (
                        <input
                          type="number"
                          step="0.1"
                          placeholder="הזן ערך מספרי (למשל: 3.0)"
                          value={manualCl}
                          onChange={(e) => setManualCl(e.target.value)}
                          className="w-full bg-slate-900/90 border border-slate-750 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* 3. Alkalinity Range Picker */}
                  <div className="space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">3. בסיסיות (TA):</span>
                      <span className="text-[10px] text-cyan-400">יעד: 80 - 120 ppm</span>
                    </div>
                    <select
                      value={selectedAlkRange}
                      onChange={(e) => setSelectedAlkRange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-semibold"
                    >
                      {ALKALINITY_RANGES.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                    <div className="pt-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] text-slate-400 font-medium">ערך מספרי מדויק ב-ppm:</label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={noNumericAlk}
                            onChange={(e) => {
                              setNoNumericAlk(e.target.checked);
                              if (e.target.checked) setManualAlk("");
                            }}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-cyan-300">ללא ערך מספרי</span>
                        </label>
                      </div>
                      {!noNumericAlk && (
                        <input
                          type="number"
                          step="1"
                          placeholder="הזן ערך מספרי (למשל: 90)"
                          value={manualAlk}
                          onChange={(e) => setManualAlk(e.target.value)}
                          className="w-full bg-slate-900/90 border border-slate-750 rounded-xl px-3 py-1.5 text-white text-xs placeholder:text-slate-500"
                        />
                      )}
                    </div>
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
                      <option value="GREEN">🌿 ירוקים / אצות</option>
                      <option value="METALLIC_COPPER">🪙 ירוק-טורקיז / נחושת (Copper)</option>
                      <option value="METALLIC_RUST">⚙️ חום / חלודה / ברזל (Iron / Rust)</option>
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
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all cursor-pointer select-none"
                >
                  {isSubmittingCompletion ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>שומר ומעדכן יומן...</span>
                    </>
                  ) : (
                    <span>שמור ביצוע משימה</span>
                  )}
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
              <h2 className="text-lg font-bold text-white">הזנת משימה עתידית</h2>
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

      {/* Proactive Maintenance Modal (Step 1: Input & AI Trigger) */}
      {isProactiveModalOpen && !proactiveAnalysis && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">הזנת פעולת אחזקה שבוצעה</h2>
                  <p className="text-[11px] text-slate-400">ה-AI ינתח את הפעולה, ויציג התרעה לאישורך לפני שינוי זימונים</p>
                </div>
              </div>
              <button onClick={() => setIsProactiveModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAnalyzeProactive} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">תאריך ביצוע הפעולה</label>
                  <input
                    type="date"
                    required
                    value={proactiveDate}
                    onChange={(e) => setProactiveDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">גיל המים לפני הפעולה (ימים)</label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={priorWaterAge}
                    onChange={(e) => setPriorWaterAge(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  תאר במלל חופשי מה ביצעת בג'קוזי:
                </label>
                <textarea
                  required
                  rows={4}
                  value={proactiveText}
                  onChange={(e) => setProactiveText(e.target.value)}
                  placeholder="למשל: החלפתי 30% ממי הג'קוזי במים נקיים ושטפתי את הפילטר..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-xs leading-relaxed focus:border-amber-500"
                />

                {/* Categorized routine presets */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-300">בחר מתוך שגרות התחזוקה:</span>
                    {proactiveText && (
                      <button
                        type="button"
                        onClick={() => setProactiveText("")}
                        className="text-[10px] text-slate-400 hover:text-rose-400 underline"
                      >
                        נקה בחירה
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {/* Weekly Routines */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">שגרות שבועיות:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { label: "בדיקת איכות מים (מקלון)", text: "בדיקת איכות מים וחיטוי שבועית במקלון" },
                          { label: "תוספת אנזימים שבועית", text: "תוספת אנזימים שבועית לפירוק שומנים" },
                          { label: "שטיפת פילטר שבועית", text: "שטיפת פילטר שבועית יסודית בזרם מים" },
                          { label: "שוק חיטוי מחמצן", text: "טיפול שוק מחמצן שבועי (Non-Chlorine Shock)" },
                          { label: "ניקוי קו מים ודפנות", text: "ניקוי קו מים ודפנות הג'קוזי במטלית" },
                        ].map((routine, idx) => {
                          const isSelected = proactiveText.includes(routine.text);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!proactiveText.trim()) {
                                  setProactiveText(routine.text);
                                } else if (!isSelected) {
                                  setProactiveText(prev => `${prev} + ${routine.text}`);
                                } else {
                                  setProactiveText(prev => prev.replace(routine.text, "").replace(/\+\s*\+/, "+").trim().replace(/^\+|\+$/, "").trim());
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                                isSelected
                                  ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-sm"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
                              }`}
                            >
                              {isSelected ? "✓ " : ""}{routine.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Monthly Routines */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">שגרות חודשיות:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { label: "החלפת מים חלקית (25%)", text: "החלפת מים חלקית של 25% ממי הג'קוזי" },
                          { label: "החלפת מים חלקית (30%)", text: "החלפת מים חלקית של 30% ממי הג'קוזי" },
                          { label: "החלפת מים (50%)", text: "החלפת חצי מים (50%) במים טריים" },
                          { label: "ניקוי פילטר בהשריה", text: "ניקוי פילטר עמוק בהשריה חודשית בחומר ייעודי" },
                          { label: "טיפוח כיסוי תרמי (UV)", text: "בדיקת אטימות וטיפוח כיסוי תרמי בספריי הגנת UV" },
                        ].map((routine, idx) => {
                          const isSelected = proactiveText.includes(routine.text);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!proactiveText.trim()) {
                                  setProactiveText(routine.text);
                                } else if (!isSelected) {
                                  setProactiveText(prev => `${prev} + ${routine.text}`);
                                } else {
                                  setProactiveText(prev => prev.replace(routine.text, "").replace(/\+\s*\+/, "+").trim().replace(/^\+|\+$/, "").trim());
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                                isSelected
                                  ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-sm"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
                              }`}
                            >
                              {isSelected ? "✓ " : ""}{routine.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Periodic & Annual Routines */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">שגרות תקופתיות ושנתיות:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          { label: "שטיפת צנרת וריקון מלא (100%)", text: "שטיפת צנרת (Biofilm Flush), ריקון ומילוי מים חדשים (100%)" },
                          { label: "ריקון ומילוי מים מלא (100%)", text: "ריקון ומילוי מים מלא (100%) ללא שטיפת צנרת" },
                          { label: "החלפת פילטר חדש (שנתי)", text: "החלפת פילטר חדש בג'קוזי (שנתי)" },
                        ].map((routine, idx) => {
                          const isSelected = proactiveText.includes(routine.text);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (!proactiveText.trim()) {
                                  setProactiveText(routine.text);
                                } else if (!isSelected) {
                                  setProactiveText(prev => `${prev} + ${routine.text}`);
                                } else {
                                  setProactiveText(prev => prev.replace(routine.text, "").replace(/\+\s*\+/, "+").trim().replace(/^\+|\+$/, "").trim());
                                }
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                                isSelected
                                  ? "bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-sm"
                                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
                              }`}
                            >
                              {isSelected ? "✓ " : ""}{routine.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-[11px] flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  💡 <strong>דוגמה להשפעה:</strong> אם החלפת מים היום, ה-AI יזהה שאין טעם להוסיף ברום/חיטוי מחר ויציע לדחות את הזימון כדי למנוע בזבוז ולתת למים להתאזן תחילה.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProactiveModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzingProactive || !proactiveText.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzingProactive ? "ה-AI מנתח ומחשב זימונים..." : "✨ נתח פעולה והצע התאמת זימונים"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proactive Maintenance Confirmation Modal (Step 2: AI Proposal & User Confirmation) */}
      {proactiveAnalysis && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-2xl w-full space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">התרעה לאישור: התאמת לוח זמנים בעקבות פעולה יזומה</h2>
                  <p className="text-[11px] text-slate-400">בדוק את השינויים שה-AI מציע לפני החלתם על לוח השנה</p>
                </div>
              </div>
              <button onClick={() => setProactiveAnalysis(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Understanding Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-900/60 space-y-2">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>ניתוח ה-AI של הפעולה:</span>
              </div>
              <div className="text-xs text-white font-bold">{proactiveAnalysis.understanding}</div>
              <div className="text-xs text-slate-300 leading-relaxed pr-5">
                {proactiveAnalysis.chemicalImpact}
              </div>
            </div>

            {/* Proposed Schedule Shifts */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>זימונים קיימים שיוזזו בלוח השנה ({proactiveAnalysis.scheduleShifts.length}):</span>
              </h3>

              {proactiveAnalysis.scheduleShifts.length === 0 ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
                  אין זימונים קרובים שדורשים דחייה או הזזה.
                </div>
              ) : (
                <div className="space-y-2">
                  {proactiveAnalysis.scheduleShifts.map((shift: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-amber-900/40 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <span className="font-bold text-white">{shift.taskTitle}</span>
                        <div className="flex items-center gap-2 font-bold">
                          <span className="line-through text-slate-500 text-[11px]">
                            {new Date(shift.currentDueDate).toLocaleDateString("he-IL")}
                          </span>
                          <span className="text-amber-400">➔</span>
                          <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800 text-[11px]">
                            מועד חדש: {new Date(shift.newDueDate).toLocaleDateString("he-IL")} (+{shift.shiftDays} ימים)
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-300/90 leading-relaxed">
                        💡 {shift.reason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Tasks to Create */}
            {proactiveAnalysis.newTasksToCreate?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>משימות מעקב חדשות שיתווספו ללוח השנה:</span>
                </h3>

                <div className="space-y-2">
                  {proactiveAnalysis.newTasksToCreate.map((newTask: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-cyan-900/40 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white">{newTask.title}</span>
                        <span className="text-cyan-300 font-bold text-[11px]">
                          מועד יעד: {new Date(newTask.dueDate).toLocaleDateString("he-IL")} {new Date(newTask.dueDate).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">{newTask.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jacuzzi Refill Notification */}
            {proactiveAnalysis.updateJacuzziRefill && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-200 text-xs flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  <strong>עדכון הגדרות ג'קוזי:</strong> תאריך מילוי המים האחרון יעודכן להיום ({new Date(proactiveDate).toLocaleDateString("he-IL")}).
                </span>
              </div>
            )}

            {/* Action Buttons: Confirm vs Reject */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setProactiveAnalysis(null);
                  setIsProactiveModalOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                ✕ בטל (אל תשנה זימונים)
              </button>

              <button
                type="button"
                disabled={isApplyingProactive}
                onClick={handleApplyProactive}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApplyingProactive ? "מעדכן לוח שנה ויומן..." : "✓ אשר והחל שינויים בלוח השנה וביומן"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Routine Optimization AI Modal */}
      {routineOptimization && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-3xl w-full space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                  <Sparkles className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>אופטימיזציית שגרת טיפולים חכמה (AI)</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                      ציון שגרה: {routineOptimization.routineHealthScore}/100
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400">סריקה מלאה של בדיקות העבר, גיל המים, פעולות שבוצעו ודיוק לוח השנה</p>
                </div>
              </div>
              <button onClick={() => setRoutineOptimization(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Executive Summary & Water Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-purple-900/40 space-y-1">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ניתוח מצב השגרה:</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  {routineOptimization.executiveSummary}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-cyan-900/40 space-y-1">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" />
                  <span>גיל המים והחלפות:</span>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  {routineOptimization.waterAgeAnalysis}
                </div>
              </div>
            </div>

            {/* Section 1: Tasks To Delete (מחיקת משימות מיותרות/לא רלוונטיות) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-rose-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  <span>משימות לא רלוונטיות או כפולות למחיקה מלוח השנה ({routineOptimization.tasksToDelete?.length || 0}):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">בחר אילו משימות להסיר</span>
              </h3>

              {(!routineOptimization.tasksToDelete || routineOptimization.tasksToDelete.length === 0) ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>כל המשימות בלוח השנה רלוונטיות – לא נמצאו משימות מיותרות למחיקה!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {routineOptimization.tasksToDelete.map((task: any) => {
                    const isChecked = selectedDeletions.includes(task.taskId);
                    return (
                      <label
                        key={task.taskId}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-rose-950/30 border-rose-800/60 text-rose-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDeletions([...selectedDeletions, task.taskId]);
                            } else {
                              setSelectedDeletions(selectedDeletions.filter((id) => id !== task.taskId));
                            }
                          }}
                          className="mt-1 rounded accent-rose-500"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={isChecked ? "line-through text-rose-300" : "text-slate-300"}>
                              {task.taskTitle}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300">
                              מחיקה מומלצת
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">💡 {task.reason}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Tasks To Update (רענון תאריכים ותדירויות) */}
            {routineOptimization.tasksToUpdate?.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>משימות קיימות שמומלץ לרענן תאריך או תדירות ({routineOptimization.tasksToUpdate.length}):</span>
                </h3>

                <div className="space-y-2">
                  {routineOptimization.tasksToUpdate.map((task: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-amber-900/40 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-white">{task.taskTitle}</span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="line-through text-slate-500">
                            {new Date(task.currentDueDate).toLocaleDateString("he-IL")}
                          </span>
                          <span className="text-amber-400">➔</span>
                          <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                            מועד חדש: {new Date(task.newDueDate).toLocaleDateString("he-IL")}
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-amber-300/90 leading-relaxed">
                        💡 {task.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Tasks To Create (הוספת משימות חיוניות שחסרות) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-cyan-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>משימות יסוד חיוניות שמומלץ להוסיף ללוח השנה ({routineOptimization.tasksToCreate?.length || 0}):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">בחר אילו משימות להוסיף</span>
              </h3>

              {(!routineOptimization.tasksToCreate || routineOptimization.tasksToCreate.length === 0) ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>כל משימות היסוד הנדרשות כבר קיימות בלוח השנה שלך!</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {routineOptimization.tasksToCreate.map((task: any, idx: number) => {
                    const isChecked = selectedAdditions.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isChecked
                            ? "bg-cyan-950/30 border-cyan-800/60 text-cyan-200"
                            : "bg-slate-950/60 border-slate-800 text-slate-400"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAdditions([...selectedAdditions, idx]);
                            } else {
                              setSelectedAdditions(selectedAdditions.filter((i) => i !== idx));
                            }
                          }}
                          className="mt-1 rounded accent-cyan-500"
                        />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-white">{task.title}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                                כל {task.frequencyDays} ימים
                              </span>
                              <span className="text-[10px] text-slate-400">
                                יעד ראשון: {new Date(task.nextDueDate).toLocaleDateString("he-IL")}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-300">{task.description}</div>
                          <div className="text-[10px] text-cyan-400/90 pt-0.5">💡 {task.reason}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setRoutineOptimization(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                ✕ בטל (אל תשנה שגרה)
              </button>

              <button
                type="button"
                disabled={isApplyingOptimization}
                onClick={handleApplyOptimization}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApplyingOptimization ? "מעדכן שגרה ולוח שנה..." : "✓ אשר והחל אופטימיזציית שגרה בלוח השנה"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
