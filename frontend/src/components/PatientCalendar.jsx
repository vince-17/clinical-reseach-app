import React, { useMemo, useState } from 'react';
import Modal from './Modal.jsx';

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function formatYMD(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const DEFAULT_COLORS = ['#2563eb','#059669','#ef4444','#a855f7','#d97706','#0ea5e9','#10b981','#f97316','#e11d48'];
function colorForVisitType(visitTypeId, visitTypes) {
  const idx = visitTypes.findIndex(v => v.id === visitTypeId);
  const vt = visitTypes[idx];
  if (vt && vt.color) return vt.color;
  return DEFAULT_COLORS[(idx >= 0 ? idx : (visitTypeId || 0)) % DEFAULT_COLORS.length];
}

export default function PatientCalendar({
  appointments = [],
  visitTypes = [],
  patients = [],
  resources = [],
  onCreate,
  onAppointmentClick,
  initialDate = new Date(),
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [form, setForm] = useState({ patientId: '', visitTypeId: '', title: '', time: '09:00', durationMinutes: 30, resourceId: '' });
  const [submitting, setSubmitting] = useState(false);

  const monthMatrix = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const days = [];
    let cursor = new Date(start);
    for (let i = 0; i < 42; i += 1) {
      days.push(new Date(cursor));
      cursor = addDays(cursor, 1);
    }
    return days;
  }, [currentMonth]);

  const apptsByDay = useMemo(() => {
    const map = {};
    for (const a of appointments) {
      const key = formatYMD(a.start_at);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    Object.values(map).forEach(list => list.sort((x, y) => new Date(x.start_at) - new Date(y.start_at)));
    return map;
  }, [appointments]);

  const monthLabel = useMemo(() => currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), [currentMonth]);

  function openCreate(date) {
    const d = new Date(date);
    setSelectedDate(d);
    setForm(f => ({ ...f, title: '', time: '09:00', durationMinutes: 30 }));
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!onCreate) { setCreateOpen(false); return; }
    try {
      setSubmitting(true);
      const [hh, mm] = (form.time || '09:00').split(':').map(Number);
      const startAt = new Date(selectedDate);
      startAt.setHours(hh || 9, mm || 0, 0, 0);
      const payload = {
        patientId: Number(form.patientId) || undefined,
        title: form.title || (visitTypes.find(v => v.id === Number(form.visitTypeId))?.name ?? 'Visit'),
        visitTypeId: form.visitTypeId ? Number(form.visitTypeId) : undefined,
        startAt: startAt.toISOString(),
        durationMinutes: Number(form.durationMinutes) || 30,
        resourceId: form.resourceId ? Number(form.resourceId) : undefined,
      };
      await onCreate(payload);
      setCreateOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const styles = {
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 8 },
    cell: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, minHeight: 110, display: 'flex', flexDirection: 'column' },
    dateNum: { fontSize: 12, color: 'var(--muted)', marginBottom: 6 },
    appt: { borderRadius: 8, padding: '6px 8px', color: 'white', fontSize: 12, marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 2 },
    legend: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  };

  return (
    <div className="card">
      <div style={styles.header}>
        <div className="row-between" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>&larr;</button>
            <strong>{monthLabel}</strong>
            <button className="btn" onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>&rarr;</button>
            <button className="btn" onClick={() => setCurrentMonth(startOfMonth(new Date()))} style={{ marginLeft: 8 }}>Today</button>
          </div>
          <div style={styles.legend}>
            {visitTypes.map(vt => (
              <span key={vt.id} className="badge" style={{ background: colorForVisitType(vt.id, visitTypes), color: 'white' }}>{vt.name}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ fontSize: 12, color: 'var(--muted)', padding:'0 6px' }}>{d}</div>
        ))}
      </div>

      <div style={{ ...styles.grid, marginTop: 6 }}>
        {monthMatrix.map((day, idx) => {
          const key = formatYMD(day);
          const dayAppts = apptsByDay[key] || [];
          const muted = !(day.getMonth() === currentMonth.getMonth() && day.getFullYear() === currentMonth.getFullYear());
          return (
            <div key={idx} style={{ ...styles.cell, opacity: muted ? 0.5 : 1, cursor: 'pointer' }} onClick={(e) => { if (e.target?.dataset?.role !== 'appt') openCreate(day); }}>
              <div style={styles.dateNum}>{day.getDate()}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {dayAppts.map(a => {
                  const color = colorForVisitType(a.visit_type_id, visitTypes);
                  const t = new Date(a.start_at);
                  const hh = String(t.getHours()).padStart(2, '0');
                  const mm = String(t.getMinutes()).padStart(2, '0');
                  const doc = a.doctor || a.resource;
                  const coord = a.coordinator;
                  return (
                    <div
                      key={a.id}
                      data-role="appt"
                      onClick={(e) => { e.stopPropagation(); onAppointmentClick && onAppointmentClick(a); }}
                      style={{ ...styles.appt, background: color }}
                      title={`${a.title} @ ${hh}:${mm}`}
                    >
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span>{hh}:{mm} • {a.duration_minutes}m</span>
                      </div>
                      {(doc || coord) && (
                        <div style={{ fontSize: 11, opacity: 0.95 }}>
                          {doc ? `Dr ${doc}` : ''}{doc && coord ? ' • ' : ''}{coord ? `Coord ${coord}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={createOpen}
        title={`Schedule on ${selectedDate.toLocaleDateString()}`}
        onClose={() => setCreateOpen(false)}
        footer={[
          <button key="cancel" className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>,
          <button key="save" className="btn btn-primary" onClick={handleCreate} disabled={submitting}>Schedule</button>,
        ]}
      >
        <div className="grid" style={{ gap: 12 }}>
          {!!patients.length && (
            <select value={form.patientId} onChange={(e)=>setForm(f=>({ ...f, patientId: e.target.value }))}>
              <option value="">Select patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          )}
          <select value={form.visitTypeId} onChange={(e)=>setForm(f=>({ ...f, visitTypeId: e.target.value, title: visitTypes.find(v=>String(v.id)===e.target.value)?.name || f.title }))}>
            <option value="">Visit type</option>
            {visitTypes.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input placeholder="Title" value={form.title} onChange={(e)=>setForm(f=>({ ...f, title: e.target.value }))} />
          <div style={{ display:'flex', gap: 8 }}>
            <input type="time" value={form.time} onChange={(e)=>setForm(f=>({ ...f, time: e.target.value }))} />
            <input type="number" min="5" step="5" value={form.durationMinutes} onChange={(e)=>setForm(f=>({ ...f, durationMinutes: e.target.value }))} style={{ width: 120 }} />
          </div>
          {!!resources.length && (
            <select value={form.resourceId} onChange={(e)=>setForm(f=>({ ...f, resourceId: e.target.value }))}>
              <option value="">Assign resource</option>
              {resources.map(r => <option key={r.id} value={r.id}>{r.name}{r.category ? ` (${r.category})` : ''}</option>)}
            </select>
          )}
        </div>
      </Modal>
    </div>
  );
}


