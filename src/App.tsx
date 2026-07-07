/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  LayoutGrid, 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Wand2, 
  Sparkles, 
  Clock, 
  AlertTriangle, 
  UtensilsCrossed,
  Trash2,
  Edit2,
  X,
  GraduationCap,
  Code2,
  Layers,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Tab = 'today' | 'planner' | 'review';

const rawApiUrl = (import.meta as any).env.VITE_API_URL || ((import.meta as any).env.DEV ? 'http://localhost:5001' : '');
const API_BASE_URL = rawApiUrl ? rawApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') : '';

// --- Modal Component ---
const CATEGORY_CONFIG: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  'College Tasks': { label: 'College Tasks', color: 'text-amber-600', dot: 'bg-amber-500', icon: GraduationCap },
  'Coding & Dev Skills':  { label: 'Coding & Dev Skills',  color: 'text-primary',   dot: 'bg-primary',   icon: Code2   },
  'Others':   { label: 'Others',          color: 'text-tertiary',  dot: 'bg-tertiary',  icon: Layers  },
  'Create Schedule': { label: 'Create Schedule', color: 'text-sky-600', dot: 'bg-sky-500', icon: CalendarDays }
};

// --- Constants & Helpers ---
const TIME_SLOTS: string[] = [];
for (let h = 4; h <= 23; h++) {
  const hStr = h.toString().padStart(2, '0');
  TIME_SLOTS.push(`${hStr}:00`);
  TIME_SLOTS.push(`${hStr}:30`);
}
TIME_SLOTS.push('00:00');

