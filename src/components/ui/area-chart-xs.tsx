import React, { useEffect, useState } from 'react';
import {
  AreaChart, AreaSeries, Area, LinearXAxis, LinearXAxisTickSeries,
  LinearXAxisTickLabel, LinearYAxis, LinearYAxisTickSeries, GridlineSeries,
  Gridline, Gradient, GradientStop,
} from 'reaviz';

export interface DataPoint {
  key: Date;
  data: number;
}

export interface AreaChartXSProps {
  id: string;
  data: DataPoint[];
  width?: number;
  height?: number;
  colorScheme?: string[];
  xAxisFormat?: (value: any) => string;
  showXAxisTicks?: boolean;
  showYAxisTicks?: boolean;
  isDarkMode?: boolean;
}

const defaultXAxisFormat = (v: any) => new Date(v).toLocaleDateString('pt-BR', {
  month: 'numeric', day: 'numeric'
});

const getCssVariable = (variableName: string, fallback: string = '#000000'): string => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
   if (value.includes(',')) return `rgb(${value})`;
  return value || fallback;
};

const getCssVariableWithOpacity = (variableName: string, opacity: number, fallback: string = 'rgba(0,0,0,0)'): string => {
   if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
   if (value.includes(',')) return `rgba(${value}, ${opacity})`;
  if (value.startsWith('#') && value.length === 7) {
    const r = parseInt(value.slice(1, 3), 16); const g = parseInt(value.slice(3, 5), 16); const b = parseInt(value.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return value || fallback;
}

export const AreaChartXS: React.FC<AreaChartXSProps> = ({
  id, data, width, height, colorScheme: propColorScheme,
  xAxisFormat = defaultXAxisFormat, showXAxisTicks = true, showYAxisTicks = false, isDarkMode
}) => {
  const [themeColors, setThemeColors] = useState({
    axisTickColor: '#71717a',
    gridlineColor: 'rgba(63, 63, 70, 0.47)',
    seriesColor: '#aaff00',
    gradientStop2Opacity: 0.4,
    noDataColor: '#fafafa'
  });

  useEffect(() => {
    setThemeColors({
      axisTickColor: getCssVariable('--zinc-500', '#71717a'),
      gridlineColor: getCssVariableWithOpacity('--zinc-700', 0.47, 'rgba(63, 63, 70, 0.47)'),
      seriesColor: getCssVariable('--primary', '#aaff00'),
      gradientStop2Opacity: 0.4,
      noDataColor: getCssVariable('--foreground', '#fafafa')
    });
  }, [isDarkMode]);

  if (!data || data.length === 0) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.noDataColor }}>Sem dados</div>;
  }

  const colorScheme = propColorScheme || [themeColors.seriesColor];

  return (
    <AreaChart 
      id={id} 
      data={data} 
      width={width} 
      height={height}
      series={
        <AreaSeries 
          colorScheme={colorScheme}
          area={
            <Area 
              gradient={
                <Gradient 
                  stops={[
                    <GradientStop key="0" stopOpacity={0} offset="0%"/>,
                    <GradientStop key="1" offset="100%" stopOpacity={themeColors.gradientStop2Opacity}/>
                  ]}
                />
              } 
            />
          }
        />
      }
      xAxis={
        <LinearXAxis 
          type="time" 
          tickSeries={showXAxisTicks ? <LinearXAxisTickSeries label={<LinearXAxisTickLabel format={xAxisFormat} fill={themeColors.axisTickColor} />} tickSize={10}/> : undefined} 
          axisLine={null}
        />
      }
      yAxis={
        <LinearYAxis 
          axisLine={null} 
          tickSeries={showYAxisTicks ? <LinearYAxisTickSeries tickSize={10} label={<LinearXAxisTickLabel fill={themeColors.axisTickColor} />} /> : <LinearYAxisTickSeries line={null} label={null} tickSize={0}/>}
        />
      }
      gridlines={<GridlineSeries line={<Gridline strokeColor={themeColors.gridlineColor}/>}/>}
    />
  );
};

export default AreaChartXS;
