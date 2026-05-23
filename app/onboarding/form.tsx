'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import BasicQuestions from '@/components/onboarding/BasicQuestions';
import GoalsQuestions from '@/components/onboarding/GoalsQuestions';

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        full_name: '',
        affiliation: '',
        role: '',
        research_area: '',
        goals: [],
        });

    const nextStep = () => setStep(s => s + 1);

    const submitProfile = async() => {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('profiles')
            .upsert({ id: user?.id, ...formData, onboarding_complete: true });
        if (!error) window.location.href = '/onboarding/channels';
    };

     return (
        <div className="max-w-2xl mx-auto py-12 px-4">
          <div className="mb-8 bg-gray-200 h-2 rounded-full">
            <div className="bg-blue-600 h-2 rounded-full transition-all"
                 style={{ width: `${(step / 3) * 100}%` }} />
          </div>

          {step === 1 && <StepBasics data={formData} update={setFormData} onNext={nextStep} />}
          {step === 2 && <StepGoals data={formData} update={setFormData} onNext={nextStep} />}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Ready to go?</h2>
              <button onClick={submitProfile} className="bg-green-600 text-white px-6 py-2 rounded">
                Finish Onboarding
              </button>
            </div>
          )}
        </div>
      );
    }