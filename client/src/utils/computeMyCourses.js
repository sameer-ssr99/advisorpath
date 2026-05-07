export const TERM_ORDER = { "Spring": 0, "Summer": 1, "Fall": 2 };

function parseSemName(name) {
  if (!name) return { term: "Fall", year: "2025" };
  const parts = name.trim().split(' ');
  return { term: parts[0] || "Fall", year: parts[1] || "2025" };
}

function isFuture(term, year, cTerm, cYear) {
  const y = parseInt(year, 10), cy = parseInt(cYear, 10);
  if (y > cy) return true;
  if (y === cy && (TERM_ORDER[term] ?? 99) > (TERM_ORDER[cTerm] ?? 99)) return true;
  return false;
}

function isPast(term, year, cTerm, cYear) {
  const y = parseInt(year, 10), cy = parseInt(cYear, 10);
  if (y < cy) return true;
  if (y === cy && (TERM_ORDER[term] ?? -1) < (TERM_ORDER[cTerm] ?? -1)) return true;
  return false;
}

export function determineCurrentSemester(marksData, plansData) {
  const marksSems = (marksData?.semesters || []).slice().sort((a, b) => {
    const p1 = parseSemName(a.label);
    const p2 = parseSemName(b.label);
    if (p1.year !== p2.year) return p1.year.localeCompare(p2.year);
    return (TERM_ORDER[p1.term] ?? 0) - (TERM_ORDER[p2.term] ?? 0);
  });

  let lastCompletedSemName = null;
  for (const sem of marksSems) {
    const isOngoing = sem.subjects.some(sub => 
      sub.components?.final?.scored === undefined || 
      sub.components?.final?.scored === null || 
      sub.components?.final?.scored === ''
    );
    if (isOngoing) {
      const { term, year } = parseSemName(sem.label);
      return { term, year, id: sem.label };
    }
    lastCompletedSemName = sem.label;
  }

  if (plansData && Array.isArray(plansData)) {
    const allPlanSems = [];
    plansData.forEach(p => {
      if ((p.status || '').toLowerCase() === 'approved') {
        (p.semesters || []).forEach(s => allPlanSems.push(s.name));
      }
    });

    const sortedPlanSems = [...new Set(allPlanSems)].sort((a, b) => {
      const p1 = parseSemName(a);
      const p2 = parseSemName(b);
      if (p1.year !== p2.year) return p1.year.localeCompare(p2.year);
      return (TERM_ORDER[p1.term] ?? 0) - (TERM_ORDER[p2.term] ?? 0);
    });

    if (lastCompletedSemName) {
      const idx = sortedPlanSems.indexOf(lastCompletedSemName);
      if (idx !== -1 && idx < sortedPlanSems.length - 1) {
        const nextSemName = sortedPlanSems[idx + 1];
        const { term, year } = parseSemName(nextSemName);
        return { term, year, id: nextSemName };
      }
    } else if (sortedPlanSems.length > 0) {
      const { term, year } = parseSemName(sortedPlanSems[0]);
      return { term, year, id: sortedPlanSems[0] };
    }
  }

  const month = new Date().getMonth();
  const year = new Date().getFullYear().toString();
  const term = month < 5 ? "Spring" : month < 8 ? "Summer" : "Fall";
  return { term, year, id: `${term} ${year}` };
}

export function computeProgressPercent(components) {
  if (!components) return 0;
  let scored = 0, max = 0;
  if (components.internal)   { scored += +components.internal.scored || 0;   max += +components.internal.outOf || 30; }
  if (components.midterm)    { scored += +components.midterm.scored || 0;    max += +components.midterm.outOf || 30; }
  if (components.assignment) { scored += +components.assignment.scored || 0; max += +components.assignment.outOf || 20; }
  return max === 0 ? 0 : Math.round((scored / max) * 100);
}

