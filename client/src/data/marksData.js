import api from '../api/axios';

export const getMarksData = async (studentId = null) => {
  try {
    const res = await api.get('/marks', { params: { studentId } });
    const marks = res.data.marks;
    const grouped = {};

    // Check localStorage if DB is empty (Migration Bridge)
    if ((!marks || marks.length === 0) && !studentId) {
      const localData = localStorage.getItem('advisorpath_marks');
      if (localData) {
        return JSON.parse(localData);
      }
    }
    
    if (!marks || marks.length === 0) return {};
    
    // Group marks by student ID
    marks.forEach(m => {
      const sId = (m.student._id || m.student)?.toString();
      if (!grouped[sId]) {
        grouped[sId] = { studentId: sId, semesters: [] };
      }
      grouped[sId].semesters.push({
        id: m._id?.toString(),
        label: m.semester,
        subjects: m.subjects,
        advisorFeedback: m.advisorFeedback
      });
    });
    return grouped;
  } catch (err) {
    console.error("Error fetching marks:", err);
    return {};
  }
};

export const updateStudentMarks = async (studentId, semester, subjects) => {
  try {
    await api.post('/marks', { semester, subjects });
    return true;
  } catch (err) {
    console.error("Error saving marks:", err);
    return false;
  }
};

export const addAdvisorFeedback = async (markId, feedback) => {
  try {
    await api.post(`/marks/${markId}/feedback`, feedback);
    return true;
  } catch (err) {
    console.error("Error adding feedback:", err);
    return false;
  }
};

// Helper functions 
export const calcTotalScore = (comp) => {
  if (!comp) return 0;
  // Ensure we are adding numbers, not strings!
  const internal = Number(comp.internal?.scored || 0);
  const midterm = Number(comp.midterm?.scored || 0);
  const assignment = Number(comp.assignment?.scored || 0);
  const final = Number(comp.final?.scored || 0);
  return internal + midterm + assignment + final;
};

// Backwards compatibility for old name
export const calcScoreOutOf80 = calcTotalScore;

export const calcAggregate = (subjects) => {
  if (!subjects || !subjects.length) return 0;
  // Each subject is out of 100
  const total = subjects.reduce((acc, sub) => acc + calcTotalScore(sub.components), 0);
  return total / subjects.length;
};

export const gradeFromAggregate = (agg) => {
  if (agg >= 85) return 'A+';
  if (agg >= 75) return 'A';
  if (agg >= 65) return 'B';
  if (agg >= 50) return 'C';
  return 'F';
};

export const healthScore = (agg) => {
  if (agg >= 65) return { status: 'Healthy', color: 'text-green-600', bg: 'bg-green-100' };
  if (agg >= 50) return { status: 'Needs Attention', color: 'text-amber-600', bg: 'bg-amber-100' };
  return { status: 'At Risk', color: 'text-red-600', bg: 'bg-red-100' };
};

export const gapToTarget = (target, currentTotal80) => {
  let targetTotal = 60;
  if (target === 'A+') targetTotal = 85;
  else if (target === 'A') targetTotal = 75;
  else if (target === 'B') targetTotal = 65;
  
  const needed = targetTotal - currentTotal80;
  
  if (needed <= 0) return { text: 'On Track', color: 'text-green-500' };
  if (needed > 20) return { text: 'Target not achievable', color: 'text-red-500' };
  return { text: `Need ${needed.toFixed(0)}/20 in final`, color: 'text-amber-500' };
};
