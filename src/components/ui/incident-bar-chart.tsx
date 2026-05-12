import React from 'react';
import {
  BarChart,
  BarSeries,
  Bar,
  LinearYAxis,
  LinearYAxisTickSeries,
  LinearXAxis,
  LinearXAxisTickSeries,
  LinearXAxisTickLabel,
  GridlineSeries,
  Gridline
} from 'reaviz';
import { motion } from 'framer-motion';

interface IncidentReportCardProps {
  data?: { key: string, data: number }[];
  title?: string;
  metrics?: {
    label: string;
    value: string;
    trend: 'up' | 'down';
    iconColor: string;
  }[];
}

const IncidentReportCard = ({ 
  data, 
  title = "Incident Report",
  metrics = [
    { label: "Mean Time to Respond", value: "6 Hours", trend: "up", iconColor: "#E84045" },
    { label: "Incident Response Time", value: "4 Hours", trend: "up", iconColor: "#E84045" },
    { label: "Incident Escalation Rate", value: "10%", trend: "down", iconColor: "#40E5D1" }
  ]
}: IncidentReportCardProps) => {
  const chartAvailableWidth = 320;
  const chartAvailableHeight = 150;

  return (
    <div className="flex flex-col pt-4 pb-4 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full h-full overflow-hidden">
      <h3 className="text-xl text-left px-6 pt-2 pb-4 font-bold text-white">
        {title}
      </h3>
      <div className="flex-grow flex items-center justify-center overflow-hidden">
        <BarChart
          id="simple"
          width={chartAvailableWidth}
          height={chartAvailableHeight}
          data={data}
          yAxis={<LinearYAxis axisLine={null} tickSeries={<LinearYAxisTickSeries line={null} label={null} />} />}
          xAxis={<LinearXAxis type="category" tickSeries={<LinearXAxisTickSeries label={<LinearXAxisTickLabel padding={5} rotation={-45} fill="#71717a" fontSize={10} format={text => text.length > 8 ? `${text.slice(0, 8)}...` : text} />} tickSize={20} />} />}
          series={<BarSeries bar={<Bar glow={{ blur: 10, opacity: 0.3 }} gradient={null} />} colorScheme={['#aaff00', '#9152EE', '#40E5D1', '#A840E8', '#4C86FF', '#0D4ED2', '#40D3F4']} padding={0.2} />}
          gridlines={<GridlineSeries line={<Gridline strokeColor="#3f3f46" />} />}
        />
      </div>

      <div className="flex flex-col px-6 pt-4 font-mono divide-y divide-zinc-800">
        {metrics.map((metric, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: idx * 0.05 }}
            className="flex w-full py-3 items-center gap-2"
          >
            <div className="flex flex-row gap-2 items-center text-[10px] w-1/2 text-zinc-400">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: metric.iconColor }} />
              <span className="truncate" title={metric.label}>
                {metric.label}
              </span>
            </div>
            <div className="flex gap-2 w-1/2 justify-end items-center">
              <span className="font-bold text-sm text-white">{metric.value}</span>
              {metric.trend === 'up' ? (
                <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="14" fill={metric.iconColor} fillOpacity="0.2" />
                  <path d="M9.50134 12.6111L14.0013 8.16663M14.0013 8.16663L18.5013 12.6111M14.0013 8.16663L14.0013 19.8333" stroke={metric.iconColor} strokeWidth="2" strokeLinecap="square" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="14" fill={metric.iconColor} fillOpacity="0.2" />
                  <path d="M18.4987 15.3889L13.9987 19.8334M13.9987 19.8334L9.49866 15.3889M13.9987 19.8334V8.16671" stroke={metric.iconColor} strokeWidth="2" strokeLinecap="square" />
                </svg>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IncidentReportCard;
