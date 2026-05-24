'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BrandRail, ChoiceCard, Field, MyButton, SelectField, Tag } from '@/components/mycellium/ui';

const ROLE_OPTIONS = [
  'Academic Researcher',
  'Biotech Founder',
  'Investor',
  'Postdoc',
  'PhD Student',
  'Industry Professional',
];

const CAREER_STAGES = [
  { label: 'Early Career', value: 'early_career_researcher' },
  { label: 'Mid Career', value: 'mid_career_researcher' },
  { label: 'Senior Researcher', value: 'senior_researcher' },
  { label: 'Principal Investigator', value: 'pi' },
  { label: 'Founder', value: 'founder' },
  { label: 'Investor', value: 'investor' },
];

const RESEARCH_AREAS = [
  'Senolytics',
  'Epigenetics',
  'Stem Cells',
  'Mitochondria',
  'NAD+',
  'Autophagy',
  'Proteostasis',
  'Immunology',
  'Metabolism',
  'Gene Therapy',
  'Small Molecules',
  'Biomarkers',
];

const GOALS = [
  'Knowledge',
  'Collaboration',
  'Fundraising',
  'Recruiting',
  'Publishing',
  'Business Development',
];

const TABS = ['Profile', 'Role', 'Interests', 'Goals'] as const;

type Step = 0 | 1 | 2 | 3;

type OnboardingData = {
  firstName: string;
  lastName: string;
  email: string;
  institution: string;
  role: string;
  careerStage: string;
  selectedAreas: string[];
  keywords: string[];
  goals: string[];
};

const initialData: OnboardingData = {
  firstName: '',
  lastName: '',
  email: '',
  institution: '',
  role: '',
  careerStage: 'early_career_researcher',
  selectedAreas: ['Senolytics'],
  keywords: ['lipid nanoparticles'],
  goals: [],
};

