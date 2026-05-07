export default function ValidationAlert({ validation }) {
  if (!validation) return null;

  const { valid, errors = [], warnings = [] } = validation;

  return (
    <div className="mb-6 space-y-4">
      {valid && warnings.length === 0 && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          <p className="font-semibold flex items-center">
            <span className="mr-2">✓</span> Plan is valid! All prerequisites met and credits are balanced.
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="font-bold mb-2 flex items-center">
            <span className="mr-2">⚠</span> Validation Errors ({errors.length})
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {errors.map((err, i) => (
              <li key={i}>
                <strong>{err.courseCode}</strong>: 
                {err.missingPrereqs && err.missingPrereqs.length > 0 
                  ? ` Missing prerequisites: ${err.missingPrereqs.join(', ')}`
                  : ` ${err.message || 'Duplicate or invalid course.'}`
                }
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          <p className="font-bold mb-2 flex items-center">
            <span className="mr-2">ℹ</span> Warnings ({warnings.length})
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {warnings.map((warn, i) => (
              <li key={i}>
                <strong>{warn.semester}</strong>: {warn.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
