const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Fire-and-forget event log. Never throws — analytics must never break the main flow.
 */
async function track(eventName, userId = null, properties = {}) {
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      user_id: userId,
      properties,
    });
  } catch {
    // silent — analytics failure must never affect the user
  }
}

module.exports = { track };
