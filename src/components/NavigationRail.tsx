import React from 'react';
import {
  Shield,
  Waves,
  GitBranch,
  Truck,
  History,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { IncidentChapter } from './CommandPanel';

interface NavigationRailProps {
  activeChapter: IncidentChapter;
  onSelectChapter: (chapter: IncidentChapter) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeChapter,
  onSelectChapter,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const items: Array<{
    id: IncidentChapter;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tooltip: string;
  }> = [
    {
      id: 'prevent',
      label: 'Prevent',
      icon: Shield,
      tooltip: 'Chapter 1: Prevent — Baseline vulnerabilities & single points of failure',
    },
    {
      id: 'predict',
      label: 'Predict',
      icon: Waves,
      tooltip: 'Chapter 2: Predict — Breach dynamics & flood hazard modeling',
    },
    {
      id: 'protect',
      label: 'Protect',
      icon: GitBranch,
      tooltip: 'Chapter 3: Protect — Critical hospital access & population at risk',
    },
    {
      id: 'respond',
      label: 'Respond',
      icon: Truck,
      tooltip: 'Chapter 4: Respond — Tactical mitigation tools & official dispatch',
    },
    {
      id: 'learn',
      label: 'Learn',
      icon: History,
      tooltip: 'Chapter 5: Learn — Immutable audit trail & incident evaluation',
    },
  ];

  return (
    <nav
      aria-label="Workflow Navigation"
      className="w-[60px] h-full bg-[#0E1625] border-r border-[#26364B] flex flex-col items-center justify-between py-3 shrink-0 select-none z-20"
    >
      {/* Top 5 Workflow Destinations */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        {items.map((item) => {
          const isActive = activeChapter === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectChapter(item.id)}
              title={item.tooltip}
              className={`relative w-full py-2.5 px-1 rounded-lg flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group ${
                isActive
                  ? 'bg-[#182437] text-[#E8EEF7]'
                  : 'text-[#9AAAC0] hover:text-[#E8EEF7] hover:bg-[#121D2D]'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#13B8D5] rounded-r" />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-[#13B8D5]' : 'group-hover:scale-105'}`} />
              <span className="text-[10px] font-medium tracking-tight leading-none">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Sidebar Collapse/Expand Toggle */}
      <div className="w-full px-1 pt-2 border-t border-[#1E2B3D] flex flex-col items-center">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Collapse Left Sidebar' : 'Expand Left Sidebar'}
          className="w-full py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 text-[#74859D] hover:text-[#E8EEF7] hover:bg-[#121D2D] transition-colors cursor-pointer"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-[#13B8D5]" />
          )}
          <span className="text-[9px] font-mono leading-none mt-0.5">
            {isSidebarOpen ? 'Sidebar' : 'Open'}
          </span>
        </button>
      </div>
    </nav>
  );
};