export default function OnboardingForm() {
  const [step, setStep] = useState<Step>(0);
  const [formData, setFormData] = useState<OnboardingData>(initialData);
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isProfileValid = Boolean(formData.firstName.trim() && formData.lastName.trim() && formData.email.trim() && formData.institution.trim());
  const isRoleValid = Boolean(formData.role && formData.careerStage);
  const isInterestsValid = formData.selectedAreas.length > 0;
  const canContinue = step === 0 ? isProfileValid : step === 1 ? isRoleValid : step === 2 ? isInterestsValid : true;

  const fullName = useMemo(
    () => [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(' '),
    [formData.firstName, formData.lastName],
  );

  useEffect(() => {
    async function loadProfile() {
      const isMock = new URLSearchParams(window.location.search).get('mock') === 'true';
      if (isMock) {
        setFormData((current) => ({ ...current, email: 'attendee@example.com' }));
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const metaName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        '';
      const [firstName = '', ...restName] = metaName.split(' ').filter(Boolean);

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email, institution, role, career_stage, research_area, research_keywords, goals')
        .eq('id', user.id)
        .maybeSingle();

      const profileName = typeof profile?.name === 'string' ? profile.name : '';
      const [profileFirst = firstName, ...profileRest] = profileName.split(' ').filter(Boolean);
      const profileKeywords = Array.isArray(profile?.research_keywords) ? profile.research_keywords : [];
      const profileGoals = Array.isArray(profile?.goals) ? profile.goals : [];
      const profileArea = typeof profile?.research_area === 'string' ? profile.research_area : '';

      setFormData({
        firstName: profileFirst,
        lastName: profileRest.join(' ') || restName.join(' '),
        email: (profile?.email as string | undefined) ?? user.email ?? '',
        institution: (profile?.institution as string | undefined) ?? '',
        role: (profile?.role as string | undefined) ?? '',
        careerStage: (profile?.career_stage as string | undefined) ?? 'early_career_researcher',
        selectedAreas: profileArea ? [profileArea] : initialData.selectedAreas,
        keywords: profileKeywords.length ? profileKeywords : initialData.keywords,
        goals: profileGoals,
      });
      setLoading(false);
    }

    loadProfile();
  }, []);

  const update = (patch: Partial<OnboardingData>) => {
    setFormData((current) => ({ ...current, ...patch }));
  };

  const toggleArea = (area: string) => {
    const selectedAreas = formData.selectedAreas.includes(area)
      ? formData.selectedAreas.filter((item) => item !== area)
      : [...formData.selectedAreas, area];
    update({ selectedAreas });
  };

  const toggleGoal = (goal: string) => {
    const goals = formData.goals.includes(goal)
      ? formData.goals.filter((item) => item !== goal)
      : [...formData.goals, goal];
    update({ goals });
  };

  const addKeyword = () => {
    const normalized = normalizeKeyword(keywordInput);
    if (!normalized || formData.keywords.includes(normalized)) return;
    update({ keywords: [...formData.keywords, normalized] });
    setKeywordInput('');
  };

  const nextStep = () => {
    if (!canContinue) return;
    setStep((current) => Math.min(3, current + 1) as Step);
  };

  const submitProfile = async () => {
    setSaving(true);
    const isMock = new URLSearchParams(window.location.search).get('mock') === 'true';
    const researchKeywords = Array.from(
      new Set([...formData.selectedAreas.map(normalizeKeyword), ...formData.keywords.map(normalizeKeyword)].filter(Boolean)),
    );

    if (isMock) {
      alert('Dev Mode: Profile would be saved here. Redirecting to the network.');
      window.location.href = '/directory';
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user || !user.email) {
      alert('Please log in first');
      window.location.href = '/login';
      return;
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      email: formData.email || user.email,
      name: fullName,
      institution: formData.institution,
      role: formData.role,
      career_stage: formData.careerStage,
      research_area: formData.selectedAreas[0] ?? null,
      research_keywords: researchKeywords,
      session_interests: formData.selectedAreas,
      goals: formData.goals,
      onboarding_complete: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    window.location.href = '/directory';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-zinc-500">
        Loading onboarding...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="md:flex">
        <BrandRail />

        <section className="flex-1 px-6 py-10 md:px-10 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-[1079px]">
            <header>
              <h1 className="text-3xl font-bold leading-tight text-black">Onboarding</h1>
              <p className="mt-3 text-lg font-medium text-zinc-400">Welcome to Mycellium</p>
            </header>

            <div className="mt-7 flex w-full max-w-max border-b border-zinc-200">
              {TABS.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStep(index as Step)}
                  className={`h-11 px-4 text-sm ${
                    step === index ? 'border-b border-zinc-900 text-black' : 'text-zinc-500 hover:text-black'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-4 border border-zinc-200 bg-white p-6 md:p-8">
              {step === 0 && (
                <div className="space-y-9">
                  <div className="grid gap-8 md:grid-cols-2">
                    <Field
                      label="First Name"
                      requiredMark
                      value={formData.firstName}
                      onChange={(event) => update({ firstName: event.target.value })}
                      placeholder="Enter first name"
                    />
                    <Field
                      label="Last Name"
                      requiredMark
                      value={formData.lastName}
                      onChange={(event) => update({ lastName: event.target.value })}
                      placeholder="Enter last name"
                    />
                  </div>
                  <Field
                    label="Email"
                    requiredMark
                    type="email"
                    value={formData.email}
                    onChange={(event) => update({ email: event.target.value })}
                    placeholder="Enter email"
                  />
                  <Field
                    label="Institution/Organization Affiliation"
                    requiredMark
                    value={formData.institution}
                    onChange={(event) => update({ institution: event.target.value })}
                    placeholder="Enter institution or organization"
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-medium text-black">Tell us about yourself</h2>
                    <p className="mt-2 text-base text-black">This helps us find your best matches</p>
                  </div>
                  <div>
                    <h3 className="mb-3 text-lg font-medium text-black">Your Role</h3>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {ROLE_OPTIONS.map((role) => (
                        <ChoiceCard key={role} label={role} selected={formData.role === role} onClick={() => update({ role })} />
                      ))}
                    </div>
                  </div>
                  <SelectField
                    label="Career Stage"
                    value={formData.careerStage}
                    onChange={(event) => update({ careerStage: event.target.value })}
                  >
                    {CAREER_STAGES.map((stage) => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                  </SelectField>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-medium text-black">Research Interests</h2>
                    <p className="mt-2 text-base text-black">Select areas and add specific keywords</p>
                  </div>
                  <div>
                    <h3 className="mb-3 text-xl font-medium text-black">Research Areas</h3>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {RESEARCH_AREAS.map((area) => (
                        <ChoiceCard key={area} label={area} selected={formData.selectedAreas.includes(area)} onClick={() => toggleArea(area)} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-3 text-lg font-medium text-black">Additional Keywords</h3>
                    <div className="grid gap-4 md:grid-cols-[1fr_208px]">
                      <Field
                        value={keywordInput}
                        onChange={(event) => setKeywordInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            addKeyword();
                          }
                        }}
                        placeholder="Lipid Nanoparticles"
                      />
                      <MyButton onClick={addKeyword} disabled={!keywordInput.trim()} className="h-12">
                        Add
                      </MyButton>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formData.keywords.map((keyword) => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() => update({ keywords: formData.keywords.filter((item) => item !== keyword) })}
                        >
                          <Tag>{keyword}</Tag>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-medium text-black">Conference Goals</h2>
                    <p className="mt-2 text-base text-black">Choose what you want to get out of ARDD 2026.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {GOALS.map((goal) => (
                      <ChoiceCard key={goal} label={goal} selected={formData.goals.includes(goal)} onClick={() => toggleGoal(goal)} />
                    ))}
                  </div>
                  <div className="rounded border border-[#4a9b8e] bg-[#deefec] p-5 text-[#195c52]">
                    <p className="text-2xl font-semibold">{fullName || 'Your profile'}</p>
                    <p className="mt-2 text-sm">
                      {formData.role || 'Role'} at {formData.institution || 'your institution'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8">
              {step === 0 || step === 2 ? (
                <MyButton className="h-14 w-full text-lg" onClick={nextStep} disabled={!canContinue}>
                  Continue
                </MyButton>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                  <MyButton variant="secondary" className="sm:w-[208px]" onClick={() => setStep((current) => Math.max(0, current - 1) as Step)}>
                    Back
                  </MyButton>

                  {step < 3 ? (
                    <MyButton className="sm:w-[208px]" onClick={nextStep} disabled={!canContinue}>
                      Continue
                    </MyButton>
                  ) : (
                    <MyButton className="sm:w-[260px]" onClick={submitProfile} disabled={saving || !fullName || !isRoleValid || !isInterestsValid}>
                      {saving ? 'Saving...' : 'Finish Onboarding'}
                    </MyButton>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
