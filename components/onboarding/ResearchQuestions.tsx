interface Props {
  data: any;
  update: (data: any) => void;
  onNext: () => void;
}

const RESEARCH_AREAS = [
  'Longevity Biology',
  'Drug Discovery',
  'Biomarkers',
  'Clinical Trials',
  'AI/Machine Learning',
  'Regenerative Medicine',
  'Senolytics',
];

export default function ResearchQuestions({ data, update, onNext }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">What is your research focus?</h2>
      <div className="grid grid-cols-1 gap-2">
        {RESEARCH_AREAS.map((area) => (
          <label key={area} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="research_area"
              checked={data.research_area === area}
              onChange={() => update({ ...data, research_area: area })}
              className="h-4 w-4"
            />
            <span>{area}</span>
          </label>
        ))}
        <div className="mt-2">
          <label className="block text-sm font-medium">Other</label>
          <input
            type="text"
            value={RESEARCH_AREAS.includes(data.research_area) ? '' : data.research_area}
            onChange={(e) => update({ ...data, research_area: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Specify other research area"
          />
        </div>
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
