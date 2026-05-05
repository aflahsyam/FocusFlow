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
  ArrowRight, 
  Clock, 
  AlertTriangle, 
  Flag,
  UtensilsCrossed,
  User,
  Trash2,
  Edit2,
  X,
  GraduationCap,
  Code2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type Tab = 'today' | 'planner' | 'review';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5001/api');
const FOCUS_SCORE = 92;

// --- Modal Component ---
const TaskModal = ({ isOpen, onClose, onSubmit, initialData }: any) => {
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState('Q1');
  const [startTime, setStartTime] = useState('09:00');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setQuadrant(initialData?.quadrant || 'Q1');
      setStartTime(initialData?.startTime || '09:00');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface-container-lowest w-full max-w-md rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-lexend text-xl font-bold text-on-surface">{initialData ? 'Edit Task' : 'Add Task'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-full text-on-surface-variant"><X size={20}/></button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Title</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none" placeholder="Task title..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Quadrant</label>
              <select value={quadrant} onChange={e=>setQuadrant(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                <option value="Q1">Q1 - Do First</option>
                <option value="Q2">Q2 - Schedule</option>
                <option value="Q3">Q3 - Delegate</option>
                <option value="Q4">Q4 - Eliminate</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Time</label>
              <select value={startTime} onChange={e=>setStartTime(e.target.value)} className="w-full mt-1 p-3 bg-surface-container-low text-on-surface rounded-xl border-none focus:ring-2 focus:ring-primary outline-none">
                {Array.from({length:21}, (_,i) => {
                  const h = i+4;
                  const time = h===24?'00:00':`${h.toString().padStart(2,'0')}:00`;
                  return <option key={time} value={time}>{time}</option>;
                })}
              </select>
            </div>
          </div>
          <button onClick={() => onSubmit({title, quadrant, startTime})} className="w-full py-3 mt-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95">
            {initialData ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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
const TodayView = ({ tasks, streak, onAdd, onEdit, onDelete, onToggleDone }: { tasks: any[], streak: number, onAdd: ()=>void, onEdit: (t:any)=>void, onDelete: (id:string)=>void, onToggleDone: (t:any)=>void }) => {
  const q1Tasks = tasks.filter(t => t.quadrant === 'Q1');
  const q2Tasks = tasks.filter(t => t.quadrant === 'Q2');
  const q3Tasks = tasks.filter(t => t.quadrant === 'Q3');
  const q4Tasks = tasks.filter(t => t.quadrant === 'Q4');
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isDone).length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const hours = Array.from({ length: 21 }, (_, i) => {
    const h = i + 4;
    return h === 24 ? '00:00' : `${h.toString().padStart(2, '0')}:00`;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-32 md:pb-12"
    >
      {/* Daily Progress */}
      <div className="bg-gradient-to-br from-yellow-50 to-white rounded-2xl p-5 border border-yellow-200 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-500 fill-yellow-500/30" />
            <span className="font-lexend font-bold text-yellow-800">Today's Focus</span>
          </div>
          <span className="text-[10px] font-bold text-yellow-700 bg-yellow-100/80 px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-200">
            {completedTasks} of {totalTasks} Completed
          </span>
        </div>
        <div className="w-full h-3 bg-yellow-100/50 rounded-full overflow-hidden shadow-inner border border-yellow-200/30">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Priority Matrix */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="font-lexend text-on-surface font-semibold">Priority Matrix</h2>
            <button onClick={onAdd} className="text-primary text-sm font-bold flex items-center gap-1 px-3 py-1 bg-primary/5 rounded-full hover:bg-primary/10 transition-colors">
              <Plus size={16} /> Add Task
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 min-h-[10rem] h-auto flex flex-col relative group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <h3 className="font-lexend text-primary text-sm font-semibold mb-2">Do First</h3>
              {q1Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q1Tasks.map(t => (
                  <div key={t._id} className={`flex items-start justify-between gap-2 mb-1 group/task ${t.isDone ? 'opacity-60' : ''}`}>
                    <button onClick={()=>onToggleDone(t)} className="flex items-start gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                      {t.isDone ? <CheckCircle2 size={16} className="text-primary mt-0.5 flex-shrink-0" /> : <Circle size={16} className="text-primary/40 mt-0.5 flex-shrink-0" />}
                      <span className={`text-xs font-medium text-on-surface-variant line-clamp-2 ${t.isDone ? 'line-through' : ''}`}>{t.title}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={()=>onEdit(t)} className="p-1 hover:bg-primary/10 rounded text-primary"><Edit2 size={12}/></button>
                      <button onClick={()=>onDelete(t._id)} className="p-1 hover:bg-error/10 rounded text-error"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 min-h-[10rem] h-auto flex flex-col relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
              <h3 className="font-lexend text-secondary text-sm font-semibold mb-2">Schedule</h3>
              {q2Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q2Tasks.map(t => (
                  <div key={t._id} className={`flex items-start justify-between gap-2 mb-1 group/task ${t.isDone ? 'opacity-60' : ''}`}>
                    <button onClick={()=>onToggleDone(t)} className="flex items-start gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                      {t.isDone ? <CheckCircle2 size={16} className="text-secondary mt-0.5 flex-shrink-0" /> : <Circle size={16} className="text-secondary/40 mt-0.5 flex-shrink-0" />}
                      <span className={`text-xs font-medium text-on-surface-variant line-clamp-2 ${t.isDone ? 'line-through' : ''}`}>{t.title}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={()=>onEdit(t)} className="p-1 hover:bg-secondary/10 rounded text-secondary"><Edit2 size={12}/></button>
                      <button onClick={()=>onDelete(t._id)} className="p-1 hover:bg-error/10 rounded text-error"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 min-h-[10rem] h-auto flex flex-col relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-tertiary" />
              <h3 className="font-lexend text-tertiary text-sm font-semibold mb-2">Delegate</h3>
              {q3Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q3Tasks.map(t => (
                  <div key={t._id} className={`flex items-start justify-between gap-2 mb-1 group/task ${t.isDone ? 'opacity-60' : ''}`}>
                    <button onClick={()=>onToggleDone(t)} className="flex items-start gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                      {t.isDone ? <CheckCircle2 size={16} className="text-tertiary mt-0.5 flex-shrink-0" /> : <Circle size={16} className="text-tertiary/40 mt-0.5 flex-shrink-0" />}
                      <span className={`text-xs font-medium text-on-surface-variant line-clamp-2 ${t.isDone ? 'line-through' : ''}`}>{t.title}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={()=>onEdit(t)} className="p-1 hover:bg-tertiary/10 rounded text-tertiary"><Edit2 size={12}/></button>
                      <button onClick={()=>onDelete(t._id)} className="p-1 hover:bg-error/10 rounded text-error"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
            </div>
            <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 min-h-[10rem] h-auto flex flex-col relative opacity-80">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-outline" />
              <h3 className="font-lexend text-outline text-sm font-semibold mb-2">Eliminate</h3>
              {q4Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q4Tasks.map(t => (
                  <div key={t._id} className={`flex items-start justify-between gap-2 mb-1 group/task ${t.isDone ? 'opacity-60' : ''}`}>
                    <button onClick={()=>onToggleDone(t)} className="flex items-start gap-2 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow opacity-60">
                      {t.isDone ? <CheckCircle2 size={16} className="text-outline mt-0.5 flex-shrink-0" /> : <Circle size={16} className="text-outline/40 mt-0.5 flex-shrink-0" />}
                      <span className={`text-xs font-medium text-on-surface-variant line-clamp-2 line-through`}>{t.title}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/task:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={()=>onEdit(t)} className="p-1 hover:bg-outline/10 rounded text-outline"><Edit2 size={12}/></button>
                      <button onClick={()=>onDelete(t._id)} className="p-1 hover:bg-error/10 rounded text-error"><Trash2 size={12}/></button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>

        {/* Time Blocks */}
        <section>
          <h2 className="font-lexend text-on-surface mb-4 font-semibold">Timeline</h2>
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
            {hours.map((time) => (
              <div key={time} className="flex min-h-16 border-b border-outline-variant/5 last:border-0 relative">
                <div className="w-16 flex-shrink-0 flex items-start justify-end pr-4 pt-4 border-r border-outline-variant/10">
                  <span className={`font-lexend text-[10px] font-semibold ${time === '09:00' ? 'text-primary font-bold' : 'text-outline'}`}>
                    {time}
                  </span>
                </div>
                <div className="flex-grow p-2">
                  {tasks.filter(t => t.startTime === time).map(t => (
                    <div key={t._id} className={`${t.quadrant === 'Q1' ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/10 border-secondary text-secondary'} border-l-4 rounded-r-lg p-3 shadow-sm h-full mb-1 relative group/timeline ${t.isDone ? 'opacity-50 grayscale' : ''}`}>
                      <button onClick={()=>onToggleDone(t)} className="absolute top-2 left-2 p-1 hover:bg-white/30 rounded-full transition-colors z-10">
                        {t.isDone ? <CheckCircle2 size={16} className="fill-current/20" /> : <Circle size={16} className="opacity-50" />}
                      </button>
                      <span className={`font-lexend text-sm font-semibold block leading-none mb-1 pr-10 pl-6 ${t.isDone ? 'line-through' : ''}`}>{t.title}</span>
                      <span className="text-xs text-on-surface-variant font-medium pl-6">{t.quadrant}</span>
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/timeline:opacity-100 transition-opacity z-10">
                        <button onClick={()=>onEdit(t)} className="p-1.5 hover:bg-white/50 rounded-md text-current"><Edit2 size={14}/></button>
                        <button onClick={()=>onDelete(t._id)} className="p-1.5 hover:bg-white/50 rounded-md text-error"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                  {time === '12:00' && (
                    <div className="flex items-center justify-center h-full">
                      <span className="font-lexend text-[10px] text-outline-variant tracking-wider font-bold">LUNCH BREAK</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FAB (Mobile Only) */}
      <button onClick={onAdd} className="md:hidden fixed bottom-28 right-6 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center active:scale-95 transition-transform z-50">
        <Plus size={32} />
      </button>
    </motion.div>
  );
};

// --- View: Planner ---
const PlannerView = ({ tasks, fetchTasks, onAdd, onEdit, onDelete, onToggleDone }: { tasks: any[], fetchTasks: () => void, onAdd: ()=>void, onEdit: (t:any)=>void, onDelete: (id:string)=>void, onToggleDone: (t:any)=>void }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([]);
  const [weekDates, setWeekDates] = useState<{date: string, label: string}[]>([]);

  useEffect(() => {
    const today = new Date();
    const day = today.getDay() || 7; 
    const monday = new Date(today);
    if (day !== 1) monday.setHours(-24 * (day - 1));
    const startOfWeek = monday.toISOString().split('T')[0];

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

    const loadWeekly = async () => {
      try {
        const res = await fetch(`${API_URL}/tasks/week?start=${startOfWeek}`);
        const data = await res.json();
        setWeeklyTasks(Array.isArray(data) ? data : []);
      } catch(e) { console.error(e); }
    };
    loadWeekly();
  }, [tasks]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/review/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt })
      });
      const generatedTasks = await res.json();
      
      const today = new Date().toISOString().split('T')[0];
      for (const t of generatedTasks) {
        await fetch(`${API_URL}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             title: t.title,
             quadrant: t.quadrant,
             startTime: t.suggestedTime || t.startTime,
             date: today 
          })
        });
      }
      
      setPrompt('');
      fetchTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFillTemplate = () => {
    setPrompt(`Tolong buatkan jadwal produktif untuk hari ini.

Prioritas Utama (Q1 - Do First):
- [Tugas penting 1]
- [Tugas penting 2]

Proyek Strategis (Q2 - Schedule):
- [Proyek atau belajar skill baru]

Tugas Delegasi / Rutin (Q3 - Delegate):
- [Tugas rutin atau email]

Catatan: Tolong atur jadwal block waktu dari jam 08:00 sampai 17:00, dengan istirahat makan siang jam 12:00.`);
  };

  const hours = Array.from({ length: 21 }, (_, i) => {
    const h = i + 4;
    return h === 24 ? '00:00' : `${h.toString().padStart(2, '0')}:00`;
  });

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
          <div className="relative">
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. I need to finish Q3 report by Wednesday, daily team standup at 9am, focus on learning React during the weekend..."
              className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-base focus:ring-2 focus:ring-primary h-48 resize-none shadow-inner placeholder:text-outline/40"
            />
            <div className="absolute bottom-4 right-4 flex gap-3">
              <button 
                onClick={handleFillTemplate}
                title="Gunakan Template Prompt"
                className="p-3 bg-surface-container-highest rounded-full text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
              >
                <Wand2 size={20} />
              </button>
              <button onClick={handleGenerate} disabled={isGenerating} className="bg-primary text-white pl-4 pr-6 py-2 rounded-full flex items-center gap-2 font-lexend text-sm font-semibold shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50">
                <Sparkles size={16} className="fill-white/20" />
                {isGenerating ? 'Generating...' : 'Generate Schedule'}
              </button>
            </div>
          </div>
        </section>

        {/* Focus Sidebar */}
        <div className="flex flex-col gap-6">

          {/* Card 1: Tugas Kuliah */}
          <div className="bg-amber-500/5 rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-400/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/10 rounded-lg">
                  <GraduationCap size={16} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-lexend text-sm font-bold text-on-surface">Tugas Kuliah</h3>
                  <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Q1 · Deadline Urgent</p>
                </div>
              </div>
              <button onClick={onAdd} className="p-1.5 hover:bg-amber-500/10 rounded-full text-amber-600 transition-colors">
                <Plus size={15}/>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {tasks.filter(t => t.quadrant === 'Q1').slice(0, 3).map((task) => (
                <div key={task._id} className="bg-surface-container-lowest rounded-xl p-3 border border-amber-500/10 flex justify-between items-center gap-3 shadow-sm hover:translate-x-1 transition-transform group/plan">
                  <button onClick={() => onToggleDone(task)} className="flex items-start gap-2.5 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                    {task.isDone
                      ? <CheckCircle2 size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
                      : <Circle size={16} className="text-amber-400/50 mt-0.5 flex-shrink-0" />}
                    <div className="overflow-hidden">
                      <p className={`text-xs font-bold text-on-surface truncate ${task.isDone ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                      <p className={`font-lexend text-[10px] font-bold text-amber-600 mt-0.5 uppercase tracking-widest ${task.isDone ? 'opacity-60' : ''}`}>{task.startTime}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/plan:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant"><Edit2 size={12}/></button>
                    <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-error/10 rounded text-error"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.quadrant === 'Q1').length === 0 && (
                <div className="flex flex-col items-center justify-center py-4 gap-1.5 opacity-60">
                  <GraduationCap size={20} className="text-amber-400" />
                  <p className="text-xs text-on-surface-variant italic text-center">Belum ada tugas kuliah.<br/>Tambahkan sebagai Q1.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Coding & Dev Skills */}
          <div className="bg-violet-500/5 rounded-2xl p-5 border border-violet-500/20 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-violet-400/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-500/10 rounded-lg">
                  <Code2 size={16} className="text-violet-600" />
                </div>
                <div>
                  <h3 className="font-lexend text-sm font-bold text-on-surface">Coding & Dev Skills</h3>
                  <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wider">Q2 · Skill Growth</p>
                </div>
              </div>
              <button onClick={onAdd} className="p-1.5 hover:bg-violet-500/10 rounded-full text-violet-600 transition-colors">
                <Plus size={15}/>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {tasks.filter(t => t.quadrant === 'Q2').slice(0, 3).map((task) => (
                <div key={task._id} className="bg-surface-container-lowest rounded-xl p-3 border border-violet-500/10 flex justify-between items-center gap-3 shadow-sm hover:translate-x-1 transition-transform group/plan">
                  <button onClick={() => onToggleDone(task)} className="flex items-start gap-2.5 overflow-hidden text-left hover:opacity-80 transition-opacity flex-grow">
                    {task.isDone
                      ? <CheckCircle2 size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
                      : <Circle size={16} className="text-violet-400/50 mt-0.5 flex-shrink-0" />}
                    <div className="overflow-hidden">
                      <p className={`text-xs font-bold text-on-surface truncate ${task.isDone ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                      <p className={`font-lexend text-[10px] font-bold text-violet-500 mt-0.5 uppercase tracking-widest ${task.isDone ? 'opacity-60' : ''}`}>{task.startTime}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/plan:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-surface-container-low rounded text-on-surface-variant"><Edit2 size={12}/></button>
                    <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-error/10 rounded text-error"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.quadrant === 'Q2').length === 0 && (
                <div className="flex flex-col items-center justify-center py-4 gap-1.5 opacity-60">
                  <Code2 size={20} className="text-violet-400" />
                  <p className="text-xs text-on-surface-variant italic text-center">Belum ada sesi coding.<br/>Tambahkan sebagai Q2.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Schedule Table */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="font-lexend text-xl font-bold text-on-surface">Time-Blocked Week</h2>
            <p className="text-xs text-on-surface-variant mt-1">Reviewing {weekDates[0]?.label} - {weekDates[weekDates.length-1]?.label}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20 font-lexend text-[11px] uppercase font-bold text-outline">
                <th className="p-4 w-20 text-right">Time</th>
                {weekDates.map(d => (
                  <th key={d.date} className="p-4 border-l border-outline-variant/20 text-center">{d.label.split(',')[0]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xs">
              {hours.map((time) => (
                <tr key={time} className="border-b border-outline-variant/10 h-14 last:border-0 grow">
                  <td className="p-2 text-right font-semibold text-outline">{time}</td>
                  {weekDates.map(d => (
                    <td key={d.date} className="p-1.5 border-l border-outline-variant/10 w-[14%] relative">
                      {weeklyTasks.filter(t => t.startTime === time && t.date && t.date.split('T')[0] === d.date).map(t => (
                        <div key={t._id} className={`bg-primary/10 border-l-4 border-primary rounded p-1.5 font-bold text-primary text-[9px] leading-tight overflow-hidden mb-1 ${t.isDone ? 'opacity-50 line-through grayscale' : ''}`}>
                          {t.title}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-outline-variant/10 h-10 bg-surface-container-low/30">
                <td className="p-2 text-right font-semibold text-outline">12:00</td>
                <td className="p-1.5 border-l border-outline-variant/10 text-center" colSpan={7}>
                  <span className="text-outline-variant font-bold text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest">
                    <UtensilsCrossed size={12} /> Mid-Day Reset
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
};

// --- View: Review ---
const ReviewView = ({ streak }: { streak: number }) => {
  const [reflectionNotes, setReflectionNotes] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [stats, setStats] = useState({ q1Total: 0, q1Completed: 0, totalTasks: 0, totalCompleted: 0 });
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    const today = new Date();
    const day = today.getDay() || 7; 
    if (day !== 1) today.setHours(-24 * (day - 1));
    const startOfWeek = today.toISOString().split('T')[0];

    const loadReviewData = async () => {
      try {
        const res = await fetch(`${API_URL}/tasks/week?start=${startOfWeek}`);
        const weeklyTasks = await res.json();
        const q1Tasks = weeklyTasks.filter((t:any) => t.quadrant === 'Q1');
        setStats({
          totalTasks: weeklyTasks.length,
          totalCompleted: weeklyTasks.filter((t:any) => t.isDone).length,
          q1Total: q1Tasks.length,
          q1Completed: q1Tasks.filter((t:any) => t.isDone).length,
        });

        const revRes = await fetch(`${API_URL}/review?week=${startOfWeek}`);
        const revData = await revRes.json();
        if (revData) {
          setReflectionNotes(revData.reflectionNotes || '');
          setAiSummary(revData.aiSummary || '');
        }
      } catch(e) { console.error(e); }
    };
    loadReviewData();
  }, []);

  const handleEvaluate = async () => {
    setIsEvaluating(true);
    const today = new Date();
    const day = today.getDay() || 7; 
    if (day !== 1) today.setHours(-24 * (day - 1));
    const startOfWeek = today.toISOString().split('T')[0];

    try {
      const res = await fetch(`${API_URL}/review`, {
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
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-[2.5rem] p-10 border border-outline-variant/30 shadow-2xl flex flex-col items-center justify-center gap-6 relative overflow-hidden">
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
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-md">
              <div className="flex items-center gap-2 text-on-surface-variant mb-3">
                <CheckCircle2 size={20} />
                <span className="font-lexend text-xs font-bold uppercase tracking-widest">Completed Workflow</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-lexend text-4xl font-bold text-on-surface font-black tracking-tighter">{stats.totalCompleted}/{stats.totalTasks}</span>
                <span className="text-sm text-on-surface-variant font-semibold">Targets</span>
              </div>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-md">
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

          <section className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/30 shadow-md flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="font-lexend text-lg font-bold text-on-surface italic">Weekly Reflection</h3>
              <Sparkles size={20} className="text-primary/40" />
            </div>
            <textarea 
              value={reflectionNotes}
              onChange={e => setReflectionNotes(e.target.value)}
              placeholder="What went well? What blocked you this week? What did you learn?"
              className="w-full flex-grow bg-surface-container-low border-none rounded-2xl p-5 text-sm focus:ring-2 focus:ring-primary min-h-[8rem] resize-none shadow-inner placeholder:text-outline/40"
            />
            <button 
              onClick={handleEvaluate} 
              disabled={isEvaluating || !reflectionNotes} 
              className="mt-4 w-full bg-primary text-white py-3 rounded-xl font-bold hover:-translate-y-0.5 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles size={18} className="fill-white/20" />
              {isEvaluating ? 'Evaluating...' : 'Get AI Feedback'}
            </button>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [tasks, setTasks] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tasksRes = await fetch(`${API_URL}/tasks?date=${today}`);
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      const streakRes = await fetch(`${API_URL}/streak/check`, { method: 'POST' });
      const streakData = await streakRes.json();
      setStreak(streakData.currentStreak || 0);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => { 
    setEditingTask(null); 
    setIsModalOpen(true); 
  };
  
  const handleOpenEdit = (task: any) => { 
    setEditingTask(task); 
    setIsModalOpen(true); 
  };
  
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
      fetchData();
    } catch(e) {
      console.error("Delete failed:", e);
    }
  };

  const handleToggleDone = async (task: any) => {
    try {
      await fetch(`${API_URL}/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !task.isDone })
      });
      fetchData();
    } catch(e) {
      console.error("Toggle done failed:", e);
    }
  };

  const handleModalSubmit = async (data: any) => {
    const today = new Date().toISOString().split('T')[0];
    const payload = { ...data, date: today };
    try {
      if (editingTask) {
        await fetch(`${API_URL}/tasks/${editingTask._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch(`${API_URL}/tasks`, {
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
              {activeTab === 'today' && <TodayView key="today" tasks={tasks} streak={streak} onAdd={handleOpenAdd} onEdit={handleOpenEdit} onDelete={handleDelete} onToggleDone={handleToggleDone} />}
              {activeTab === 'planner' && <PlannerView key="planner" tasks={tasks} fetchTasks={fetchData} onAdd={handleOpenAdd} onEdit={handleOpenEdit} onDelete={handleDelete} onToggleDone={handleToggleDone} />}
              {activeTab === 'review' && <ReviewView key="review" streak={streak} />}
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Nav */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      
      {/* Modal */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit} 
        initialData={editingTask} 
      />
    </div>
  );
}
