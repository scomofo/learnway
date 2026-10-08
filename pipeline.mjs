// Learnway pipeline: topic -> structured course JSON via the Gemini API.
// Pure client-side: the API key lives in the learner's browser (localStorage)
// and is sent only to generativelanguage.googleapis.com.
'use strict';

export const DEFAULT_MODEL = 'gemini-3.8-flash';
export const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-pro-preview',
];

export const LEVELS = [
  { id: 'beginner', label: 'Curious beginner', hint: 'No background assumed. Concrete, jargon-free, every term earned.' },
  { id: 'highschool', label: 'High school', hint: 'Grade 9-12 reading level. Assumes middle-school science; reads like a great textbook.' },
  { id: 'intermediate', label: 'Intermediate', hint: 'Some background. Move briskly, explain the tricky parts.' },
  { id: 'advanced', label: 'Advanced', hint: 'Solid background. Depth, nuance, edge cases, primary-source flavor.' },
  { id: 'expert', label: 'Expert', hint: 'Peer-level. Frontier detail, open questions, no hand-holding.' },
];

export const DEPTHS = [
  { id: 'quick', label: 'Quick', sections: 3, hint: 'One sitting. The essential mental model.' },
  { id: 'standard', label: 'Standard', sections: 5, hint: 'A thorough evening. Model plus working detail.' },
  { id: 'deep', label: 'Deep dive', sections: 7, hint: 'The full treatment. History, mechanism, edge cases.' },
];

const API_HOST = 'https://generativelanguage.googleapis.com';

export class PipelineError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

/**
 * Parse model JSON robustly. Models sometimes wrap the payload in markdown
 * fences or add leading/trailing chatter; try the raw text, then a fenced
 * block, then the outermost {...} span before giving up.
 */
export function parseJsonLoose(text) {
  const attempts = [() => JSON.parse(text)];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) attempts.push(() => JSON.parse(fenced[1].trim()));
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start !== -1 && end > start) attempts.push(() => JSON.parse(text.slice(start, end + 1)));
  let last;
  for (const attempt of attempts) {
    try { return attempt(); } catch (e) { last = e; }
  }
  throw last;
}

