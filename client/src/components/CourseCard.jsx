export default function CourseCard({ course, onClick, hasPrereqs = true }) {
  return (
    <div 
      onClick={() => onClick && onClick(course)}
      className={`p-4 border rounded-xl shadow-sm transition-shadow cursor-pointer ${
        hasPrereqs ? 'bg-white hover:shadow-md border-gray-200' : 'bg-red-50 border-red-200 hover:bg-red-100'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-gray-800">{course.code}</h3>
        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-semibold">
          {course.credits} cr
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-2 truncate" title={course.name}>{course.name}</p>
      {!hasPrereqs && (
        <p className="text-xs text-red-600 font-semibold mt-1">Missing Prereqs</p>
      )}
    </div>
  );
}
