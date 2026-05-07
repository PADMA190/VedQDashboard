import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/common';
import styles from './TrendChart.module.scss';

export function TrendChart({ data = [], height = 240, title = 'Accuracy trend', metric = 'accuracy' }) {
  const series = data.map((d) => ({
    date: d.date,
    accuracy: Math.round((d.accuracy || 0) * 100),
    score: Math.round(d.score || 0),
  }));

  if (series.length === 0) {
    return (
      <Card className={styles.empty}>
        <h3>{title}</h3>
        <p>Take a few attempts and your trend will appear here.</p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <span className={styles.unit}>{metric === 'accuracy' ? '% correct' : 'score'}</span>
      </header>
      <div className={styles.chart} style={{ height }}>
        <ResponsiveContainer>
          <LineChart data={series} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickMargin={8} />
            <YAxis stroke="#71717a" fontSize={11} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e4e4e7', fontSize: 12 }}
              formatter={(v, name) => [v + (name === 'accuracy' ? '%' : ''), name]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke="#ff693d"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#ff693d' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default TrendChart;