export function computeCompletedGrade(components) {
  let scored = 0, max = 0;
  if (components) {
    if (components.internal)   { scored += +components.internal.scored || 0;   max += +components.internal.outOf || 30; }
    if (components.midterm)    { scored += +components.midterm.scored || 0;    max += +components.midterm.outOf || 30; }
    if (components.assignment) { scored += +components.assignment.scored || 0; max += +components.assignment.outOf || 20; }
    if (components.final)      { scored += +components.final.scored || 0;      max += +components.final.outOf || 20; }
  }
  if (max === 0) return { percentage: 0, grade: "N/A" };
  const pct = Math.round((scored / max) * 100);
  const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "F";
  return { percentage: pct, grade };
}

export function computeMyCourses(studentPlansData, studentMarksData) {
  const cur = determineCurrentSemester(studentMarksData, studentPlansData);
  const cTerm = cur.term;
  const cYear = cur.year;

  const currentMap  = new Map();
  const upcomingMap = new Map();
  const completedMap = new Map();

  // 1. First, build a map of ALL semester statuses from marks
  const semesterStatus = new Map(); // label -> "Completed" | "Ongoing"
  if (studentMarksData && Array.isArray(studentMarksData.semesters)) {
    for (const sem of studentMarksData.semesters) {
      const isCompleted = sem.subjects?.length > 0 && sem.subjects.every(sub => 
        sub.components?.final?.scored !== undefined && 
        sub.components?.final?.scored !== null && 
        sub.components?.final?.scored !== ''
      );
      semesterStatus.set(sem.label, isCompleted ? "Completed" : "Ongoing");
    }
  }

  // 2. Process Plans Data (Base assignment)
  if (Array.isArray(studentPlansData)) {
    for (const plan of studentPlansData) {
      if ((plan.status || '').toLowerCase() !== 'approved') continue;
      for (const sem of (plan.semesters || [])) {
        const { term, year } = parseSemName(sem.name);
        
        // Use forced status from marks if it exists, otherwise use chronological logic
        let forcedStatus = semesterStatus.get(sem.name);
        
        for (const course of (sem.courses || [])) {
          const code = course.code || String(course._id);
          const base = { code, name: course.name || code, professor: course.professor || "TBD", credits: course.credits || 3, semLabel: sem.name };

          if (forcedStatus === "Completed") {
            completedMap.set(code, { ...base, status: "Completed", grade: "N/A", percentage: 0 });
          } else if (forcedStatus === "Ongoing" || (term === cTerm && year === cYear)) {
            currentMap.set(code, { ...base, status: "In Progress", progressPercent: 0 });
          } else if (isFuture(term, year, cTerm, cYear)) {
            upcomingMap.set(code, { ...base, status: "Upcoming" });
          } else {
            completedMap.set(code, { ...base, status: "Completed", grade: "N/A", percentage: 0 });
          }
        }
      }
    }
  }

  // 3. Enrich with Marks Data (Actual Scores)
  if (studentMarksData && Array.isArray(studentMarksData.semesters)) {
    for (const sem of studentMarksData.semesters) {
      for (const sub of (sem.subjects || [])) {
        const c = sub.components || {};
        const hasFinal = c.final?.scored !== undefined && c.final?.scored !== null && c.final?.scored !== '';
        
        const base = { code: sub.code, name: sub.name, professor: sub.professor || "TBD", credits: sub.credits || 3, semLabel: sem.label };

        if (hasFinal) {
          const { grade, percentage } = computeCompletedGrade(sub.components);
          completedMap.set(sub.code, { ...base, status: "Completed", grade, percentage });
          currentMap.delete(sub.code);
        } else {
          const progressPercent = computeProgressPercent(sub.components);
          currentMap.set(sub.code, { ...base, status: "In Progress", progressPercent });
          completedMap.delete(sub.code);
        }
      }
    }
  }

  return {
    current:   Array.from(currentMap.values()),
    upcoming:  Array.from(upcomingMap.values()),
    completed: Array.from(completedMap.values()),
  };
}
