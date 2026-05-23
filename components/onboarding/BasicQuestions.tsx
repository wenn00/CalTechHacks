interface Props {
  data: any;
  update: (data: any) => void;
  onNext: () => void;
}

export default function BasicQuestions({ data, update, onNext }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tell us about yourself</h2>
      <div>
        <label className="block text-sm font-medium">Full Name</label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => update({ ...data, name: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Affiliation</label>
        <input
          type="text"
          value={data.institution}
          onChange={(e) => update({ ...data, institution: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., Harvard, Calico, Pfizer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Role</label>
        <input
          type="text"
          value={data.role}
          onChange={(e) => update({ ...data, role: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="e.g., Researcher, Founder, Investor"
        />
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