async function callGemini({ apiKey, model, system, user, schema, maxTokens, temperature = 0.7 }) {
  const url = `${API_HOST}/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    });
  } catch {
    throw new PipelineError('Could not reach the Gemini API. Check your connection.', 'network');
  }
  if (res.status === 400) {
    const detail = await res.text().catch(() => '');
    if (/api key/i.test(detail)) throw new PipelineError('API key rejected. Check the key in Settings — grab a fresh one from Google AI Studio.', 'bad-key');
    throw new PipelineError(`Request rejected (400): ${detail.slice(0, 300)}`, 'bad-request');
  }
  if (res.status === 401 || res.status === 403) throw new PipelineError('API key rejected. Check the key in Settings — grab a fresh one from Google AI Studio.', 'bad-key');
  if (res.status === 429) throw new PipelineError('Rate limit hit. Wait a minute and try again.', 'rate-limit');
  if (!res.ok) throw new PipelineError(`Gemini API returned ${res.status}. Try again in a bit.`, 'api');
  const data = await res.json();
  const block = data?.promptFeedback?.blockReason;
  if (block) throw new PipelineError(`Generation was blocked (${block}). Try rephrasing the topic.`, 'blocked');
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('');
  if (!text) throw new PipelineError('Empty response from the model. Try again.', 'empty');
  try {
    return parseJsonLoose(text);
  } catch {
    throw new PipelineError('Model returned malformed JSON. Try again — this is usually transient.', 'parse');
  }
}

const DESIGNER = `You are an expert instructional designer and subject-matter explainer. You build courses that respect the learner's intelligence: technically rigorous, never dumbed down, but always approachable. You follow learning science:
- Dual coding, visual-first by default: every lesson carries a concrete visual element — a picture-the-scene analogy, a mental-model sketch, or a simple text diagram — so each key idea is seeable, not just readable.
- Formative assessment: questions that reveal understanding, never trick questions.
- Interest-anchored analogies: explain unfamiliar ideas through things the learner already loves.
- Plain register: short sentences, concrete nouns, every technical term defined on first use unless the level says otherwise.`;

function personalization(level, interests, depth) {
  const lvl = LEVELS.find(l => l.id === level) || LEVELS[1];
  const n = (DEPTHS.find(d => d.id === depth) || DEPTHS[1]).sections;
  return `AUDIENCE
- Level: ${lvl.label} — ${lvl.hint}
- The learner's interests: ${interests || '(none given — use vivid everyday analogies)'}. Weave analogies and examples from these interests through explanations and quiz scenarios wherever they genuinely fit. Never force them.
- Course length: exactly ${n} sections.`;
}

const SCHEMAS = {
  plan: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      hook: { type: 'string', description: 'Two sentences that make the learner need to know this.' },
      objectives: { type: 'array', items: { type: 'string' }, description: '3-5 things the learner will be able to do.' },
      prerequisites: { type: 'array', items: { type: 'string' } },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            heading: { type: 'string' },
            points: { type: 'array', items: { type: 'string' }, description: 'The 3-5 key ideas this section must land.' },
          },
          required: ['id', 'heading', 'points'],
        },
      },
    },
    required: ['title', 'hook', 'objectives', 'prerequisites', 'sections'],
  },
  reading: {
    type: 'object',
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            heading: { type: 'string' },
            body: { type: 'string', description: 'Markdown narrative, 250-450 words. Subheadings allowed. No quiz content here.' },
            visual: { type: 'string', description: 'Visual explanation for this section: a concrete scene to picture, a visual analogy, or a simple text diagram. 2-4 sentences. Every section should have one.' },
            questions: {
              type: 'array',
              description: '2 embedded check-in questions tied to this section.',
              items: {
                type: 'object',
                properties: {
                  q: { type: 'string' },
                  answer: { type: 'string', description: 'A 1-2 sentence answer.' },
                  hint: { type: 'string', description: 'Nudge toward the answer without giving it.' },
                },
                required: ['q', 'answer', 'hint'],
              },
            },
          },
          required: ['id', 'heading', 'body', 'questions'],
        },
      },
    },
    required: ['sections'],
  },
  quizzes: {
    type: 'object',
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            questions: {
              type: 'array',
              description: '3 questions: test application, not recall. Distractors must be plausible.',
              items: {
                type: 'object',
                properties: {
                  q: { type: 'string' },
                  choices: { type: 'array', items: { type: 'string' }, description: '4 options.' },
                  answer: { type: 'integer', description: 'Index of the correct choice.' },
                  explain: { type: 'string', description: 'Why the answer is right and the distractors are wrong.' },
                },
                required: ['q', 'choices', 'answer', 'explain'],
              },
            },
          },
          required: ['id', 'questions'],
        },
      },
    },
    required: ['sections'],
  },
  slides: {
    type: 'object',
    properties: {
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            bullets: { type: 'array', items: { type: 'string' }, description: '5-7 tight bullets, the lecture skeleton.' },
            notes: { type: 'string', description: 'Speaker notes: the 60-second spoken version, conversational.' },
            visual: { type: 'string', description: 'What the learner should picture with this slide: a scene, diagram, or visual analogy. 1-2 sentences. Every slide should have one.' },
          },
          required: ['id', 'title', 'bullets', 'notes'],
        },
      },
    },
    required: ['sections'],
  },
  enrichment: {
    type: 'object',
    properties: {
      audioTitle: { type: 'string' },
      turns: {
        type: 'array',
        description: 'Teacher/student dialogue, 14-20 turns, Socratic: the student asks sharp questions and holds misconceptions the teacher corrects.',
        items: {
          type: 'object',
          properties: {
            speaker: { type: 'string', enum: ['teacher', 'student'] },
            line: { type: 'string' },
          },
          required: ['speaker', 'line'],
        },
      },
      nodes: {
        type: 'array',
        description: 'Mind-map nodes. Exactly one root (parent null). Every other node names its parent id.',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            parent: { type: 'string', nullable: true, description: 'Parent node id; null for the single root node.' },
            note: { type: 'string', description: 'One clarifying sentence.' },
          },
          required: ['id', 'label', 'parent', 'note'],
        },
      },
      mnemonics: {
        type: 'array',
        description: 'Memory aids for the hardest-to-retain facts. Empty array is fine if nothing needs one.',
        items: {
          type: 'object',
          properties: { for: { type: 'string' }, aid: { type: 'string' } },
          required: ['for', 'aid'],
        },
      },
    },
    required: ['audioTitle', 'turns', 'nodes', 'mnemonics'],
  },
};

function sectionDigest(plan) {
  return plan.sections.map(s => `- ${s.id}: ${s.heading}\n  ${s.points.join('\n  ')}`).join('\n');
}

/** Step 1: a tight plan the learner approves before the expensive calls. */
export async function generatePlan({ apiKey, model, topic, level, interests, depth }, onProgress) {
  onProgress?.('Sketching the course plan…');
  const n = (DEPTHS.find(d => d.id === depth) || DEPTHS[1]).sections;
  const plan = await callGemini({
    apiKey, model,
    system: DESIGNER,
    user: `${personalization(level, interests, depth)}

Design a course on this topic: "${topic}"

Return exactly ${n} sections that build on each other: open with the core mental model, then mechanism, then depth/edge cases, then connections outward. Objectives must be capabilities ("explain X", "predict Y"), never "understand Z".`,
    schema: SCHEMAS.plan, maxTokens: 2048, temperature: 0.6,
  });
  requireValidPart('plan', plan);
  return { topic, level, interests, depth, model, plan };
}

/** Steps 2-5: the full course pack, built on the approved plan. */
export async function generateCourse(draft, creds, onProgress) {
  requireValidPart('plan', draft?.plan);
  const { apiKey, model } = creds;
  const { topic, level, interests, depth, plan } = draft;
  const pers = personalization(level, interests, draft.depth);
  const digest = sectionDigest(plan);

  onProgress?.('Writing the immersive reading… (1 of 4)');
  const reading = await callGemini({
    apiKey, model,
    system: DESIGNER,
    user: `${pers}

Write the immersive reading for the course "${plan.title}" on "${topic}".
Follow this approved plan exactly — same section ids, headings, and points:

${digest}

For each section: a narrative body (markdown, 250-450 words) that teaches the points in order, opening with the single most surprising or important idea. Weave in the learner's interests for analogies. End each section with 2 embedded check-in questions (with answers and hints).
Every section must also include a visual explanation element (the "visual" field): make the section's key idea seeable — a concrete scene to picture, a visual analogy drawn from the learner's interests, or a simple labeled text diagram. Be specific enough to sketch; never a generic "imagine a graph".`,
    schema: SCHEMAS.reading, maxTokens: 16384,
  });
  requireValidPart('reading', reading, plan);

  onProgress?.('Building section quizzes… (2 of 4)');
  const quizzes = await callGemini({
    apiKey, model,
    system: DESIGNER,
    user: `${pers}

Write section quizzes for the course "${plan.title}" on "${topic}".
Sections:

${digest}

For each section: 3 multiple-choice questions that test application and reasoning, not memorized facts. Wrong options must be plausible mistakes a learner could really make. Each needs an explanation of why the right answer is right and what each distractor gets wrong.`,
    schema: SCHEMAS.quizzes, maxTokens: 8192,
  });
  requireValidPart('quizzes', quizzes, plan);

  onProgress?.('Drafting slides and narration… (3 of 4)');
  const slides = await callGemini({
    apiKey, model,
    system: DESIGNER,
    user: `${pers}

Write the lecture version of the course "${plan.title}" on "${topic}".
Sections:

${digest}

For each section: a slide title, 5-7 tight bullets (the skeleton of a 5-minute lecture segment), and speaker notes — the conversational 60-second spoken version of those bullets, as if explaining to a smart friend.
Every slide also carries a "visual" cue: the one scene, diagram, or visual analogy the learner should picture while hearing these bullets.`,
    schema: SCHEMAS.slides, maxTokens: 8192,
  });
  requireValidPart('slides', slides, plan);

  onProgress?.('Scripting the audio lesson, mind map and mnemonics… (4 of 4)');
  const enrichment = await callGemini({
    apiKey, model,
    system: DESIGNER,
    user: `${pers}

Create the enrichment pack for the course "${plan.title}" on "${topic}".
Sections:

${digest}

1. Audio lesson: a Socratic dialogue between a teacher and a curious student covering the whole arc of the course. 14-20 turns. The student asks sharp questions, voices common misconceptions, and the teacher corrects with patience and concrete examples drawn from the learner's interests.
2. Mind map: nodes covering every section's key ideas, exactly one root node, every other node naming its parent id.
3. Mnemonics: memory aids for the hardest facts. Skip if nothing genuinely needs one.`,
    schema: SCHEMAS.enrichment, maxTokens: 8192,
  });
  requireValidPart('enrichment', enrichment);

  const course = {
    meta: {
      topic, level, interests, depth, model,
      title: plan.title,
      createdAt: new Date().toISOString(),
      version: 1,
    },
    plan, reading, quizzes, slides, enrichment,
  };
  const problems = validateCourse(course);
  if (problems.length) throw validationError('course', problems);
  return course;
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Reuse the API schemas at the trust boundary; valid JSON alone is not a course.
// Unknown fields remain allowed so older exports can carry extra metadata.
function checkShape(value, schema, path, problems) {
  if (value === null && schema.nullable) return;
  const matches = schema.type === 'object' ? isObject(value)
    : schema.type === 'array' ? Array.isArray(value)
    : schema.type === 'integer' ? Number.isInteger(value)
    : typeof value === schema.type;
  if (!matches) { problems.push(`${path}: expected ${schema.type}`); return; }
  if (schema.type === 'string' && !value.trim()) problems.push(`${path}: must not be blank`);
  if (schema.enum && !schema.enum.includes(value)) problems.push(`${path}: unsupported value`);
  if (schema.type === 'object') {
    for (const key of schema.required || []) {
      if (!Object.hasOwn(value, key)) problems.push(`${path}.${key}: missing`);
    }
    for (const [key, sub] of Object.entries(schema.properties)) {
      if (Object.hasOwn(value, key)) checkShape(value[key], sub, `${path}.${key}`, problems);
    }
  } else if (schema.type === 'array') {
    value.forEach((item, i) => checkShape(item, schema.items, `${path}[${i}]`, problems));
  }
}

function nonempty(items, path, problems) {
  if (!items.length) problems.push(`${path}: must not be empty`);
}

function uniqueIds(items, path, problems) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.id)) problems.push(`${path}: duplicate id "${item.id}"`);
    seen.add(item.id);
  }
}

function checkMindmap(nodes, problems) {
  const path = 'enrichment.nodes';
  nonempty(nodes, path, problems);
  uniqueIds(nodes, path, problems);
  if (nodes.filter(n => n.parent === null).length !== 1) problems.push(`${path}: must have exactly one root`);
  const byId = new Map(nodes.map(n => [n.id, n]));
  const checked = new Set();
  for (const node of nodes) {
    if (node.parent !== null && !byId.has(node.parent)) problems.push(`${path}: unknown parent "${node.parent}"`);
    // Walk parent chains iteratively, including disconnected components. A single
    // root plus known parents and no cycles proves every node reaches that root.
    const chain = new Set();
    let current = node;
    while (current && !checked.has(current.id)) {
      if (chain.has(current.id)) { problems.push(`${path}: cycle at "${current.id}"`); break; }
      chain.add(current.id);
      current = current.parent === null ? undefined : byId.get(current.parent);
    }
    for (const id of chain) checked.add(id);
  }
}

function validatePart(kind, value, plan) {
  const problems = [];
  checkShape(value, SCHEMAS[kind], kind, problems);
  // Structural errors must be fixed before reading nested values below.
  if (problems.length) return problems;
  if (kind === 'enrichment') {
    nonempty(value.turns, 'enrichment.turns', problems);
    checkMindmap(value.nodes, problems);
    return problems;
  }
  nonempty(value.sections, `${kind}.sections`, problems);
  uniqueIds(value.sections, `${kind}.sections`, problems);
  if (plan && (value.sections.length !== plan.sections.length ||
      value.sections.some((section, i) => section.id !== plan.sections[i]?.id))) {
    problems.push(`${kind}.sections: ids must match the approved plan in order`);
  }
  if (kind === 'plan') nonempty(value.objectives, 'plan.objectives', problems);
  value.sections.forEach((section, i) => {
    const path = `${kind}.sections[${i}]`;
    if (kind === 'plan') nonempty(section.points, `${path}.points`, problems);
    if (kind === 'reading' || kind === 'quizzes') nonempty(section.questions, `${path}.questions`, problems);
    if (kind === 'slides') nonempty(section.bullets, `${path}.bullets`, problems);
    if (kind === 'quizzes') section.questions.forEach((q, qi) => {
      const question = `${path}.questions[${qi}]`;
      if (q.choices.length < 2 || q.choices.length > 4) problems.push(`${question}.choices: expected 2 to 4 choices`);
      if (q.answer < 0 || q.answer >= q.choices.length) problems.push(`${question}.answer: must index an existing choice`);
    });
  });
  return problems;
}

function validationError(stage, problems) {
  return new PipelineError(`The ${stage} is incomplete or inconsistent: ${problems.slice(0, 3).join('; ')}. Try again.`, 'validation');
}

function requireValidPart(kind, value, plan) {
  const problems = validatePart(kind, value, plan);
  if (problems.length) throw validationError(kind, problems);
}

/** Validate every field consumed by the views, plus cross-view relationships. */
export function validateCourse(c) {
  if (!isObject(c)) return ['course: expected object'];
  const problems = [];
  if (!isObject(c.meta)) problems.push('meta: expected object');
  else {
    for (const field of ['title', 'topic', 'createdAt']) {
      if (typeof c.meta[field] !== 'string' || !c.meta[field].trim()) problems.push(`meta.${field}: expected nonblank string`);
    }
    for (const field of ['level', 'model', 'interests', 'depth']) {
      if (Object.hasOwn(c.meta, field) && typeof c.meta[field] !== 'string') problems.push(`meta.${field}: expected string`);
    }
    if (typeof c.meta.createdAt === 'string' && !Number.isFinite(Date.parse(c.meta.createdAt))) problems.push('meta.createdAt: invalid date');
  }
  const planProblems = validatePart('plan', c.plan);
  problems.push(...planProblems);
  for (const kind of ['reading', 'quizzes', 'slides', 'enrichment']) {
    problems.push(...validatePart(kind, c[kind], planProblems.length ? undefined : c.plan));
  }
  return problems;
}

