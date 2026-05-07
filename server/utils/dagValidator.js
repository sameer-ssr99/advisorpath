// dagValidator.js

function buildGraph(courses) {
  const graph = new Map();
  for (const course of courses) {
    graph.set(String(course._id), (course.prerequisites || []).map(id => typeof id === 'object' ? String(id._id || id) : String(id)));
  }
  return graph;
}

function detectCycles(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  let cyclePath = [];

  const dfs = (node, path) => {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...path])) return true;
      } else if (recursionStack.has(neighbor)) {
        cyclePath = [...path, neighbor];
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  };

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (dfs(node, [])) {
        return { hasCycle: true, cyclePath };
      }
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

function topologicalSort(graph, nodeIds = []) {
  const inDegree = new Map();
  const nodes = nodeIds.length ? nodeIds : Array.from(graph.keys());

  for (const node of nodes) {
    inDegree.set(node, 0);
  }

  for (const node of nodes) {
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (inDegree.has(neighbor)) {
        inDegree.set(neighbor, inDegree.get(neighbor) + 1);
      }
    }
  }

  const queue = [];
  for (const [node, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(node);
  }

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    const neighbors = graph.get(current) || [];
    for (const neighbor of neighbors) {
      if (inDegree.has(neighbor)) {
        inDegree.set(neighbor, inDegree.get(neighbor) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
  }

  const hasCycle = sorted.length !== nodes.length;
  return { sorted, hasCycle };
}

function validatePlan(plan, allCourses, studentCompletedCourseIds = []) {
  const errors = [];
  const warnings = [];
  const creditSummary = [];
  
  const courseMap = new Map();
  for (const course of allCourses) {
    courseMap.set(String(course._id), course);
  }

  const completedSoFar = new Set((studentCompletedCourseIds || []).map(id => typeof id === 'object' ? String(id._id || id) : String(id)));
  const seenCourses = new Set();
  
  for (let i = 0; i < plan.semesters.length; i++) {
    const semester = plan.semesters[i];
    const semName = semester.name || `Semester ${i + 1}`;
    let totalCredits = 0;
    const currentSemesterCourses = new Set();
    
    for (const courseIdObj of semester.courses) {
      const courseId = String(courseIdObj._id || courseIdObj);
      const course = courseMap.get(courseId);
      
      if (!course) continue; // Skip if course doesn't exist

      totalCredits += course.credits;

      // Duplicate check
      if (seenCourses.has(courseId)) {
        errors.push({
          courseCode: course.code,
          courseName: course.name,
          missingPrereqs: [] // Indicates duplicate
        });
        warnings.push({
          semester: semName,
          message: `Duplicate course: ${course.code} appears multiple times in the plan.`
        });
      }
      seenCourses.add(courseId);
      currentSemesterCourses.add(courseId);

      // Prerequisite check
      const missingPrereqs = [];
      const prereqs = course.prerequisites || [];
      for (const prereqIdObj of prereqs) {
        const prereqId = String(prereqIdObj._id || prereqIdObj);
        if (!completedSoFar.has(prereqId)) {
          const pCourse = courseMap.get(prereqId);
          missingPrereqs.push(pCourse ? pCourse.code : prereqId);
        }
      }

      if (missingPrereqs.length > 0) {
        errors.push({
          courseCode: course.code,
          courseName: course.name,
          missingPrereqs
        });
      }
    }

    // Credits check
    if (totalCredits > 18) {
      warnings.push({ semester: semName, message: `Semester exceeds 18 credits (Total: ${totalCredits}).` });
    } else if (totalCredits < 1) {
      errors.push({ courseCode: 'N/A', courseName: 'N/A', missingPrereqs: [], message: `${semName} has 0 credits.` });
      // The requirement says: "error if <1". We'll just add an error or warning as appropriate.
      warnings.push({ semester: semName, message: `Semester must have at least 1 credit.` });
    }

    creditSummary.push({ semester: semName, totalCredits });

    // Add current semester's courses to completedSoFar for next semesters
    for (const id of currentSemesterCourses) {
      completedSoFar.add(id);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    creditSummary
  };
}

function getPrerequisiteChain(courseId, allCourses) {
  const courseMap = new Map();
  for (const c of allCourses) {
    courseMap.set(String(c._id), c);
  }

  const graph = buildGraph(allCourses);
  const cycleDetection = detectCycles(graph);
  
  if (cycleDetection.hasCycle) {
    return { chain: [], hasCycle: true, cyclePath: cycleDetection.cyclePath };
  }

  const idStr = String(courseId);
  if (!courseMap.has(idStr)) {
    return { chain: [], hasCycle: false, cyclePath: [] };
  }

  const chainSet = new Set();
  
  const collectPrereqs = (nodeId) => {
    const course = courseMap.get(nodeId);
    if (!course) return;
    const prereqs = course.prerequisites || [];
    for (const prereqObj of prereqs) {
      const pid = String(prereqObj._id || prereqObj);
      if (!chainSet.has(pid)) {
        chainSet.add(pid);
        collectPrereqs(pid);
      }
    }
  };

  collectPrereqs(idStr);

  // Topologically sort the collected set
  const { sorted } = topologicalSort(graph, Array.from(chainSet));
  
  // Convert sorted IDs to Course objects
  const chain = sorted.map(id => courseMap.get(id)).filter(Boolean);

  return { chain, hasCycle: false, cyclePath: [] };
}

module.exports = {
  buildGraph,
  topologicalSort,
  detectCycles,
  validatePlan,
  getPrerequisiteChain
};