const calculateEndTime = (start: string) => {
  const [hours, minutes] = start.split(':').map(Number);
  let endMinutes = minutes + 30;
  let endHours = hours;
  if (endMinutes >= 60) {
    endMinutes = 0;
    endHours = (endHours + 1) % 24;
  }
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

const parseTimeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getSlotCount = (startTime: string, endTime: string) => {
  const startMin = parseTimeToMinutes(startTime);
  let endMin = parseTimeToMinutes(endTime);
  if (endMin < startMin) {
    endMin += 24 * 60; // overnight
  }
  const diff = endMin - startMin;
  return Math.max(1, Math.ceil(diff / 30));
};

const getAdjustedSlotCount = (task: any, allTasks: any[]) => {
  const startMin = parseTimeToMinutes(task.startTime);
  let endMin = parseTimeToMinutes(task.endTime);
  if (endMin < startMin) endMin += 24 * 60;
  
  // Base slots count including the end time slot
  let slots = Math.max(1, Math.ceil((endMin - startMin) / 30) + 1);
  
  // Find if there is a consecutive task that starts during these slots
  const sameDayTasks = allTasks.filter(t => t.day === task.day && t._id !== task._id);
  
  const startSlotIndex = TIME_SLOTS.indexOf(task.startTime);
  if (startSlotIndex !== -1) {
    for (let i = 1; i < slots; i++) {
      const checkSlotTime = TIME_SLOTS[startSlotIndex + i];
      if (!checkSlotTime) break;
      
      const hasClashingTask = sameDayTasks.some(t => t.startTime === checkSlotTime);
      if (hasClashingTask) {
        slots = i;
        break;
      }
    }
  }
  
  return slots;
};

const isSlotCovered = (tasks: any[], day: string, time: string) => {
  const currentSlotIndex = TIME_SLOTS.indexOf(time);
  return tasks.some(t => {
    if (t.day !== day) return false;
    
    const startSlotIndex = TIME_SLOTS.indexOf(t.startTime);
    if (startSlotIndex === -1) return false;
    
    const adjustedSlots = getAdjustedSlotCount(t, tasks);
    return currentSlotIndex > startSlotIndex && currentSlotIndex < startSlotIndex + adjustedSlots;
  });
};

const TaskModal = ({ isOpen, onClose, onSubmit, onDelete, initialData }: any) => {
  const [taskName, setTaskName] = useState('');
  const [priority, setPriority] = useState('Do First');
  const [category, setCategory] = useState('College Tasks');
  const [day, setDay] = useState('MON');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');

  useEffect(() => {
    if (isOpen) {
      setTaskName(initialData?.taskName || '');
      setPriority(initialData?.priority || 'Do First');
      setCategory(initialData?.category || 'College Tasks');
      setDay(initialData?.day || 'MON');
      
      const start = initialData?.startTime || '09:00';
      setStartTime(start);
      setEndTime(initialData?.endTime || calculateEndTime(start));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleTimeChange = (start: string) => {
    setStartTime(start);
    setEndTime(calculateEndTime(start));
  };

  const handleFormSubmit = () => {
    if (!taskName.trim()) {
      alert("Task name cannot be empty");
      return;
    }
    const startM = parseTimeToMinutes(startTime);
    const endM = parseTimeToMinutes(endTime);
    if (endM <= startM) {
      alert("End time must be after start time");
      return;
    }
    onSubmit({ taskName, priority, category, day, startTime, endTime });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-lexend text-xl font-bold text-on-surface">{initialData?._id ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant"><X size={20}/></button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Task Name</label>
            <input value={taskName} onChange={e=>setTaskName(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none" placeholder="Task name..." />
          </div>

          {/* Category Pills */}
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Category</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      category === key
                        ? `${cfg.color} border-current bg-current/10`
                        : 'text-on-surface-variant border-outline-variant/30 hover:border-outline/50'
                    }`}
                  >
                    <Icon size={14} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Priority</label>
              <select value={priority} onChange={e=>setPriority(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                <option value="Do First">Do First (Q1)</option>
                <option value="Schedule">Schedule (Q2)</option>
                <option value="Delegate">Delegate (Q3)</option>
                <option value="Eliminate">Eliminate (Q4)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Day</label>
              <select value={day} onChange={e=>setDay(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                <option value="MON">MON (Monday)</option>
                <option value="TUE">TUE (Tuesday)</option>
                <option value="WED">WED (Wednesday)</option>
                <option value="THU">THU (Thursday)</option>
                <option value="FRI">FRI (Friday)</option>
                <option value="SAT">SAT (Saturday)</option>
                <option value="SUN">SUN (Sunday)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Start Time</label>
              <select value={startTime} onChange={e=>handleTimeChange(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                {TIME_SLOTS.slice(0, -1).map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">End Time</label>
              <select value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                {TIME_SLOTS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={handleFormSubmit} className="w-full py-3 mt-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer">
            {initialData?._id ? 'Save Changes' : 'Create Task'}
          </button>

          {initialData?._id && (
            <button 
              onClick={() => {
                if (confirm("Are you sure you want to delete this task?")) {
                  onDelete(initialData._id);
                  onClose();
                }
              }} 
              className="w-full py-3 mt-1 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-600/20 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={16} /> Delete Task
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, streak }: { activeTab: Tab, setActiveTab: (t: Tab) => void, streak: number }) => {
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'today', label: 'Today', icon: CalendarDays },
    { id: 'planner', label: 'Planner', icon: LayoutGrid },
    { id: 'review', label: 'Review', icon: BarChart3 },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface-container-lowest border-r border-outline-variant/30 h-screen sticky top-0 p-6">
      <div className="flex items-center gap-3 text-primary mb-10 px-2">
        <div className="p-2 bg-primary/10 rounded-xl">
          <LayoutGrid size={24} className="fill-primary/20" />
        </div>
        <span className="font-lexend font-bold text-xl tracking-tight">FocusFlow</span>
      </div>

      <nav className="flex flex-col gap-2 flex-grow">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
            >
              <Icon size={20} className={isActive ? 'fill-primary/20' : 'group-hover:scale-110 transition-transform'} />
              <span className={`font-lexend text-sm font-semibold tracking-wide ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl -mr-10 -mt-10 animate-pulse-slow" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
             <Flame size={24} className="text-white fill-white/50 animate-[pulse_2s_ease-in-out_infinite]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-0.5">Current Streak</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-on-surface font-lexend tracking-tighter">{streak}</span>
              <span className="text-sm font-bold text-on-surface-variant">Days</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ streak }: { streak: number }) => (
  <header className="flex md:hidden justify-between items-center px-6 h-16 bg-surface-container-lowest/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/30">
    <div className="flex items-center gap-2 text-primary">
      <div className="p-1.5 bg-primary/10 rounded-lg">
        <LayoutGrid size={20} className="fill-primary/20" />
      </div>
      <span className="font-lexend font-semibold text-lg tracking-tight">FocusFlow</span>
    </div>
    <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full shadow-sm">
      <Flame size={16} className="text-orange-500 fill-orange-500/50 animate-[pulse_2s_ease-in-out_infinite]" />
      <span className="font-lexend font-bold text-sm text-orange-600">{streak}</span>
    </div>
  </header>
);

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: Tab, setActiveTab: (t: Tab) => void }) => {
  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'today', label: 'Today', icon: CalendarDays },
    { id: 'planner', label: 'Planner', icon: LayoutGrid },
    { id: 'review', label: 'Review', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline-variant/30 px-6 py-2 pb-6 z-40 flex justify-around items-center md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 relative ${isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant'}`}
          >
            <Icon size={isActive ? 22 : 20} className={isActive ? 'fill-primary/20' : ''} />
            <span className={`font-lexend text-[10px] font-medium tracking-wide uppercase ${isActive ? 'font-bold' : ''}`}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="nav-active"
                className="w-1 h-1 bg-primary rounded-full absolute -bottom-1"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

// --- View: Today ---
const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case 'Do First':
      return 'bg-rose-50/80 border-rose-500 text-rose-800 hover:bg-rose-100/80';
    case 'Schedule':
      return 'bg-blue-50/80 border-blue-600 text-blue-800 hover:bg-blue-100/80';
    case 'Delegate':
      return 'bg-amber-50/80 border-amber-500 text-amber-800 hover:bg-amber-100/80';
    case 'Eliminate':
    default:
      return 'bg-slate-100/80 border-slate-400 text-slate-800 hover:bg-slate-200/80';
  }
};

// --- View: Today ---
const TodayView = ({ 
  tasks, 
  streak, 
  selectedDate,
  setSelectedDate,
  onAdd, 
  onEdit, 
  onDelete, 
  onToggleDone,
  onToggleStar,
  onDragStart,
  onDragOver,
  onDrop
}: { 
  tasks: any[], 
  streak: number, 
  selectedDate: Date,
  setSelectedDate: (date: Date) => void,
  onAdd: (q?: any)=>any, 
  onEdit: (t:any)=>any, 
  onDelete: (id:string)=>any, 
  onToggleDone: (t:any)=>any,
  onToggleStar: (t:any)=>any,
  onDragStart: (e: React.DragEvent, id: string) => void,
  onDragOver: (e: React.DragEvent) => void,
  onDrop: (e: React.DragEvent) => void,
  key?: any
}) => {
  const q1Tasks = tasks.filter(t => t.priority === 'Do First' && t.category !== 'Create Schedule');
  const q2Tasks = tasks.filter(t => t.priority === 'Schedule' && t.category !== 'Create Schedule');
  const q3Tasks = tasks.filter(t => t.priority === 'Delegate' && t.category !== 'Create Schedule');
  const q4Tasks = tasks.filter(t => t.priority === 'Eliminate' && t.category !== 'Create Schedule');
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const daysMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const todayDayStr = daysMap[new Date().getDay()];

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 1);
    setSelectedDate(next);
  };

  const isTodaySlotCovered = (time: string) => {
    const currentSlotIndex = TIME_SLOTS.indexOf(time);
    return tasks.some(t => {
      const startSlotIndex = TIME_SLOTS.indexOf(t.startTime);
      if (startSlotIndex === -1) return false;
      const adjustedSlots = getAdjustedSlotCount(t, tasks);
      return currentSlotIndex > startSlotIndex && currentSlotIndex < startSlotIndex + adjustedSlots;
    });
  };

  const renderMatrixTask = (t: any, ringColor: string, bgColor: string, txtColor: string) => {
    const isSchedule = t.category === 'Create Schedule';
    return (
      <div key={t._id} className={`flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border border-outline-variant/20 rounded-2xl group/task transition-all duration-200 ${t.isCompleted && !isSchedule ? 'opacity-50' : ''}`}>
        {isSchedule ? (
          <div className="flex items-center gap-3 overflow-hidden text-left flex-grow pl-1">
            <CalendarDays size={18} className="text-sky-600 flex-shrink-0" />
            <span className="text-xs font-bold text-on-surface line-clamp-2">{t.taskName}</span>
          </div>
        ) : (
          <button onClick={()=>onToggleDone(t)} className="flex items-center gap-3 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
            {t.isCompleted ? (
              <div className={`w-5 h-5 rounded-full border ${ringColor} ${bgColor} flex items-center justify-center text-white flex-shrink-0 cursor-pointer shadow-sm`}>
                <CheckCircle2 size={12} className="stroke-[3]" />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-primary bg-white transition-colors flex-shrink-0 cursor-pointer shadow-inner" />
            )}
            <span className={`text-xs font-bold text-on-surface line-clamp-2 ${t.isCompleted ? 'line-through opacity-60' : ''}`}>{t.taskName}</span>
          </button>
        )}
        <div className="flex items-center gap-0.5 flex-shrink-0 pl-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStar(t); }} 
            className={`p-1 rounded hover:bg-slate-100 cursor-pointer transition-all ${
              t.isStarred 
                ? 'text-amber-500 opacity-100' 
                : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover/task:opacity-100'
            }`}
            title={t.isStarred ? 'Hapus bintang' : 'Beri bintang'}
          >
            <Star size={12} className={t.isStarred ? 'fill-amber-500 text-amber-500' : ''} />
          </button>
          <button onClick={()=>onEdit(t)} className={`p-1 hover:bg-slate-100 rounded opacity-0 group-hover/task:opacity-100 transition-opacity ${txtColor}`}><Edit2 size={12}/></button>
          <button onClick={()=>onDelete(t._id)} className={`p-1 hover:bg-slate-100 rounded opacity-0 group-hover/task:opacity-100 transition-opacity ${txtColor}`}><Trash2 size={12}/></button>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-32 md:pb-12"
    >
      {/* Dynamic English Greeting & Daily Momentum Progress side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 flex flex-col justify-center">
          <span className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest flex items-center gap-2">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
            {selectedDate.toDateString() === new Date().toDateString() && (
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">TODAY</span>
            )}
          </span>
          <h1 className="font-lexend text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mt-1">
            {getGreeting()}, Aflah.
          </h1>
          <p className="text-sm font-semibold text-on-surface-variant mt-2">
            You have {totalTasks} deep focus blocks scheduled {selectedDate.toDateString() === new Date().toDateString() ? 'today' : 'on this day'}.
          </p>
        </div>

        <div className="bg-white border border-outline-variant/40 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-lexend font-bold text-on-surface text-sm">Daily Momentum</span>
            <span className="font-lexend font-bold text-primary text-sm">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-3 bg-surface-container-low rounded-full overflow-hidden shadow-inner border border-outline-variant/25">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
            />
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
            {completedTasks} of {totalTasks} tasks completed
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Priority Matrix */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-lexend text-on-surface font-semibold text-lg">Priority Matrix</h2>
            <button onClick={onAdd} className="text-primary text-xs font-black flex items-center gap-1 px-3 py-1.5 bg-primary/5 rounded-full hover:bg-primary/10 transition-colors">
              <Plus size={14} /> Add Task
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Q1: Urgent & Essential */}
            <div className="bg-white rounded-3xl p-5 border border-outline-variant/40 relative flex flex-col min-h-[12rem]">
              <div className="absolute top-4 bottom-4 left-0 w-1.5 bg-rose-500 rounded-r-lg" />
              <div className="flex items-center justify-between mb-4 pl-3">
                <h3 className="font-lexend text-rose-500 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  Urgent & Essential
                </h3>
                <span className="text-rose-500 font-extrabold text-sm">!</span>
              </div>
              <div className="flex flex-col gap-2.5 pl-3 flex-grow overflow-y-auto no-scrollbar">
                {q1Tasks.length === 0 ? (
                  <span className="text-xs text-on-surface-variant italic py-2">No tasks scheduled</span>
                ) : (
                  q1Tasks.map(t => renderMatrixTask(t, 'border-rose-500', 'bg-rose-500', 'text-rose-600'))
                )}
              </div>
            </div>

            {/* Q2: Strategic Growth */}
            <div className="bg-white rounded-3xl p-5 border border-outline-variant/40 relative flex flex-col min-h-[12rem]">
              <div className="absolute top-4 bottom-4 left-0 w-1.5 bg-blue-600 rounded-r-lg" />
              <div className="flex items-center justify-between mb-4 pl-3">
                <h3 className="font-lexend text-blue-600 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  Strategic Growth
                </h3>
                <span className="text-blue-600 font-extrabold text-sm">↗</span>
              </div>
              <div className="flex flex-col gap-2.5 pl-3 flex-grow overflow-y-auto no-scrollbar">
                {q2Tasks.length === 0 ? (
                  <span className="text-xs text-on-surface-variant italic py-2">No tasks scheduled</span>
                ) : (
                  q2Tasks.map(t => renderMatrixTask(t, 'border-blue-600', 'bg-blue-600', 'text-blue-600'))
                )}
              </div>
            </div>

            {/* Q3: Delegate / Automate */}
            <div className="bg-white rounded-3xl p-5 border border-outline-variant/40 relative flex flex-col min-h-[12rem]">
              <div className="absolute top-4 bottom-4 left-0 w-1.5 bg-amber-500 rounded-r-lg" />
              <div className="flex items-center justify-between mb-4 pl-3">
                <h3 className="font-lexend text-amber-500 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  Delegate / Automate
                </h3>
                <span className="text-amber-500 font-extrabold text-sm">⚡</span>
              </div>
              <div className="flex flex-col gap-2.5 pl-3 flex-grow overflow-y-auto no-scrollbar">
                {q3Tasks.length === 0 ? (
                  <span className="text-xs text-on-surface-variant italic py-2">No tasks scheduled</span>
                ) : (
                  q3Tasks.map(t => renderMatrixTask(t, 'border-amber-500', 'bg-amber-500', 'text-amber-600'))
                )}
              </div>
            </div>

            {/* Q4: Eliminate / Backlog */}
            <div className="bg-white rounded-3xl p-5 border border-outline-variant/40 relative flex flex-col min-h-[12rem]">
              <div className="absolute top-4 bottom-4 left-0 w-1.5 bg-slate-400 rounded-r-lg" />
              <div className="flex items-center justify-between mb-4 pl-3">
                <h3 className="font-lexend text-slate-500 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  Eliminate / Backlog
                </h3>
                <span className="text-slate-500 font-extrabold text-sm">🗑️</span>
              </div>
              <div className="flex flex-col gap-2.5 pl-3 flex-grow overflow-y-auto no-scrollbar">
                {q4Tasks.length === 0 ? (
                  <span className="text-xs text-on-surface-variant italic py-2">No tasks scheduled</span>
                ) : (
                  q4Tasks.map(t => renderMatrixTask(t, 'border-slate-400', 'bg-slate-400', 'text-slate-600'))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Time Blocks Timeline */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-lexend text-on-surface font-semibold text-lg">Timeline</h2>
            
            <div className="flex items-center gap-2 bg-white border border-outline-variant/30 rounded-full px-3.5 py-1.5 shadow-sm">
              <button 
                onClick={handlePrevDay}
                className="p-1.5 hover:bg-slate-100 rounded-full text-on-surface-variant transition-all cursor-pointer flex items-center justify-center active:scale-90"
                title="Previous Day"
              >
                <ChevronLeft size={18} />
              </button>
              
              <span className="font-lexend text-xs md:text-sm font-extrabold text-on-surface px-2 min-w-[8.5rem] text-center select-none tracking-wide">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              
              <button 
                onClick={handleNextDay}
                className="p-1.5 hover:bg-slate-100 rounded-full text-on-surface-variant transition-all cursor-pointer flex items-center justify-center active:scale-90"
                title="Next Day"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="bg-white border border-outline-variant/35 rounded-3xl overflow-hidden shadow-sm">
            {TIME_SLOTS.map((time) => {
              const covered = isTodaySlotCovered(time);
              const startingTask = tasks.find(t => t.startTime === time);
              const slotCount = startingTask ? getAdjustedSlotCount(startingTask, tasks) : 1;
              
              return (
                <div key={time} className="flex min-h-12 border-b border-outline-variant/10 last:border-0 relative">
                  <div className="w-16 flex-shrink-0 flex items-start justify-end pr-4 pt-3 border-r border-outline-variant/10">
                    <span className={`font-lexend text-[10px] font-bold ${time.endsWith(':00') ? 'text-primary' : 'text-outline/70'}`}>
                      {time}
                    </span>
                  </div>
                  <div 
                    data-day={todayDayStr}
                    data-time={time}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className="flex-grow p-1.5 flex flex-col justify-center relative min-h-[3rem]"
                  >
                    {!covered && startingTask && (() => {
                      const t = startingTask;
                      const priorityStyle = getPriorityStyles(t.priority);
                      const isSchedule = t.category === 'Create Schedule';
                      return (
                        <div 
                          key={t._id} 
                          draggable={true}
                          onDragStart={(e) => onDragStart(e, t._id)}
                          onClick={() => onEdit(t)}
                          className={`${priorityStyle} border-l-4 rounded-r-xl p-2.5 shadow-sm absolute left-1.5 right-1.5 top-1.5 z-10 group/timeline cursor-grab active:cursor-grabbing transition-all duration-200 ${t.isCompleted && !isSchedule ? 'opacity-50 grayscale' : ''}`}
                          style={{ height: `${slotCount * 3 - 0.3}rem` }}
                        >
                          {isSchedule ? (
                            <div className="absolute top-3 left-3 text-current">
                              <CalendarDays size={14} className="text-sky-600 flex-shrink-0" />
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onToggleDone(t); }} 
                              className="absolute top-3 left-2.5 z-10 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
                            >
                              {t.isCompleted ? (
                                <div className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-white shadow-sm">
                                  <CheckCircle2 size={11} className="stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-current/50 hover:border-current bg-white/20 transition-colors shadow-inner" />
                              )}
                            </button>
                          )}
                          <span className={`font-lexend text-xs font-bold block leading-none mb-1 pr-10 pl-6 ${t.isCompleted && !isSchedule ? 'line-through' : ''}`}>{t.taskName}</span>
                          <span className="text-[9px] font-bold opacity-75 pl-6 uppercase tracking-wider">{t.category}</span>
                          {slotCount > 1 && (
                            <p className="text-[8px] opacity-75 pl-6 mt-1 font-semibold">
                              {t.startTime} - {t.endTime}
                            </p>
                          )}
                          <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onToggleStar(t); }} 
                              className={`p-1 rounded hover:bg-white/50 cursor-pointer transition-all ${
                                t.isStarred 
                                  ? 'text-amber-500 opacity-100' 
                                  : 'text-current/50 hover:text-amber-500 opacity-0 group-hover/timeline:opacity-100'
                              }`}
                              title={t.isStarred ? 'Hapus bintang' : 'Beri bintang'}
                            >
                              <Star size={12} className={t.isStarred ? 'fill-amber-500 text-amber-500' : ''} />
                            </button>
                            <button onClick={(e)=>{ e.stopPropagation(); onEdit(t); }} className="p-1 hover:bg-white/50 rounded opacity-0 group-hover/timeline:opacity-100 transition-opacity text-current"><Edit2 size={12}/></button>
                            <button onClick={(e)=>{ e.stopPropagation(); onDelete(t._id); }} className="p-1 hover:bg-white/50 rounded opacity-0 group-hover/timeline:opacity-100 transition-opacity text-error"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      );
                    })()}
                    {time === '12:00' && !startingTask && !covered && (
                      <div className="flex items-center justify-center py-2 bg-slate-50/40 rounded-xl w-full">
                        <span className="font-lexend text-[9px] text-outline-variant tracking-widest font-black uppercase">LUNCH BREAK</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* FAB (Mobile Only) */}
      <button onClick={()=>onAdd()} className="md:hidden fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center active:scale-95 transition-transform z-50">
        <Plus size={32} />
      </button>
    </motion.div>
  );
};

// --- View: Planner ---
const PlannerView = ({ tasks, fetchTasks, onAdd, onEdit, onDelete, onToggleDone }: { tasks: any[], fetchTasks: () => any, onAdd: (q?: any) => any, onEdit: (t:any) => any, onDelete: (id:string) => any, onToggleDone: (t:any) => any, key?: any }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [weekDates, setWeekDates] = useState<{date: string, label: string}[]>([]);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  const fetchWeeklyTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/week`);
      const data = await res.json();
      setWeeklyTasks(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    const today = new Date();
    const day = today.getDay() || 7; 
    const monday = new Date(today);
    if (day !== 1) monday.setHours(-24 * (day - 1));

    const dates = [];
    for (let i=0; i<7; i++) { 
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    setWeekDates(dates);
    fetchWeeklyTasks();
  }, [tasks]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const storedMaster = localStorage.getItem('master_schedule');
      const masterSchedule = storedMaster ? JSON.parse(storedMaster) : [];

      const res = await fetch(`${API_BASE_URL}/api/tasks/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: prompt,
          existingTasks: weeklyTasks,
          masterSchedule: masterSchedule
        })
      });
      await res.json();
      
      setPrompt('');
      fetchTasks(); // today's task refetch
      fetchWeeklyTasks(); // weekly tasks refetch
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetToMaster = async () => {
    if (!window.confirm("Are you sure you want to reset the current week's schedule to the Master Template? This will clear all other tasks for this week.")) return;
    try {
      await fetch(`${API_BASE_URL}/api/tasks/clear`, { method: 'DELETE' });
      const storedMaster = localStorage.getItem('master_schedule');
      if (storedMaster) {
        const masterTasks = JSON.parse(storedMaster);
        for (const task of masterTasks) {
          const payload = {
            taskName: task.taskName,
            priority: 'Do First',
            category: 'College Tasks',
            day: task.day,
            startTime: task.startTime,
            endTime: task.endTime,
            isCompleted: false
          };
          await fetch(`${API_BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }
      fetchWeeklyTasks();
      fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

const handleFillTemplate = () => {
    setPrompt(`Kamu adalah "Weekly Strategist", AI Planner bawaan untuk aplikasi FocusFlow. Tugasmu adalah menyusun jadwal mingguan yang realistis dari hari Senin sampai Minggu (MON, TUE, WED, THU, FRI, SAT, SUN) di antara jam 04:00 hingga 24:00 berdasarkan daftar aktivitas mentah dari user.

CONSTRAINTS (BATASAN ATURAN):
1. Urutan Prioritas Utama Kategori:
   - "College Tasks": Prioritas tertinggi (contoh: kuis, College Tasks, UTS, UAS, responsi).
   - "Coding & Dev Skills": Prioritas kedua (contoh: course, ngoding, belajar framework).
   - "Others": Prioritas terakhir (kegiatan personal/umum).
2. Aturan Distribusi: SEBARKAN tugas secara proporsional dalam seminggu. JANGAN menumpuk semua tugas di satu hari.
3. Locked Time Slots: Perhatikan jadwal kuliah tetap (Master Schedule) dan tugas berjalan (Existing Tasks) yang dikunci. Jangan menumpuk kegiatan lain di waktu kuliah tersebut.
4. Penyesuaian/Reschedule: Jika user meminta perubahan/reschedule jadwal kuliah yang dikunci (misal: "geser kuliah PBO hari Jumat ke jam 13:00"), sesuaikan waktu kuliah tersebut untuk minggu ini.
5. Manajemen Jeda: Berikan waktu istirahat minimal 30 menit antar kegiatan. Durasi satu tugas idealnya 1.5 - 2 jam (jangan seharian penuh untuk satu tugas).

CONTOH OUTPUT YANG DIHARAPKAN (Format JSON Array):
[
  {
    "taskName": "Selesain Tugas Matlan",
    "category": "College Tasks",
    "day": "MON",
    "startTime": "09:00",
    "endTime": "11:00",
    "priority": "Do First"
  },
  {
    "taskName": "Belajar Course Dicoding",
    "category": "Coding & Dev Skills",
    "day": "TUE",
    "startTime": "14:00",
    "endTime": "16:00",
    "priority": "Schedule"
  }
]

----------------------------------------------------------------------
DATA INPUT USER:

"geser kuliah PBO hari Jumat ke jam 13:00. Selain itu, minggu ini jadwal aku padat banget. Aku mau selesain Course Dicoding (tidak ada deadline resmi tapi target minggu ini progres), ada tugas Matematika Lanjut (Matlan) yang deadline-nya hari Rabu jam 12 siang, dan terakhir aku mau nyicil belajar buat persiapan UTS minggu depan."`);
  };

  const hours = TIME_SLOTS;

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    
    let target = e.target as HTMLElement;
    while (target && !target.getAttribute("data-day")) {
      target = target.parentElement as HTMLElement;
    }
    
    if (target) {
      const day = target.getAttribute("data-day");
      const time = target.getAttribute("data-time");
      if (taskId && day && time) {
        try {
          await fetch(`${API_BASE_URL}/api/tasks/update-slot`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId, day, startTime: time })
          });
          fetchWeeklyTasks();
          fetchTasks();
        } catch (err) {
          console.error("Failed to update task slot:", err);
        }
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col gap-8 pb-32 md:pb-12"
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* AI Planner Card */}
        <section className="xl:col-span-2 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/30 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <h2 className="font-lexend text-2xl text-on-surface mb-3 font-semibold">Weekly Strategist</h2>
          <p className="text-sm text-on-surface-variant mb-6 max-w-lg">Brief your AI assistant on your goals. We'll handle the categorization, prioritization, and time-block mapping for you.</p>
          
          {/* Container baru yang membungkus textarea dan tombol menggunakan flexbox */}
          <div className="flex flex-col gap-3 w-full">
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Finish college tasks on Monday at 9am, learn Java programming on Saturday at 10am..."
              // Menghapus absolute constraints bawaan tombol agar textarea menjadi luas dan bersih
              className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-base focus:ring-2 focus:ring-primary h-48 resize-none shadow-inner placeholder:text-outline/40"
            />
            
            {/* Baris Tombol: Sekarang berada di bawah luar kotak textarea, berjejer ke kanan (justify-end) */}
            <div className="flex justify-end items-center gap-3 w-full">
              <button 
                onClick={handleFillTemplate}
                title="Gunakan Template Prompt"
                className="p-3 bg-surface-container-highest rounded-full text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
              >
                <Wand2 size={20} />
              </button>
              
              <button 
                onClick={handleGenerate} 
                disabled={isGenerating} 
                className="bg-primary text-white pl-4 pr-6 py-2.5 rounded-full flex items-center gap-2 font-lexend text-sm font-semibold shadow-xl shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Sparkles size={16} className="fill-white/20" />
                {isGenerating ? 'Generating...' : 'Generate Schedule'}
              </button>
            </div>
          </div>
        </section>

        {/* Focus Sidebar */}
        <div className="flex flex-col gap-6">

          {/* Card 1: College Tasks (Q1) */}
          <div className="bg-error/5 rounded-2xl p-5 border border-error/10 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-error" />
                <h3 className="font-lexend text-sm font-semibold text-on-surface">College Tasks</h3>
              </div>
              <button onClick={() => onAdd('Do First')} className="p-1 hover:bg-error/10 rounded-full text-error transition-colors"><Plus size={16}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {tasks.filter(t => t.priority === 'Do First' && t.category !== 'Create Schedule').slice(0, 3).map((task) => (
                <div key={task._id} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 flex justify-between items-center gap-4 shadow-sm hover:translate-x-1 transition-transform group/plan">
                  <button onClick={() => onToggleDone(task)} className="flex items-start gap-3 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                    {task.isCompleted ? (
                      <div className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-white mt-0.5 flex-shrink-0 shadow-sm">
                        <CheckCircle2 size={12} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 hover:border-primary bg-white transition-colors mt-0.5 flex-shrink-0 shadow-inner" />
                    )}
                    <div>
                      <p className={`text-sm font-bold text-on-surface truncate ${task.isCompleted ? 'line-through opacity-60' : ''}`}>{task.taskName}</p>
                      <p className={`font-lexend text-[10px] font-bold text-error mt-1 uppercase tracking-widest ${task.isCompleted ? 'opacity-60' : ''}`}>{task.startTime}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/plan:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant"><Edit2 size={14}/></button>
                    <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-error/10 rounded text-error"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.priority === 'Do First' && t.category !== 'Create Schedule').length === 0 && (
                <p className="text-xs text-on-surface-variant italic">No college tasks yet.</p>
              )}
            </div>
          </div>

          {/* Card 2: Coding & Dev Skills (Q2) */}
          <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 size={18} className="text-primary" />
                <h3 className="font-lexend text-sm font-semibold text-on-surface">Coding & Dev Skills</h3>
              </div>
              <button onClick={() => onAdd('Schedule')} className="p-1 hover:bg-primary/10 rounded-full text-primary transition-colors"><Plus size={16}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {tasks.filter(t => t.priority === 'Schedule' && t.category !== 'Create Schedule').slice(0, 3).map((task) => (
                <div key={task._id} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 flex justify-between items-center gap-4 shadow-sm hover:translate-x-1 transition-transform group/plan">
                  <button onClick={() => onToggleDone(task)} className="flex items-start gap-3 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                    {task.isCompleted ? (
                      <div className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-white mt-0.5 flex-shrink-0 shadow-sm">
                        <CheckCircle2 size={12} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 hover:border-primary bg-white transition-colors mt-0.5 flex-shrink-0 shadow-inner" />
                    )}
                    <div>
                      <p className={`text-sm font-bold text-on-surface truncate ${task.isCompleted ? 'line-through opacity-60' : ''}`}>{task.taskName}</p>
                      <p className={`font-lexend text-[10px] font-bold text-primary mt-1 uppercase tracking-widest ${task.isCompleted ? 'opacity-60' : ''}`}>{task.startTime}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/plan:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant"><Edit2 size={14}/></button>
                    <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-error/10 rounded text-error"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.priority === 'Schedule' && t.category !== 'Create Schedule').length === 0 && (
                <p className="text-xs text-on-surface-variant italic">No coding sessions yet.</p>
              )}
            </div>
          </div>

          {/* Card 3: Others (Q3) */}
          <div className="bg-tertiary/5 rounded-2xl p-5 border border-tertiary/10 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-tertiary" />
                <h3 className="font-lexend text-sm font-semibold text-on-surface">Others</h3>
              </div>
              <button onClick={() => onAdd('Delegate')} className="p-1 hover:bg-tertiary/10 rounded-full text-tertiary transition-colors"><Plus size={16}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {tasks.filter(t => t.priority === 'Delegate' && t.category !== 'Create Schedule').slice(0, 3).map((task) => (
                <div key={task._id} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 flex justify-between items-center gap-4 shadow-sm hover:translate-x-1 transition-transform group/plan">
                  <button onClick={() => onToggleDone(task)} className="flex items-start gap-3 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                    {task.isCompleted ? (
                      <div className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-white mt-0.5 flex-shrink-0 shadow-sm">
                        <CheckCircle2 size={12} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 hover:border-primary bg-white transition-colors mt-0.5 flex-shrink-0 shadow-inner" />
                    )}
                    <div>
                      <p className={`text-sm font-bold text-on-surface truncate ${task.isCompleted ? 'line-through opacity-60' : ''}`}>{task.taskName}</p>
                      <p className={`font-lexend text-[10px] font-bold text-tertiary mt-1 uppercase tracking-widest ${task.isCompleted ? 'opacity-60' : ''}`}>{task.startTime}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/plan:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant"><Edit2 size={14}/></button>
                    <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-error/10 rounded text-error"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.priority === 'Delegate' && t.category !== 'Create Schedule').length === 0 && (
                <p className="text-xs text-on-surface-variant italic">No other tasks yet.</p>
              )}
            </div>
          </div>

          {/* Card 4: Schedules */}
          <div className="bg-sky-500/5 rounded-2xl p-5 border border-sky-500/10 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-sky-500" />
                <h3 className="font-lexend text-sm font-semibold text-on-surface">Schedules</h3>
              </div>
              <button onClick={() => onAdd('Do First')} className="p-1 hover:bg-sky-500/10 rounded-full text-sky-500 transition-colors"><Plus size={16}/></button>
            </div>
            <div className="flex flex-col gap-3">
              {tasks.filter(t => t.category === 'Create Schedule').slice(0, 3).map((task) => (
                <div key={task._id} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/20 flex justify-between items-center gap-4 shadow-sm hover:translate-x-1 transition-transform group/plan">
                  <div className="flex items-start gap-3 overflow-hidden text-left">
                    <CalendarDays size={18} className="text-sky-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-on-surface truncate">{task.taskName}</p>
                      <p className="font-lexend text-[10px] font-bold text-sky-600 mt-1 uppercase tracking-widest">{task.startTime} - {task.endTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/plan:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant"><Edit2 size={14}/></button>
                    <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-error/10 rounded text-error"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.category === 'Create Schedule').length === 0 && (
                <p className="text-xs text-on-surface-variant italic">No schedules configured.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Schedule Table */}
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <h2 className="font-lexend text-xl font-bold text-on-surface">Time-Blocked Week</h2>
            <p className="text-xs text-on-surface-variant mt-1">Reviewing {weekDates[0]?.label} - {weekDates[weekDates.length-1]?.label}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsMasterModalOpen(true)} 
              className="text-amber-600 text-xs font-black flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full hover:bg-amber-100 transition-colors border border-amber-200 cursor-pointer"
            >
              <GraduationCap size={14} /> Manage Master Template
            </button>
            <button 
              onClick={handleResetToMaster} 
              className="text-primary text-xs font-black flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-full hover:bg-primary/10 transition-colors border border-primary/10 cursor-pointer"
            >
              <RotateCcw size={14} /> Reset to Master
            </button>
            <button 
              onClick={() => onAdd()} 
              className="text-primary text-xs font-black flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 rounded-full hover:bg-primary/10 transition-colors border border-primary/10 cursor-pointer"
            >
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>
        <div className="w-full overflow-x-auto select-none bg-white border border-outline-variant/30 rounded-3xl shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-outline-variant/20 font-lexend text-[11px] uppercase font-bold text-outline">
                <th className="p-4 w-20 min-w-[80px] text-right">Time</th>
                {weekDates.map(d => (
                  <th key={d.date} className="p-4 border-l border-outline-variant/20 text-center min-w-[120px]">{d.label.split(',')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {hours.map((time) => (
                <tr key={time} className="border-b border-outline-variant/10 h-14 last:border-0 grow">
                  <td className="p-2 text-right font-semibold text-outline">{time}</td>
                  {weekDates.map((d, index) => {
                    const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
                    const dayStr = daysOfWeek[index];
                    
                    // Check if this slot is covered by an ongoing task
                    if (isSlotCovered(weeklyTasks, dayStr, time)) {
                      return null;
                    }
                    
                    const startingTask = weeklyTasks.find(t => t.startTime === time && t.day === dayStr);
                    const rowSpanVal = startingTask ? getAdjustedSlotCount(startingTask, weeklyTasks) : 1;
                    
                    return (
                      <td 
                        key={d.date} 
                        rowSpan={rowSpanVal}
                        className="p-1.5 border-l border-outline-variant/10 w-[14%] min-w-[120px] h-px relative"
                      >
                        <div
                          data-day={dayStr}
                          data-time={time}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              onAdd({ day: dayStr, startTime: time });
                            }
                          }}
                          className="w-full h-full min-h-[3rem] transition-colors hover:bg-primary/5 flex flex-col justify-start cursor-pointer"
                        >
                          {startingTask && (() => {
                            const t = startingTask;
                            const tileStyle = getPriorityStyles(t.priority);
                            return (
                              <div 
                                key={t._id} 
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, t._id)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(t);
                                }}
                                className={`${tileStyle} border-l-4 rounded-xl p-2.5 font-bold text-[10px] leading-tight overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-150 h-full flex flex-col justify-between group`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      {t.category === 'Create Schedule' && <CalendarDays size={13} className="text-sky-600 flex-shrink-0" />}
                                      <span className={`truncate ${t.isCompleted && t.category !== 'Create Schedule' ? 'line-through opacity-60' : ''}`}>
                                        {t.taskName}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEdit(t);
                                        }}
                                        className="p-0.5 hover:bg-black/15 rounded text-current cursor-pointer"
                                      >
                                        <Edit2 size={10} />
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm('Delete this task?')) onDelete(t._id);
                                        }}
                                        className="p-0.5 hover:bg-error/10 rounded text-error cursor-pointer"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                  {rowSpanVal > 1 && (
                                    <p className="text-[8px] opacity-75 mt-1 font-semibold">
                                      {t.startTime} - {t.endTime}
                                    </p>
                                  )}
                                </div>
                                <span className="text-[8px] opacity-75 self-start uppercase tracking-wider mt-1">{t.category}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      <MasterScheduleModal 
        isOpen={isMasterModalOpen} 
        onClose={() => setIsMasterModalOpen(false)} 
      />
    </motion.div>
  );
};

// --- View: Review ---
// --- View: Review ---
// --- Helper Functions for ReviewView ---
const getTaskXP = (priority: string) => {
  switch (priority) {
    case 'Do First': return 100;
    case 'Schedule': return 80;
    case 'Delegate': return 50;
    case 'Eliminate': return 20;
    default: return 50;
  }
};

const getEisenhowerLabel = (priority: string) => {
  switch (priority) {
    case 'Do First': return 'Q1: Urgent & Essential';
    case 'Schedule': return 'Q2: Strategic Growth';
    case 'Delegate': return 'Q3: Delegate / Automate';
    case 'Eliminate': return 'Q4: Eliminate / Backlog';
    default: return priority;
  }
};

const getQuadrantColor = (priority: string) => {
  switch (priority) {
    case 'Do First': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'Schedule': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'Delegate': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'Eliminate': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
};

const getTaskDateLabel = (dayStr: string) => {
  const daysMap: Record<string, { full: string; index: number }> = {
    'MON': { full: 'Senin', index: 0 },
    'TUE': { full: 'Selasa', index: 1 },
    'WED': { full: 'Rabu', index: 2 },
    'THU': { full: 'Kamis', index: 3 },
    'FRI': { full: 'Jumat', index: 4 },
    'SAT': { full: 'Sabtu', index: 5 },
    'SUN': { full: 'Minggu', index: 6 }
  };
  
  const info = daysMap[dayStr];
  if (!info) return dayStr;
  
  const today = new Date();
  const day = today.getDay() || 7;
  const monday = new Date(today);
  if (day !== 1) monday.setDate(today.getDate() - (day - 1));
  
  const taskDate = new Date(monday);
  taskDate.setDate(monday.getDate() + info.index);
  
  const dateNum = taskDate.getDate();
  const monthName = taskDate.toLocaleDateString('id-ID', { month: 'short' });
  return `${info.full}, ${dateNum} ${monthName}`;
};

// --- View: Review ---
const ReviewView = ({ streak }: { streak: number, key?: any }) => {
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ q1Total: 0, q1Completed: 0, totalTasks: 0, totalCompleted: 0 });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const getMondayDateString = () => {
    const today = new Date();
    const day = today.getDay() || 7;
    const monday = new Date(today);
    if (day !== 1) monday.setDate(today.getDate() - (day - 1));
    return monday.toISOString().split('T')[0];
  };

  useEffect(() => {
    const loadReviewData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/week`);
        const weeklyTasksData = await res.json();
        const tasksList = Array.isArray(weeklyTasksData) ? weeklyTasksData : [];
        setWeeklyTasks(tasksList);

        const q1Tasks = tasksList.filter((t:any) => t.priority === 'Do First');
        setStats({
          totalTasks: tasksList.length,
          totalCompleted: tasksList.filter((t:any) => t.isCompleted).length,
          q1Total: q1Tasks.length,
          q1Completed: q1Tasks.filter((t:any) => t.isCompleted).length,
        });

        const startOfWeek = getMondayDateString();
        const revRes = await fetch(`${API_BASE_URL}/api/review?week=${startOfWeek}`);
        const revData = await revRes.json();
        if (revData) {
          setReflectionNotes(revData.reflectionNotes || '');
          setAiSummary(revData.aiSummary || '');
          setIsSaved(true);
        }
      } catch(e) { console.error(e); }
    };
    loadReviewData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const startOfWeek = getMondayDateString();
    try {
      await fetch(`${API_BASE_URL}/api/review/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: startOfWeek,
          reflectionNotes
        })
      });
      setIsSaved(true);
    } catch (e) {
      console.error("Failed to save reflection:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    const startOfWeek = getMondayDateString();

    try {
      const res = await fetch(`${API_BASE_URL}/api/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: startOfWeek,
          reflectionNotes,
          ...stats,
          streakDays: streak
        })
      });
      const data = await res.json();
      setAiSummary(data.aiSummary);
    } catch(e) {
      console.error(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  const score = stats.totalTasks > 0 ? Math.round((stats.totalCompleted / stats.totalTasks) * 100) : 0;

  const DAYS_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const starredTasks = weeklyTasks
    .filter((t: any) => t.isStarred)
    .sort((a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-10 pb-32 md:pb-12"
    >
      <header className="text-center md:text-left">
        <h1 className="font-lexend text-4xl font-bold text-on-surface tracking-tighter">Insights & Analytics</h1>
        <p className="text-base text-on-surface-variant font-medium mt-2">Weekly Performance Evaluation</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
        <section className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-outline-variant/30 shadow-2xl flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-slow" />
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary via-primary-container to-primary flex items-center justify-center relative z-10 shadow-[0_20px_50px_rgba(70,72,212,0.4)]">
              <span className="font-lexend text-6xl font-bold text-white tracking-tighter">{score}</span>
            </div>
          </div>

          <div className="text-center z-10">
            <h2 className="font-lexend text-2xl font-bold text-on-surface">Focus Quotient</h2>
            <div className="mt-4 inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-600/20">
              <Flame size={14} className="fill-white/30" />
              Hot {streak} Day Streak
            </div>
          </div>

          <p className="text-sm text-on-surface-variant text-center max-w-[280px] leading-relaxed z-10 font-medium italic">
            {aiSummary ? `"${aiSummary}"` : '"Submit your reflection below to receive an AI Evaluation of your week."'}
          </p>
        </section>

        <div className="lg:col-span-3 flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-md">
              <div className="flex items-center gap-2 text-on-surface-variant mb-3">
                <CheckCircle2 size={20} />
                <span className="font-lexend text-xs font-bold uppercase tracking-widest">Completed Workflow</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-lexend text-4xl font-bold text-on-surface font-black tracking-tighter">{stats.totalCompleted}/{stats.totalTasks}</span>
                <span className="text-sm text-on-surface-variant font-semibold">Targets</span>
              </div>
            </div>
            <div className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-md">
              <div className="flex items-center gap-2 text-primary mb-3">
                <AlertTriangle size={20} />
                <span className="font-lexend text-xs font-bold uppercase tracking-widest">Q1 Adherence</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-lexend text-4xl font-bold text-primary font-black tracking-tighter">{stats.q1Completed}/{stats.q1Total}</span>
                <span className="text-sm text-on-surface-variant font-semibold">Tasks</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Box Starred Tasks (Dark Mode) */}
            <div className="bg-[#0f172a] text-white border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col min-h-[18rem]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-amber-400 text-lg">📌</span>
                <h3 className="font-lexend text-base font-bold text-slate-100">Fokus Utama & Pencapaian Minggu Ini</h3>
              </div>
              <div className="flex-grow overflow-y-auto no-scrollbar max-h-[16rem]">
                {starredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Star size={32} className="text-slate-600 mb-2 stroke-[1.5]" />
                    <p className="text-xs text-slate-400 italic">Belum ada tugas berbintang minggu ini.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Tandai tugas pentingmu dengan ikon bintang (⭐) di halaman Today.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {starredTasks.map((task) => (
                      <div key={task._id} className="bg-slate-800/40 hover:bg-slate-800/60 border border-slate-800 rounded-2xl p-4 transition-all duration-200 flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-3">
                          <span className="text-sm font-bold text-slate-100 leading-snug">{task.taskName}</span>
                          <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                            +{getTaskXP(task.priority)} XP
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {/* Date Badge */}
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-900/50 px-2 py-0.5 rounded-md border border-slate-800">
                            📅 {getTaskDateLabel(task.day)}
                          </span>
                          {/* Eisenhower Quadrant Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getQuadrantColor(task.priority)}`}>
                            🎯 {getEisenhowerLabel(task.priority)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Reflection */}
            <section className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-md flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5 px-1">
                  <h3 className="font-lexend text-lg font-bold text-on-surface italic">Weekly Reflection</h3>
                  <Sparkles size={20} className="text-primary/40" />
                </div>
                <textarea 
                  value={reflectionNotes}
                  onChange={e => {
                    setReflectionNotes(e.target.value);
                    setIsSaved(false);
                  }}
                  placeholder="What went well? What blocked you this week? What did you learn?"
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary min-h-[8rem] resize-none shadow-inner placeholder:text-outline/40"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button 
                  onClick={handleSave} 
                  disabled={isSaving || !reflectionNotes || isSaved} 
                  className="flex-grow bg-slate-100 hover:bg-slate-200 text-on-surface font-lexend text-sm font-semibold py-3 rounded-2xl border border-outline-variant/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : isSaved ? 'Saved ✓' : 'Save Reflection'}
                </button>
                <button 
                  onClick={handleEvaluate} 
                  disabled={isEvaluating || !reflectionNotes || !isSaved} 
                  className="flex-grow bg-primary hover:bg-primary-container text-white font-lexend text-sm font-semibold py-3 rounded-2xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={18} className="fill-white/20" />
                  {isEvaluating ? 'Evaluating...' : 'Get AI Feedback'}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Master Schedule Modal ---
const MasterScheduleModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [masterTasks, setMasterTasks] = useState<any[]>([]);
  const [taskName, setTaskName] = useState('');
  const [day, setDay] = useState('MON');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('master_schedule');
      if (stored) {
        setMasterTasks(JSON.parse(stored));
      } else {
        setMasterTasks([]);
      }
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (!taskName) return;
    const newTask = {
      id: Date.now().toString(),
      taskName,
      day,
      startTime,
      endTime
    };
    const updated = [...masterTasks, newTask];
    setMasterTasks(updated);
    localStorage.setItem('master_schedule', JSON.stringify(updated));
    setTaskName('');
  };

  const handleDelete = (id: string) => {
    const updated = masterTasks.filter(t => t.id !== id);
    setMasterTasks(updated);
    localStorage.setItem('master_schedule', JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Form panel */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-lexend text-xl font-bold text-on-surface">Add Master Lecture</h2>
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Lecture Name</label>
            <input 
              value={taskName} 
              onChange={e=>setTaskName(e.target.value)} 
              className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none" 
              placeholder="e.g. Pemrograman Berorientasi Objek" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Day</label>
              <select value={day} onChange={e=>setDay(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                <option value="MON">MON (Monday)</option>
                <option value="TUE">TUE (Tuesday)</option>
                <option value="WED">WED (Wednesday)</option>
                <option value="THU">THU (Thursday)</option>
                <option value="FRI">FRI (Friday)</option>
                <option value="SAT">SAT (Saturday)</option>
                <option value="SUN">SUN (Sunday)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Start Time</label>
              <select value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                {TIME_SLOTS.slice(0, -1).map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">End Time</label>
            <select value={endTime} onChange={e=>setEndTime(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
              {TIME_SLOTS.map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={handleAdd} 
            className="w-full py-3 mt-2 bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-600/30 hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer"
          >
            Add to Master Template
          </button>
        </div>

        {/* List panel */}
        <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-outline-variant/30 pt-6 md:pt-0 md:pl-6 max-h-[350px] md:max-h-[500px] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-lexend text-lg font-bold text-on-surface">Master List</h3>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant"><X size={20}/></button>
          </div>
          <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
            {masterTasks.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic py-4">No master lectures configured.</p>
            ) : (
              masterTasks.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 border border-outline-variant/30 rounded-xl flex items-center justify-between gap-3">
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-on-surface truncate">{t.taskName}</h4>
                    <p className="text-[10px] text-on-surface-variant/80 mt-0.5 font-semibold">
                      {t.day} • {t.startTime} - {t.endTime}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(t.id)} 
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [tasks, setTasks] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  
  const daysMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const todayDayStr = daysMap[new Date().getDay()];
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedDay = daysMap[selectedDate.getDay()];
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const handleAutoFillFromMaster = async (mondayStr: string) => {
    try {
      // 1. Clear all tasks
      await fetch(`${API_BASE_URL}/api/tasks/clear`, { method: 'DELETE' });
      
      // 2. Load master schedule
      const storedMaster = localStorage.getItem('master_schedule');
      if (storedMaster) {
        const masterTasks = JSON.parse(storedMaster);
        for (const task of masterTasks) {
          const payload = {
            taskName: task.taskName,
            priority: 'Do First',
            category: 'College Tasks',
            day: task.day,
            startTime: task.startTime,
            endTime: task.endTime,
            isCompleted: false
          };
          await fetch(`${API_BASE_URL}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      }
      
      localStorage.setItem('last_loaded_week', mondayStr);
    } catch (e) {
      console.error("Auto-fill error:", e);
    }
  };

  const fetchData = async () => {
    try {
      const activeDay = selectedDay || todayDayStr;
      
      // Check new week transition
      const today = new Date();
      const day = today.getDay() || 7;
      const monday = new Date(today);
      if (day !== 1) monday.setDate(today.getDate() - (day - 1));
      const mondayStr = monday.toISOString().split('T')[0];

      const lastLoadedWeek = localStorage.getItem('last_loaded_week');
      if (lastLoadedWeek && lastLoadedWeek !== mondayStr) {
        await handleAutoFillFromMaster(mondayStr);
      } else if (!lastLoadedWeek) {
        localStorage.setItem('last_loaded_week', mondayStr);
      }
      
      const tasksRes = await fetch(`${API_BASE_URL}/api/tasks?day=${activeDay}`);
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      const streakRes = await fetch(`${API_BASE_URL}/api/streak/check`, { method: 'POST' });
      const streakData = await streakRes.json();
      setStreak(streakData.currentStreak || 0);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleOpenAdd = (param?: string | { day: string; startTime: string; priority?: string }) => { 
    if (typeof param === 'string') {
      setEditingTask({ priority: param, day: selectedDay });
    } else if (param && typeof param === 'object') {
      setEditingTask({ day: selectedDay, ...param });
    } else {
      setEditingTask({ day: selectedDay });
    }
    setIsModalOpen(true); 
  };
  
  const handleOpenEdit = (task: any) => { 
    setEditingTask(task); 
    setIsModalOpen(true); 
  };
  
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${id}`, { method: 'DELETE' });
      fetchData();
    } catch(e) {
      console.error("Delete failed:", e);
    }
  };

  const handleToggleDone = async (task: any) => {
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !task.isCompleted })
      });
      fetchData();
    } catch(e) {
      console.error("Toggle done failed:", e);
    }
  };

  const handleToggleStar = async (task: any) => {
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !task.isStarred })
      });
      fetchData();
    } catch(e) {
      console.error("Toggle star failed:", e);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    
    let target = e.target as HTMLElement;
    while (target && !target.getAttribute("data-day")) {
      target = target.parentElement as HTMLElement;
    }
    
    if (target) {
      const day = target.getAttribute("data-day");
      const time = target.getAttribute("data-time");
      try {
        await fetch(`${API_BASE_URL}/api/tasks/update-slot`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, day, startTime: time })
        });
        fetchData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleModalSubmit = async (data: any) => {
    const payload = {
      taskName: data.taskName,
      priority: data.priority,
      category: data.category,
      day: data.day,
      startTime: data.startTime,
      endTime: data.endTime,
      isCompleted: editingTask?.isCompleted || false
    };
    try {
      if (editingTask?._id) {
        await fetch(`${API_BASE_URL}/api/tasks/${editingTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_BASE_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch(e) {
      console.error("Save failed:", e);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-container-low font-sans selection:bg-primary selection:text-white">
      {/* Desktop Persistent Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} streak={streak} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen relative overflow-hidden">
        {/* Mobile Header */}
        <TopBar streak={streak} />

        <main className="flex-grow overflow-y-auto no-scrollbar relative w-full px-5 py-6 md:px-10 md:py-12 lg:px-16 lg:py-16">
          <div className="max-w-7xl mx-auto w-full h-full">
            <AnimatePresence mode="wait">
              {activeTab === 'today' && (
                <TodayView 
                  key="today" 
                  tasks={tasks} 
                  streak={streak} 
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  onAdd={handleOpenAdd} 
                  onEdit={handleOpenEdit} 
                  onDelete={handleDelete} 
                  onToggleDone={handleToggleDone} 
                  onToggleStar={handleToggleStar}
                  onDragStart={handleDragStart} 
                  onDragOver={handleDragOver} 
                  onDrop={handleDrop} 
                />
              )}
              {activeTab === 'planner' && <PlannerView key="planner" tasks={tasks} fetchTasks={fetchData} onAdd={handleOpenAdd} onEdit={handleOpenEdit} onDelete={handleDelete} onToggleDone={handleToggleDone} />}
              {activeTab === 'review' && <ReviewView key="review" streak={streak} />}
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Nav */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit} 
        onDelete={handleDelete}
        initialData={editingTask} 
      />
    </div>
  );
}
