function marksToGradePoint(marks) {
  if (marks >= 90) return 4;
  if (marks >= 80) return 3.7;
  if (marks >= 70) return 3.3;
  if (marks >= 60) return 3;
  if (marks >= 50) return 2.5;
  if (marks >= 40) return 2;
  return 0;
}

function computeGpa(grades) {
  if (!grades.length) return 0;
  const sum = grades.reduce((acc, g) => acc + g.gradePoint, 0);
  return Number((sum / grades.length).toFixed(2));
}

function computeTermGpa(grades, term) {
  return computeGpa(grades.filter((g) => g.term === term));
}

module.exports = { marksToGradePoint, computeGpa, computeTermGpa };
