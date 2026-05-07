const { topologicalSort } = require('./dagValidator');

const normalizeId = (value) => String(value && value._id ? value._id : value);

const buildDependencyGraph = (courses) => {
  const graph = {};
  for (const course of courses) {
    graph[normalizeId(course._id)] = (course.prerequisites || []).map((p) => normalizeId(p));
  }
  return graph;
};

const recommendSemesterPlan = ({ courses, completedCourses = [], maxCredits = 15, semestersCount = 4, focus = '' }) => {
  const courseMap = new Map(courses.map((c) => [normalizeId(c._id), c]));
  const completedSet = new Set(completedCourses.map((id) => normalizeId(id)));
  const graph = buildDependencyGraph(courses);

  const { sorted } = topologicalSort(graph, Object.keys(graph));

  const preferred = sorted.filter((id) => {
    const c = courseMap.get(id);
    if (!c || completedSet.has(id)) return false;
    if (!focus.trim()) return true;
    const f = focus.toLowerCase();
    return (
      c.code.toLowerCase().includes(f) ||
      c.name.toLowerCase().includes(f) ||
      (c.description || '').toLowerCase().includes(f)
    );
  });

  const rest = sorted.filter((id) => {
    const c = courseMap.get(id);
    return c && !completedSet.has(id) && !preferred.includes(id);
  });

  const queue = [...preferred, ...rest];
  const suggested = [];
  const available = new Set(completedSet);

  for (let i = 0; i < semestersCount; i += 1) {
    let usedCredits = 0;
    const semesterCourses = [];

    for (const cid of queue) {
      if (semesterCourses.includes(cid) || suggested.flatMap((s) => s.courses).includes(cid)) continue;
      const course = courseMap.get(cid);
      if (!course) continue;

      const prereqs = (course.prerequisites || []).map((p) => normalizeId(p));
      const allMet = prereqs.every((p) => available.has(p));
      if (!allMet) continue;

      if (usedCredits + course.credits > maxCredits) continue;

      semesterCourses.push(cid);
      usedCredits += course.credits;
    }

    if (semesterCourses.length === 0) continue;

    suggested.push({
      name: `Semester ${suggested.length + 1}`,
      courses: semesterCourses,
      totalCredits: usedCredits,
    });

    for (const cid of semesterCourses) available.add(cid);
  }

  const courseDetails = suggested.map((sem) => ({
    ...sem,
    courses: sem.courses.map((cid) => {
      const c = courseMap.get(cid);
      return {
        _id: c._id,
        code: c.code,
        name: c.name,
        credits: c.credits,
      };
    }),
  }));

  return {
    suggestedSemesters: courseDetails,
    summary: {
      totalSuggestedCourses: courseDetails.reduce((sum, s) => sum + s.courses.length, 0),
      totalSuggestedCredits: courseDetails.reduce((sum, s) => sum + s.totalCredits, 0),
      maxCreditsPerSemester: maxCredits,
      focus: focus || 'general',
    },
  };
};

const draftAdvisorNote = ({ planTitle = '', studentName = '', validation }) => {
  if (!validation) {
    return `Plan \"${planTitle}\" for ${studentName} needs detailed review before approval.`;
  }

  if (validation.valid && (!validation.warnings || validation.warnings.length === 0)) {
    return `Plan \"${planTitle}\" for ${studentName} is academically valid. Prerequisites are satisfied and credit distribution is acceptable.`;
  }

  const lines = [];
  if (validation.errors?.length) {
    lines.push('Please resolve missing prerequisites:');
    for (const err of validation.errors.slice(0, 5)) {
      lines.push(`- ${err.courseCode}: missing ${err.missingPrereqs.join(', ')}`);
    }
  }

  if (validation.warnings?.length) {
    lines.push('Additional adjustments recommended:');
    for (const warn of validation.warnings.slice(0, 5)) {
      lines.push(`- ${warn.semester}: ${warn.message}`);
    }
  }

  return lines.join('\n');
};

const explainCanTakeCourse = ({ courseCode, courses, completedCourses = [], plannedCoursesBySemester = [] }) => {
  const code = (courseCode || '').toUpperCase().trim();
  const target = courses.find((c) => c.code === code);
  if (!target) {
    return { answer: `I could not find course ${code}.`, canTake: false };
  }

  const completed = new Set(completedCourses.map((id) => normalizeId(id)));
  const plannedPrior = new Set(plannedCoursesBySemester.flat().map((id) => normalizeId(id)));
  const have = new Set([...completed, ...plannedPrior]);

  const missing = (target.prerequisites || [])
    .map((p) => normalizeId(p))
    .filter((pid) => !have.has(pid))
    .map((pid) => {
      const c = courses.find((x) => normalizeId(x._id) === pid);
      return c ? c.code : pid;
    });

  if (missing.length === 0) {
    return {
      canTake: true,
      answer: `Yes, you can take ${target.code}. All prerequisites are satisfied based on completed/planned earlier courses.`,
    };
  }

  return {
    canTake: false,
    answer: `Not yet. ${target.code} still requires: ${missing.join(', ')}.`,
  };
};

module.exports = {
  recommendSemesterPlan,
  draftAdvisorNote,
  explainCanTakeCourse,
};
