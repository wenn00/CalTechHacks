'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import BasicQuestions from '@/components/onboarding/BasicQuestions';
import ResearchQuestions from '@/components/onboarding/ResearchQuestions';
import GoalsQuestions from '@/components/onboarding/GoalsQuestions';

export default function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    affiliation: '',
    role: '',
    research_area: '',
    goals: [],
  });

  const nextStep = () => setStep((s) => s + 1);

  const submitProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert('Please log in first');
        window.location.href = '/login';
        return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...formData,
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      });

    if (error) {
      alert(error.message);
    } else {
      window.location.href = '/onboarding/channels';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 bg-gray-200 h-2 rounded-full">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="bg-white p-8 shadow-lg rounded-xl">
        {step === 1 && <BasicQuestions data={formData} update={setFormData} onNext={nextStep} />}
        {step === 2 && <ResearchQuestions data={formData} update={setFormData} onNext={nextStep} />}
        {step === 3 && <GoalsQuestions data={formData} update={setFormData} onNext={nextStep} />}
        {step === 4 && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to join the community?</h2>
            <p className="text-gray-600">We'll connect you to the right channels based on your profile.</p>
            <button
              onClick={submitProfile}
              className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
            >
              Finish Onboarding
            </button>
            <button
              onClick={() => setStep(3)}
              className="text-gray-500 underline text-sm"
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
