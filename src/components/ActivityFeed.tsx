"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, RefreshCw, GitCommit, BookOpen, Target, Settings, Zap, ChevronDown } from "lucide-react";
import TimeAgo from "./TimeAgo";
import { Icon } from "./Icon";

type ActivityItem = {
  id: string;
  type: "commit" | "journal" | "milestone" | "status_change" | "io_update";
  projectName: string;
  projectId: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

type Props = {
  activities: ActivityItem[];
};

type ActivityConfig = {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  label: string;
};

const activityConfig: Record<string, ActivityConfig> = {
  commit: {
    icon: GitCommit,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    label: "Code"
  },
  journal: {
    icon: BookOpen,
    color: "text-blue-400", 
    bgColor: "bg-blue-400/10",
    label: "Journal"
  },
  milestone: {
    icon: Target,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10", 
    label: "Milestone"
  },
  status_change: {
    icon: Settings,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    label: "Status"
  },
  io_update: {
    icon: Zap,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    label: "Update"
  },
};

// Time period grouping
const getTimePeriod = (timestamp: string) => {
  const now = new Date();
  const date = new Date(timestamp);
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffHours < 24) return "Today";
  if (diffHours < 48) return "Yesterday"; 
  if (diffHours < 168) return "This Week";
  return "Earlier";
};

export default function ActivityFeed({ activities }: Props) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const activityTypes = Object.keys(activityConfig);
  
  // Filter activities
  const filteredActivities = useMemo(() => {
    if (selectedFilter === "all") return activities;
    return activities.filter(activity => activity.type === selectedFilter);
  }, [activities, selectedFilter]);
  
  // Group activities by time period
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    
    filteredActivities.forEach(activity => {
      const period = getTimePeriod(activity.timestamp);
      if (!groups[period]) groups[period] = [];
      groups[period].push(activity);
    });
    
    // Sort groups by recency
    const sortedGroups: Record<string, ActivityItem[]> = {};
    const order = ["Today", "Yesterday", "This Week", "Earlier"];
    
    order.forEach(period => {
      if (groups[period]) {
        sortedGroups[period] = groups[period];
      }
    });
    
    return sortedGroups;
  }, [filteredActivities]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };
  
  if (activities.length === 0) {
    return (
      <motion.div 
        className="glass-strong rounded-3xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw size={18} className="text-[#7bdcff]" />
          </motion.div>
          Activity Feed
        </h3>
        <motion.p 
          className="mt-4 text-sm text-[#8b8b8b]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          No recent activity. Start working on a project!
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="glass-strong rounded-3xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* Enhanced header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <motion.div
            animate={isRefreshing ? { rotate: 360 } : {}}
            transition={{ duration: 1, ease: "linear" }}
          >
            <RefreshCw size={18} className="text-[#7bdcff]" />
          </motion.div>
          Activity Feed
          <span className="px-2 py-0.5 text-xs rounded-full bg-[#7bdcff]/20 text-[#7bdcff]">
            {filteredActivities.length}
          </span>
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="appearance-none bg-[#1c1c1c] border border-[#333] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-[#7bdcff] transition-colors"
            >
              <option value="all">All Types</option>
              {activityTypes.map(type => (
                <option key={type} value={type}>
                  {activityConfig[type].label}
                </option>
              ))}
            </select>
            <Filter size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#666] pointer-events-none" />
          </div>
          
          {/* Refresh button */}
          <motion.button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-[#1c1c1c] transition-colors disabled:opacity-50"
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </motion.button>
        </div>
      </div>

      {/* Activity list */}
      <div className={`space-y-4 overflow-y-auto pr-2 ${isExpanded ? "max-h-none" : "max-h-[500px]"}`}>
        <AnimatePresence mode="popLayout">
          {Object.entries(groupedActivities).map(([period, periodActivities]) => (
            <motion.div
              key={period}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              {/* Time period header */}
              <motion.div 
                className="flex items-center gap-2 text-xs font-medium text-[#7bdcff] uppercase tracking-wider py-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="w-2 h-2 rounded-full bg-[#7bdcff]" />
                {period}
                <span className="ml-auto text-[#666]">{periodActivities.length}</span>
              </motion.div>
              
              {/* Activities */}
              <div className="space-y-2">
                {periodActivities.map((activity, index) => {
                  const config = activityConfig[activity.type];
                  const ActivityIcon = config?.icon || Zap;
                  
                  return (
                    <motion.a
                      key={activity.id}
                      href={`/project/${activity.projectId}`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#1c1c1c]/50 transition-all group cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                    >
                      {/* Enhanced activity icon */}
                      <motion.div 
                        className={`w-8 h-8 rounded-lg ${config?.bgColor || "bg-gray-400/10"} flex items-center justify-center`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <ActivityIcon size={16} className={config?.color || "text-white"} />
                      </motion.div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm flex items-center gap-2">
                          <span className={`font-medium ${config?.color || "text-white"}`}>
                            {activity.projectName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1c1c1c] text-[#666]">
                            {config?.label || activity.type}
                          </span>
                        </p>
                        
                        <p className="text-sm text-[#8b8b8b] group-hover:text-white transition-colors">
                          {activity.message}
                        </p>
                        
                        <p className="text-xs text-[#666] mt-1 flex items-center gap-1">
                          <TimeAgo date={activity.timestamp} />
                          <span className="w-1 h-1 rounded-full bg-[#333]" />
                          <span>{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                      </div>
                      
                      {/* Hover indicator */}
                      <motion.div
                        className="w-2 h-2 rounded-full bg-[#7bdcff] opacity-0 group-hover:opacity-100"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                      />
                    </motion.a>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Expand/Collapse toggle */}
        {Object.values(groupedActivities).flat().length > 10 && (
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-3 text-sm text-[#7bdcff] hover:text-white transition-colors flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <ChevronDown 
              size={16} 
              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} 
            />
            {isExpanded ? "Show Less" : `Show All (${Object.values(groupedActivities).flat().length} total)`}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
