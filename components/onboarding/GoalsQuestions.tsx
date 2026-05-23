interface Props {
  data: any;
  update: (data: any) => void;
  onNext: () => void;
}

const GOALS = [
  'Fundraising',
  'Collaboration',
  'Recruiting',
  'Publishing',
  'Business Development',
];

export default function GoalsQuestions({ data, update, onNext }: Props) {
  const toggleGoal = (goal: string) => {
    const goals = data.goals.includes(goal)
      ? data.goals.filter((g: string) => g !== goal)
      : [...data.goals, goal];
    update({ ...data, goals });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">What are your goals for ARDD 2026?</h2>
      <div className="grid grid-cols-1 gap-2">
        {GOALS.map((goal) => (
          <label key={goal} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={data.goals.includes(goal)}
              onChange={() => toggleGoal(goal)}
              className="h-4 w-4"
            />
            <span>{goal}</span>
          </label>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Next
      </button>
    </div>
  );
}
