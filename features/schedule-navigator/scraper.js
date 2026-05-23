require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function fetchARDDProgram() {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*');

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('No sessions found');

    return data.map(s => ({
      raw: `${s.start_time}-${s.end_time} ${s.title}`,
      time: s.start_time,
      tags: s.tags || [],
      track: s.track,
      location: s.location,
      day: s.day
    }));

  } catch (err) {
    console.error('Supabase fetch failed:', err.message);
    return [];
  }
}

module.exports = { fetchARDDProgram };