function buildTranscriptCsv(student, grades) {
  const header = 'Course Code,Course Name,Term,Marks,Grade Point,Advisor Comment';
  const rows = grades.map((g) => [
    g.course?.code || '',
    (g.course?.name || '').replace(/,/g, ' '),
    g.term,
    g.marks,
    g.gradePoint,
    (g.advisorComment || '').replace(/,/g, ' '),
  ].join(','));

  return [
    `Student,${student.name}`,
    `Email,${student.email}`,
    header,
    ...rows,
  ].join('\n');
}

module.exports = { buildTranscriptCsv };
