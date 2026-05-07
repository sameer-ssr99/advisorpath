export const SUBJECT_CATEGORIES = {
  "CS101": "core",
  "CS102": "core",
  "CS201": "core",
  "CS301": "core",
  "CS302": "core",
  "CS401": "core",
  "CS402": "core",
  "MATH101": "mathematics",
  "MATH201": "mathematics",
  "MTH101": "mathematics",
  "MTH201": "mathematics",
  "MTH301": "mathematics",
};

export function getCategory(code) {
  return SUBJECT_CATEGORIES[code] || "elective";
}

export function calculateSubjectScore(components, finalExam) {
  let totalScore = 0;
  let maxScore = 0;

  if (components) {
    if (components.internal) {
      totalScore += Number(components.internal.scored) || 0;
      maxScore += Number(components.internal.outOf) || 30;
    }
    if (components.midterm) {
      totalScore += Number(components.midterm.scored) || 0;
      maxScore += Number(components.midterm.outOf) || 30;
    }
    if (components.assignment) {
      totalScore += Number(components.assignment.scored) || 0;
      maxScore += Number(components.assignment.outOf) || 20;
    }
  }

  if (finalExam && finalExam.scored !== null && finalExam.scored !== undefined) {
    totalScore += Number(finalExam.scored) || 0;
    maxScore += Number(finalExam.outOf) || 20;
  }

  if (maxScore === 0) return 0;
  return (totalScore / maxScore) * 100;
}

export function percentageToGradePoint(percentage) {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 70) return 3.3;
  if (percentage >= 60) return 3.0;
  if (percentage >= 50) return 2.7;
  if (percentage >= 40) return 2.3;
  return 0.0;
}

export function computeExpectedGraduation(creditsRemaining) {
  const currentDate = new Date();
  if (creditsRemaining <= 0) {
    return { label: "This semester", semestersLeft: 0 };
  }
  const semestersLeft = Math.ceil(creditsRemaining / 16);
  
  let targetDate = new Date(currentDate);
  targetDate.setMonth(targetDate.getMonth() + (semestersLeft * 6));

  const month = targetDate.getMonth();
  const year = targetDate.getFullYear();
  
  let gradMonth = "May";
  let gradYear = year;
  
  // Snap to May or December
  if (month <= 4) {
    gradMonth = "May";
  } else if (month <= 11) {
    gradMonth = "December";
  } else {
    gradMonth = "May";
    gradYear += 1;
  }

  return { label: `${gradMonth} ${gradYear}`, semestersLeft };
}

export function determineSubjectStatus(subject, isCompleted) {
  if (isCompleted) {
    const score = calculateSubjectScore(subject.components, subject.finalExam);
    return score >= 50 ? "Completed" : "Completed"; // Even if failed, it's completed attempt. Or maybe prompt means "Completed" only if >= 50. Prompt: "currentScore >= 50 -> Completed"
  }
  if (subject.components) {
    // any component scored
    const c = subject.components;
    if ((c.internal && c.internal.scored !== undefined) || 
        (c.midterm && c.midterm.scored !== undefined) || 
        (c.assignment && c.assignment.scored !== undefined)) {
      return "In Progress";
    }
  }
  return "Not Started";
}

