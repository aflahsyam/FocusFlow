const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. imports
content = content.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';"
);

// 2. Mock Data -> API
content = content.replace(
  "// --- Mock Data ---\nconst STREAK = 7;\nconst FOCUS_SCORE = 92;",
  "const API_URL = 'http://localhost:5001/api';\nconst FOCUS_SCORE = 92;"
);

// 3. TodayView props
content = content.replace(
  "const TodayView = () => {",
  `const TodayView = ({ tasks, streak }: { tasks: any[], streak: number }) => {
  const q1Tasks = tasks.filter(t => t.quadrant === 'Q1');
  const q2Tasks = tasks.filter(t => t.quadrant === 'Q2');
  const q3Tasks = tasks.filter(t => t.quadrant === 'Q3');
  const q4Tasks = tasks.filter(t => t.quadrant === 'Q4');`
);

// 4. STREAK variable usage
content = content.replace(
  "{STREAK} Day Streak",
  "{streak} Day Streak"
);

// 5. Priority Matrix contents
content = content.replace(
  `<div className="flex items-start gap-2">
                <Circle size={16} className="text-primary/40 mt-0.5" />
                <span className="text-xs font-medium text-on-surface-variant">Draft Q3 Report</span>
              </div>`,
  `{q1Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q1Tasks.map(t => (
                  <div key={t._id} className="flex items-start gap-2 mb-1">
                    <Circle size={16} className="text-primary/40 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-on-surface-variant line-clamp-2">{t.title}</span>
                  </div>
                ))}`
);

content = content.replace(
  `<div className="flex items-start gap-2">
                <Circle size={16} className="text-secondary/40 mt-0.5" />
                <span className="text-xs font-medium text-on-surface-variant">Team Sync Prep</span>
              </div>`,
  `{q2Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q2Tasks.map(t => (
                  <div key={t._id} className="flex items-start gap-2 mb-1">
                    <Circle size={16} className="text-secondary/40 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-on-surface-variant line-clamp-2">{t.title}</span>
                  </div>
                ))}`
);

content = content.replace(
  `<div className="flex items-start gap-2">
                <Circle size={16} className="text-tertiary/40 mt-0.5" />
                <span className="text-xs font-medium text-on-surface-variant">Review Invoice</span>
              </div>`,
  `{q3Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q3Tasks.map(t => (
                  <div key={t._id} className="flex items-start gap-2 mb-1">
                    <Circle size={16} className="text-tertiary/40 mt-0.5 flex-shrink-0" />
                    <span className="text-xs font-medium text-on-surface-variant line-clamp-2">{t.title}</span>
                  </div>
                ))}`
);

content = content.replace(
  `<div className="flex items-start gap-2 line-through">
                <CheckCircle2 size={16} className="text-outline/40 mt-0.5 fill-outline/10" />
                <span className="text-xs font-medium text-on-surface-variant">Check Socials</span>
              </div>`,
  `{q4Tasks.length === 0 ? <span className="text-xs text-on-surface-variant">No tasks</span> : q4Tasks.map(t => (
                  <div key={t._id} className="flex items-start gap-2 line-through opacity-60 mb-1">
                    <CheckCircle2 size={16} className="text-outline/40 mt-0.5 fill-outline/10 flex-shrink-0" />
                    <span className="text-xs font-medium text-on-surface-variant line-clamp-2">{t.title}</span>
                  </div>
                ))}`
);

// 6. Timeline tasks
content = content.replace(
  `{time === '09:00' && (
                    <div className="bg-primary/10 border-l-4 border-primary rounded-r-lg p-3 shadow-sm h-full">
                      <span className="font-lexend text-sm text-primary font-semibold block leading-none mb-1">Deep Work</span>
                      <span className="text-xs text-on-surface-variant font-medium">Drafting Q3 Report</span>
                    </div>
                  )}
                  {time === '11:00' && (
                    <div className="bg-secondary/10 border-l-4 border-secondary rounded-r-lg p-3 h-full">
                      <span className="font-lexend text-sm text-secondary font-semibold block leading-none">Team Sync</span>
                    </div>
                  )}`,
  `{tasks.filter(t => t.startTime === time).map(t => (
                    <div key={t._id} className={\`\${t.quadrant === 'Q1' ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/10 border-secondary text-secondary'} border-l-4 rounded-r-lg p-3 shadow-sm h-full mb-1\`}>
                      <span className="font-lexend text-sm font-semibold block leading-none mb-1">{t.title}</span>
                      <span className="text-xs text-on-surface-variant font-medium">{t.quadrant}</span>
                    </div>
                  ))}`
);

// 7. PlannerView props & interaction
content = content.replace(
  "const PlannerView = () => {",
  `const PlannerView = ({ fetchTasks }: { fetchTasks: () => void }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch(\`\${API_URL}/review/parse\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: prompt })
      });
      const generatedTasks = await res.json();
      
      const today = new Date().toISOString().split('T')[0];
      for (const t of generatedTasks) {
        await fetch(\`\${API_URL}/tasks\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...t, date: today })
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
`
);

content = content.replace(
  `<textarea 
              placeholder="e.g. I need to finish Q3 report by Wednesday, daily team standup at 9am, focus on learning React during the weekend..."
              className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-base focus:ring-2 focus:ring-primary h-48 resize-none shadow-inner placeholder:text-outline/40"
            />`,
  `<textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. I need to finish Q3 report by Wednesday, daily team standup at 9am, focus on learning React during the weekend..."
              className="w-full bg-surface-container-low border-none rounded-2xl p-5 text-base focus:ring-2 focus:ring-primary h-48 resize-none shadow-inner placeholder:text-outline/40"
            />`
);

content = content.replace(
  `<button className="bg-primary text-white pl-4 pr-6 py-2 rounded-full flex items-center gap-2 font-lexend text-sm font-semibold shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all active:scale-95">
                <Sparkles size={16} className="fill-white/20" />
                Generate Schedule
              </button>`,
  `<button onClick={handleGenerate} disabled={isGenerating} className="bg-primary text-white pl-4 pr-6 py-2 rounded-full flex items-center gap-2 font-lexend text-sm font-semibold shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50">
                <Sparkles size={16} className="fill-white/20" />
                {isGenerating ? 'Generating...' : 'Generate Schedule'}
              </button>`
);

// 8. Main App State
content = content.replace(
  `export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('today');`,
  `export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [tasks, setTasks] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tasksRes = await fetch(\`\${API_URL}/tasks?date=\${today}\`);
      const tasksData = await tasksRes.json();
      setTasks(Array.isArray(tasksData) ? tasksData : []);

      const streakRes = await fetch(\`\${API_URL}/streak\`);
      const streakData = await streakRes.json();
      setStreak(streakData.currentStreak || 0);
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);`
);

content = content.replace(
  `{activeTab === 'today' && <TodayView key="today" />}
              {activeTab === 'planner' && <PlannerView key="planner" />}`,
  `{activeTab === 'today' && <TodayView key="today" tasks={tasks} streak={streak} />}
              {activeTab === 'planner' && <PlannerView key="planner" fetchTasks={fetchData} />}`
);

fs.writeFileSync('src/App.tsx', content, 'utf8');
console.log('App.tsx updated');
