// notion.mjs — Notion CRM functions (ported from lib.js)
// Query leads, parse properties, update lead after draft creation.

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';
const CRM_DATA_SOURCE_ID = process.env.NOTION_CRM_DATASOURCE_ID || '26f862e1-4a0c-808f-a249-000b2cee31df';

/**
 * Low-level Notion API call.
 */
async function notionFetch(apiKey, endpoint, options = {}) {
  const res = await fetch(`${NOTION_API}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion ${res.status}: ${text}`);
  }
  return res.json();
}

/**
 * Query all CRM leads (paginated).
 * @param {string} notionApiKey
 * @param {object} [filter] — optional Notion filter object
 * @returns {Array} — raw Notion page objects
 */
export async function queryCRM(notionApiKey, filter = null) {
  const body = { page_size: 100 };
  if (filter && Object.keys(filter).length) body.filter = filter;

  let results = [];
  let cursor;
  do {
    if (cursor) body.start_cursor = cursor;
    const data = await notionFetch(notionApiKey, `/data_sources/${CRM_DATA_SOURCE_ID}/query`, {
      method: 'POST',
      body,
    });
    results = results.concat(data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return results;
}

/**
 * Query CRM for a single lead by email address.
 */
export async function queryCRMByEmail(notionApiKey, email) {
  const filter = {
    property: 'Email',
    email: { equals: email },
  };
  const results = await queryCRM(notionApiKey, filter);
  return results.length > 0 ? results[0] : null;
}

/**
 * Parse a Notion page object into a flat lead object.
 * Property names match the ArtNapi CRM schema.
 */
export function parseNotionLead(page) {
  const p = page.properties;

  const getText = (prop) => {
    if (!prop) return '';
    if (prop.type === 'title') return (prop.title || []).map(t => t.plain_text).join('');
    if (prop.type === 'rich_text') return (prop.rich_text || []).map(t => t.plain_text).join('');
    return '';
  };
  const getSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
  const getDate = (prop) => prop?.date?.start ? new Date(prop.date.start + 'T00:00:00') : null;
  const getNumber = (prop) => prop?.number ?? null;

  return {
    id: page.id,
    name: getText(p['Task name']),
    company: getText(p['nazwa klienta']),
    contact: getText(p['osoba kontaktowa']),
    email: p['Email']?.email || '',
    phone: p['Phone']?.phone_number || '',
    status: getSelect(p['Status']),
    priority: getSelect(p['PRIORYTET']),
    segment: getSelect(p['segment rynku']),
    country: getSelect(p['kraj']),
    icp: getSelect(p['ICP']),
    source: getSelect(p['źródło leada']),
    value: getNumber(p['wartość szansy']),
    due: getDate(p['Due']),
    lastContact: getDate(p['ostatni kontakt']),
    notes: getText(p['notatki']),
    summary: getText(p['Summary']),
    tag: getSelect(p['tag_klienta']),
  };
}

/**
 * Build an email -> parsed lead index from raw CRM results.
 */
export function buildEmailIndex(rawLeads) {
  const index = {};
  for (const page of rawLeads) {
    const lead = parseNotionLead(page);
    if (lead.email) {
      index[lead.email.toLowerCase()] = lead;
    }
  }
  return index;
}

/**
 * Update a lead's "ostatni kontakt", "Due", and append to "notatki".
 * Implements Edge Case 5 logic: user writes always win.
 *
 * @param {string} notionApiKey
 * @param {object} lead — parsed lead object (from parseNotionLead)
 * @param {object} updates — { lastContact: 'YYYY-MM-DD', due: 'YYYY-MM-DD', note: string }
 */
export async function updateNotionLead(notionApiKey, lead, updates) {
  const properties = {};
  const today = new Date().toISOString().slice(0, 10);

  // Rule (Edge Case 5): Only update "ostatni kontakt" if not already updated today
  const lastContactStr = lead.lastContact ? lead.lastContact.toISOString().slice(0, 10) : null;
  if (lastContactStr === today) {
    console.log(`[Notion] CRM already updated today for ${lead.company || lead.id}. Skipping.`);
    return { skipped: true, reason: 'already_updated_today' };
  }

  if (updates.lastContact) {
    properties['ostatni kontakt'] = { date: { start: updates.lastContact } };
  }

  // Rule (Edge Case 5): Only update Due if overdue or null (don't overwrite future user-set Due)
  if (updates.due) {
    const currentDue = lead.due;
    const shouldUpdateDue = !currentDue || currentDue < new Date(today);
    if (shouldUpdateDue) {
      properties['Due'] = { date: { start: updates.due } };
    } else {
      console.log(`[Notion] Due already set to future date for ${lead.company || lead.id}. Lambda not overwriting.`);
    }
  }

  // Append to notatki (never overwrite)
  if (updates.note) {
    const existingNotes = lead.notes || '';
    const appendedNotes = existingNotes
      ? `${existingNotes}\n${updates.note}`
      : updates.note;
    // Notion rich_text max ~2000 chars — truncate if needed
    const truncated = appendedNotes.length > 1900
      ? appendedNotes.slice(-1900)
      : appendedNotes;
    properties['notatki'] = {
      rich_text: [{ text: { content: truncated } }],
    };
  }

  if (Object.keys(properties).length === 0) {
    return { skipped: true, reason: 'no_updates_needed' };
  }

  await notionFetch(notionApiKey, `/pages/${lead.id}`, {
    method: 'PATCH',
    body: { properties },
  });

  return { skipped: false };
}
