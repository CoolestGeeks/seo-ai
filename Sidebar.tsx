
import React from 'react';
import { Tool } from '../types';
import { SearchCheck, KeyRound, FileText, TrendingUp, BotMessageSquare } from 'lucide-react';

interface SidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const toolConfig = [
  { id: Tool.OnPageSEO, icon: SearchCheck, label: 'On-Page SEO' },
  { id: Tool.KeywordGenerator, icon: KeyRound, label: 'Keyword Generator' },
  { id: Tool.BlogPostWriter, icon: FileText, label: 'Blog Post Writer' },
  { id: Tool.RankTracker, icon: TrendingUp, label: 'Rank Tracker' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTool, setActiveTool }) => {
  return (
    <aside className="bg-base-200 text-base-content w-full md:w-64 p-4 md:p-6 flex-shrink-0">
      <div className="flex items-center gap-3 mb-8">
         <BotMessageSquare className="w-10 h-10 text-brand-secondary" />
        <h1 className="text-xl font-bold text-white">AI SEO Tools</h1>
      </div>
      <nav className="flex flex-row md:flex-col gap-2">
        {toolConfig.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            className={`flex items-center w-full gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
              activeTool === id
                ? 'bg-brand-secondary text-white shadow-md'
                : 'hover:bg-base-300'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