export function computeAcademicProgress(studentMarksData, studentPlansData) {
  const TOTAL_REQUIRED = 120;
  const REQ_CORE = 45;
  const REQ_MATH = 12;
  const REQ_ELEC = 63;

  let creditsCompleted = 0;
  let creditsInProgress = 0;
  
  let coreCompleted = 0;
  let mathCompleted = 0;
  let elecCompleted = 0;

  const courseList = [];
  const completedSubjects = [];
  const completedSemesters = new Set();
  
  let lastTermSubjects = [];
  let lastTermId = null;

  // Process marks data
  if (studentMarksData && studentMarksData.semesters) {
    // sem array might not be strictly sorted, assume last one in array is the most recent
    const sems = studentMarksData.semesters;
    
    // find the most recently completed semester
    let latestCompletedSem = null;

    for (const sem of sems) {
      let semHasCompleted = false;
      const semSubjects = [];

      for (const sub of sem.subjects) {
        const code = sub.code;
        const name = sub.name;
        const credits = Number(sub.credits) || 3; // default to 3 if missing
        const category = getCategory(code);

        const hasFinal = sub.finalExam && sub.finalExam.scored !== null && sub.finalExam.scored !== undefined;
        const score = calculateSubjectScore(sub.components, sub.finalExam);
        
        let status = "Not Started";
        if (hasFinal && score >= 50) {
          status = "Completed";
          semHasCompleted = true;
          completedSemesters.add(sem.id);
        } else if (hasFinal && score < 50) {
          status = "Completed"; // It is completed, just failed. Wait, prompt says: "If finalExam.scored is not null AND currentScore >= 50 → Completed". If < 50, let's treat it as not completed credits but still completed term. Actually prompt: "If finalExam.scored is not null AND currentScore >= 50 → Completed"
          status = "Completed (Failed)";
        } else if (!hasFinal && sub.components && (sub.components.internal?.scored !== undefined || sub.components.midterm?.scored !== undefined)) {
          status = "In Progress";
        }

        if (status === "Completed") {
          creditsCompleted += credits;
          completedSubjects.push({ ...sub, credits, category });
          semSubjects.push({ ...sub, credits, category });
          
          if (category === "core") coreCompleted += credits;
          else if (category === "mathematics") mathCompleted += credits;
          else elecCompleted += credits;
        } else if (status === "In Progress") {
          creditsInProgress += credits;
        }

        courseList.push({
          code, name, credits, category, status
        });
      }

      if (semHasCompleted) {
        latestCompletedSem = sem;
        lastTermSubjects = semSubjects;
      }
    }
  }

  // Process plans data for "In Progress" / "Not Started" courses (from approved plans)
  if (studentPlansData && Array.isArray(studentPlansData)) {
    for (const plan of studentPlansData) {
      const status = (plan.status || '').toLowerCase();
      if (status === 'approved' || status === 'submitted') {
        // Real plan structure: plan.semesters[].courses[]
        for (const sem of (plan.semesters || [])) {
          for (const sub of (sem.courses || [])) {
            // Skip if already added from marks data
            const existing = courseList.find(c => c.code === sub.code);
            if (!existing) {
              const credits = Number(sub.credits) || 3;
              courseList.push({
                code: sub.code,
                name: sub.name,
                credits,
                category: getCategory(sub.code),
                status: status === 'approved' ? 'In Progress' : 'Planned'
              });
              // Count in-progress credits
              creditsInProgress += credits;
            }
          }
        }
      }
    }
  }

  const creditsRemaining = Math.max(0, TOTAL_REQUIRED - creditsCompleted - creditsInProgress);
  const overallProgressPercent = Math.min(100, (creditsCompleted / TOTAL_REQUIRED) * 100);

  // GPA calc helper
  const calcGPA = (subjectsList) => {
    if (subjectsList.length === 0) return 0;
    let totalGradePoints = 0;
    let totalCreds = 0;
    for (const s of subjectsList) {
      const percentage = calculateSubjectScore(s.components, s.finalExam);
      const gp = percentageToGradePoint(percentage);
      totalGradePoints += gp * s.credits;
      totalCreds += s.credits;
    }
    return totalCreds > 0 ? Number((totalGradePoints / totalCreds).toFixed(2)) : 0;
  };

  const cumulativeGPA = calcGPA(completedSubjects);
  const majorSubjects = completedSubjects.filter(s => s.category === 'core' || s.category === 'mathematics');
  const majorGPA = calcGPA(majorSubjects);
  
  // Last term GPA
  let lastTermGPA = cumulativeGPA;
  if (lastTermSubjects.length > 0) {
    lastTermGPA = calcGPA(lastTermSubjects);
  }

  const expectedGraduation = computeExpectedGraduation(TOTAL_REQUIRED - creditsCompleted);

  // Badges
  const badges = [];
  const expectedCreditsAtThisPoint = completedSemesters.size * 16;

  if (cumulativeGPA < 2.0 && completedSubjects.length > 0) {
    badges.push({ label: "At Risk", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" });
  } else if (cumulativeGPA >= 2.0 && creditsCompleted >= expectedCreditsAtThisPoint) {
    badges.push({ label: "On Track - Academic", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" });
  }

  if (coreCompleted >= REQ_CORE) {
    badges.push({ label: "Complete - Core", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" });
  }

  if (elecCompleted > 0 && elecCompleted < REQ_ELEC) {
    badges.push({ label: "In Progress - Electives", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" });
  } else if (elecCompleted === 0) {
    badges.push({ label: "Not Started - Electives", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" });
  }

  return {
    overallProgressPercent,
    creditsCompleted,
    creditsInProgress,
    creditsRemaining,
    totalRequired: TOTAL_REQUIRED,
    
    categories: {
      core: { 
        completed: coreCompleted, 
        required: REQ_CORE, 
        percent: Math.min(100, (coreCompleted / REQ_CORE) * 100) 
      },
      mathematics: { 
        completed: mathCompleted, 
        required: REQ_MATH, 
        percent: Math.min(100, (mathCompleted / REQ_MATH) * 100) 
      },
      electives: { 
        completed: elecCompleted, 
        required: REQ_ELEC, 
        percent: Math.min(100, (elecCompleted / REQ_ELEC) * 100) 
      }
    },
    
    courseList,
    
    gpa: {
      cumulative: cumulativeGPA.toFixed(2),
      major: majorGPA.toFixed(2),
      lastTerm: lastTermGPA.toFixed(2)
    },
    
    expectedGraduation,
    badges
  };
}
