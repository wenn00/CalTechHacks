function scoreSession(session, profile) {
  const text = session.raw.toLowerCase();
  let score = 0;

  // Goal-based weighting
  if (profile.goal === 'fundraising') {
    if (text.includes('investor') || text.includes('investment') ||
        text.includes('venture') || text.includes('startup') ||
        text.includes('company') || text.includes('panel')) score += 5;
  }
  if (profile.goal === 'collaboration' || profile.goal === 'publishing') {
    if (text.includes('workshop') || text.includes('science') ||
        text.includes('research') || text.includes('biology') ||
        text.includes('track') || text.includes('emerging')) score += 5;
  }
  if (profile.goal === 'recruiting') {
    if (text.includes('workshop') || text.includes('session') ||
        text.includes('roundtable') || text.includes('network')) score += 5;
  }
  if (profile.goal === 'bd') {
    if (text.includes('pharma') || text.includes('biotech') ||
        text.includes('partnership') || text.includes('industry')) score += 5;
  }

  // Interest-based weighting
  const interests = profile.interests || [];
  interests.forEach(interest => {
    if (text.includes(interest.toLowerCase())) score += 3;
  });

  // Focus keywords
  if (profile.focus) {
    const keywords = profile.focus.toLowerCase().split(/[\s,]+/);
    keywords.forEach(word => {
      if (word.length > 3 && text.includes(word)) score += 2;
    });
  }

  // Role-based weighting
  if (profile.role === 'investor' && text.includes('company')) score += 3;
  if (profile.role === 'academic' && text.includes('science')) score += 3;
  if (profile.role === 'founder' && text.includes('startup')) score += 3;

  // Always include opening/registration
  if (text.includes('opening') || text.includes('registration') ||
      text.includes('welcome') || text.includes('keynote')) score += 2;

  return score;
}

function buildSchedule(sessions, profile) {
  const scored = sessions.map(session => ({
    ...session,
    score: scoreSession(session, profile)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}

module.exports = { buildSchedule };

