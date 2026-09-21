import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';
import type { Exhibit } from '@solve/shared';

const SERIES_COLORS = ['#6ea8ff', '#3fc8d8', '#ff8a4c', '#6fd19a'];

const axisProps = {
  stroke: '#5f6b80',
  tick: { fill: '#8d98ad', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
  tickLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: '#151b28',
    border: '1px solid #33405a',
    borderRadius: 10,
    fontSize: 12,
    fontFamily: 'Inter, sans-serif',
  },
  labelStyle: { color: '#c3ccdb', fontWeight: 600 },
  itemStyle: { color: '#f2f5fa' },
};

/** Renders any exhibit kind. Used in the journal, analysis and case screens. */
export function ExhibitView({ exhibit, height = 210 }: { exhibit: Exhibit; height?: number }) {
  const e = exhibit;

  if (e.kind === 'note') {
    return (
      <div className="exhibit-body">
        <p className="exhibit-note">{e.body}</p>
      </div>
    );
  }

  if (e.kind === 'table') {
    return (
      <div className="exhibit-body">
        <div className="table-wrap" style={{ borderRadius: 10 }}>
          <table className="data">
            <thead>
              <tr>
                {e.columns?.map((c, i) => (
                  <th key={c} className={i === 0 ? undefined : 'num'}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {e.rows?.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={ci === 0 ? undefined : 'num'}>
                      {typeof cell === 'number' ? cell.toLocaleString() : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {e.caption && <div className="exhibit-caption">{e.caption}</div>}
      </div>
    );
  }

  // Recharts wants one row per x-value with a key per series.
  const labels = e.series?.[0]?.points.map((p) => p.label) ?? [];
  const data = labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    for (const s of e.series ?? []) row[s.name] = s.points[i]?.value ?? 0;
    return row;
  });
  const multi = (e.series?.length ?? 0) > 1;

  return (
    <div className="exhibit-body">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          {e.kind === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="#1a2130" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} width={52} />
              <Tooltip cursor={{ fill: 'rgba(110,168,255,0.07)' }} {...tooltipStyle} />
              {multi && <Legend wrapperStyle={{ fontSize: 11, color: '#8d98ad' }} />}
              {e.series?.map((s, i) => (
                <Bar key={s.name} dataKey={s.name} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: -8 }}>
              <CartesianGrid stroke="#1a2130" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} width={52} />
              <Tooltip {...tooltipStyle} />
              {multi && <Legend wrapperStyle={{ fontSize: 11, color: '#8d98ad' }} />}
              {e.series?.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2.2}
                  dot={{ r: 3, strokeWidth: 0, fill: SERIES_COLORS[i % SERIES_COLORS.length] }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      {e.caption && <div className="exhibit-caption">{e.caption}</div>}
    </div>
  );
}

/** Header strip shared by every exhibit presentation. */
export function ExhibitHeader({ exhibit }: { exhibit: Exhibit }) {
  return (
    <div className="exhibit-head">
      <div className="exhibit-title">{exhibit.title}</div>
      {exhibit.source && <span className="chip">{exhibit.source}</span>}
    </div>
  );
}
