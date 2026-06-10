"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Job } from "@/types";

const STATUS_DOT: Record<string, string> = {
  completed:   "bg-emerald-400",
  failed:      "bg-red-400",
  transcribing:"bg-amber-400",
  generating:  "bg-amber-400",
  pending:     "bg-amber-400",
  cancelled:   "bg-white/20",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const first    = new Date(year, month, 1);
  const last     = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const cells: (Date | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const now    = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [jobs, setJobs]   = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<string | null>(isoDate(now));

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const firstDay = new Date(year, month, 1).toISOString();
      const lastDay  = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const { data } = await supabase
        .from("jobs")
        .select("id, title, source_url, status, tone, language, created_at")
        .eq("user_id", user.id)
        .gte("created_at", firstDay)
        .lte("created_at", lastDay)
        .order("created_at", { ascending: false });
      setJobs((data as Job[]) ?? []);
      setLoading(false);
    }
    void load();
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelected(null);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelected(null);
  }

  const jobsByDate: Record<string, Job[]> = {};
  for (const job of jobs) {
    const key = job.created_at.slice(0, 10);
    if (!jobsByDate[key]) jobsByDate[key] = [];
    jobsByDate[key].push(job);
  }

  const cells       = buildCalendarGrid(year, month);
  const todayStr    = isoDate(now);
  const selectedJobs = selected ? (jobsByDate[selected] ?? []) : [];

  return (
    <div className="p-8 max-w-4xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Content Calendar</h1>
        <p className="text-white/40 mt-1">Browse your content history by date.</p>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-5 items-start">
        {/* Calendar grid */}
        <div className="glass rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <button type="button" onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-semibold text-white">
              {MONTHS[month]} {year}
            </h2>
            <button type="button" onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-white/40 hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 border-b border-white/5">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs text-white/25 font-medium py-2.5">{d}</div>
            ))}
          </div>

          {/* Days */}
          {loading ? (
            <div className="flex items-center justify-center h-56">
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="aspect-square border-b border-r border-white/[0.03]" />;

                const key      = isoDate(day);
                const dayJobs  = jobsByDate[key] ?? [];
                const isToday  = key === todayStr;
                const isSel    = key === selected;
                const hasFuture = day > now;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(isSel ? null : key)}
                    disabled={hasFuture}
                    className={`aspect-square border-b border-r border-white/[0.03] flex flex-col items-center justify-start pt-2 pb-1 px-1 transition-all relative group ${
                      isSel ? "bg-violet-600/15" : "hover:bg-white/3"
                    } ${hasFuture ? "cursor-default" : ""}`}
                  >
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                      isToday
                        ? "bg-violet-600 text-white"
                        : isSel
                        ? "text-violet-300"
                        : "text-white/50 group-hover:text-white/80"
                    }`}>
                      {day.getDate()}
                    </span>

                    {dayJobs.length > 0 && (
                      <div className="flex gap-0.5 flex-wrap justify-center mt-1 max-w-full px-0.5">
                        {dayJobs.slice(0, 3).map((j) => (
                          <div
                            key={j.id}
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[j.status] ?? "bg-white/20"}`}
                          />
                        ))}
                        {dayJobs.length > 3 && (
                          <span className="text-[9px] text-white/25 leading-tight">+{dayJobs.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="glass rounded-2xl overflow-hidden sticky top-8">
          {selected ? (
            <>
              <div className="px-4 py-3.5 border-b border-white/5">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  {new Date(selected + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
                <p className="text-sm text-white/40 mt-0.5">
                  {selectedJobs.length} job{selectedJobs.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-white/[0.04] max-h-[520px] overflow-y-auto">
                {selectedJobs.length === 0 ? (
                  <p className="text-xs text-white/25 text-center py-8">No jobs on this day</p>
                ) : (
                  selectedJobs.map((job) => (
                    <div key={job.id} className="px-4 py-3 hover:bg-white/3 transition-colors group">
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[job.status] ?? "bg-white/20"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/70 truncate leading-snug">
                            {job.title ?? job.source_url ?? "Untitled"}
                          </p>
                          <p className="text-xs text-white/25 mt-0.5 capitalize">{job.status}</p>
                        </div>
                        {job.status === "completed" && (
                          <Link
                            href={`/jobs/${job.id}`}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <p className="text-sm text-white/25">Click a day to see its jobs</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4">
        {[
          { color: "bg-emerald-400", label: "Completed" },
          { color: "bg-amber-400",   label: "Processing" },
          { color: "bg-red-400",     label: "Failed" },
          { color: "bg-white/20",    label: "Cancelled" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-white/25">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
