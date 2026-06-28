import { formatExpression } from "../utils/format";

interface DisplayProps {
  expression: string;
  result: string;
  error: string | null;
}

export default function Display({ expression, result, error }: DisplayProps) {
  const displayExpression = expression ? formatExpression(expression) : "";
  const displayResult = error ?? result;
  const isError = error !== null;

  return (
    <div className="display" aria-label="Calculator display" role="status" aria-live="polite">
      <div className="display-expression">
        {displayExpression || (
          <span className="display-placeholder">0</span>
        )}
      </div>
      <div className={`display-result${isError ? " display-result--error" : ""}`}>
        {displayResult}
      </div>
    </div>
  );
}
