#!/usr/bin/env python3
"""One-off: generate a Learnway course via the vault Gemini connector.
Usage: python3 gen_course.py   (writes courses/hs-genetics.json)
Mirrors ~/workspace/learnway/pipeline.mjs prompts/schemas.
"""
import json, sys, urllib.request, urllib.error

sys.path.insert(0, "/opt/hatch/skills/skill-creator/bin")
import dynamic_credentials as dc

HOST = "generativelanguage.googleapis.com"
MODEL = __import__("os").environ.get("GEMINI_MODEL", "gemini-2.5-flash")
TOPIC = "Genetics"
LEVEL = "High school — Grade 9-12 reading level. Assumes middle-school science; reads like a great textbook."
INTERESTS = "sports, music, food, video games"
N_SECTIONS = 5

DESIGNER = """You are an expert instructional designer and subject-matter explainer. You build courses that respect the learner's intelligence: technically rigorous, never dumbed down, but always approachable. You follow learning science:
- Dual coding: pair verbal explanations with concrete visualizable structure.
- Formative assessment: questions that reveal understanding, never trick questions.
- Interest-anchored analogies: explain unfamiliar ideas through things the learner already loves.
- Plain register: short sentences, concrete nouns, every technical term defined on first use unless the level says otherwise."""

PERSONALIZATION = f"""AUDIENCE
- Level: {LEVEL}
- The learner's interests: {INTERESTS}. Weave analogies and examples from these interests through explanations and quiz scenarios wherever they genuinely fit. Never force them.
- Course length: exactly {N_SECTIONS} sections."""

SCHEMAS = {
  "plan": {"type": "object", "properties": {
    "title": {"type": "string"},
    "hook": {"type": "string"},
    "objectives": {"type": "array", "items": {"type": "string"}},
    "prerequisites": {"type": "array", "items": {"type": "string"}},
    "sections": {"type": "array", "items": {"type": "object", "properties": {
      "id": {"type": "string"}, "heading": {"type": "string"},
      "points": {"type": "array", "items": {"type": "string"}}},
      "required": ["id", "heading", "points"]}}},
    "required": ["title", "hook", "objectives", "prerequisites", "sections"]},
  "reading": {"type": "object", "properties": {
    "sections": {"type": "array", "items": {"type": "object", "properties": {
      "id": {"type": "string"}, "heading": {"type": "string"},
      "body": {"type": "string"},
      "questions": {"type": "array", "items": {"type": "object", "properties": {
        "q": {"type": "string"}, "answer": {"type": "string"}, "hint": {"type": "string"}},
        "required": ["q", "answer", "hint"]}}},
      "required": ["id", "heading", "body", "questions"]}}},
    "required": ["sections"]},
  "quizzes": {"type": "object", "properties": {
    "sections": {"type": "array", "items": {"type": "object", "properties": {
      "id": {"type": "string"},
      "questions": {"type": "array", "items": {"type": "object", "properties": {
        "q": {"type": "string"},
        "choices": {"type": "array", "items": {"type": "string"}},
        "answer": {"type": "integer"}, "explain": {"type": "string"}},
        "required": ["q", "choices", "answer", "explain"]}}},
      "required": ["id", "questions"]}}},
    "required": ["sections"]},
  "slides": {"type": "object", "properties": {
    "sections": {"type": "array", "items": {"type": "object", "properties": {
      "id": {"type": "string"}, "title": {"type": "string"},
      "bullets": {"type": "array", "items": {"type": "string"}},
      "notes": {"type": "string"}},
      "required": ["id", "title", "bullets", "notes"]}}},
    "required": ["sections"]},
  "enrichment": {"type": "object", "properties": {
    "audioTitle": {"type": "string"},
    "turns": {"type": "array", "items": {"type": "object", "properties": {
      "speaker": {"type": "string", "enum": ["teacher", "student"]},
      "line": {"type": "string"}}, "required": ["speaker", "line"]}},
    "nodes": {"type": "array", "items": {"type": "object", "properties": {
      "id": {"type": "string"}, "label": {"type": "string"},
      "parent": {"type": ["string", "null"]}, "note": {"type": "string"}},
      "required": ["id", "label", "parent", "note"]}},
    "mnemonics": {"type": "array", "items": {"type": "object", "properties": {
      "for": {"type": "string"}, "aid": {"type": "string"}},
      "required": ["for", "aid"]}}},
    "required": ["audioTitle", "turns", "nodes", "mnemonics"]},
}

def call(prompt_key, user, max_tokens, temperature=0.7, tries=3):
    url = f"https://{HOST}/v1beta/models/{MODEL}:generateContent"
    body = json.dumps({
        "system_instruction": {"parts": [{"text": DESIGNER}]},
        "contents": [{"role": "user", "parts": [{"text": user}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": SCHEMAS[prompt_key],
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }).encode()
    last_err = None
    for attempt in range(tries):
        req = urllib.request.Request(url, data=body, method="POST",
                                     headers={"Content-Type": "application/json"})
        dc.add_surrogate_to_request(req, "custom.gemini", allowed_hosts=(HOST,))
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = json.loads(dc.read_response_body(resp).decode())
        except urllib.error.HTTPError as e:
            code, detail = e.code, e.read().decode()[:200]
            print(f"  attempt {attempt+1}: HTTP {code}", flush=True)
            last_err = f"HTTP {code}: {detail}"
            if e.code in (429, 503):
                import time; time.sleep(20 * (attempt + 1))
                continue
            raise SystemExit(last_err)
        text = "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"])
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            print(f"  attempt {attempt+1}: truncated JSON ({e}), retrying", flush=True)
            last_err = f"truncated JSON: {e}"
            import time; time.sleep(5)
    raise SystemExit(f"gave up: {last_err}")

def main():
    import datetime
    print("1/5 plan…", flush=True)
    plan = call("plan", f"""{PERSONALIZATION}

Design a high-school course on this topic: "{TOPIC}"

Return exactly {N_SECTIONS} sections that build on each other: open with the core mental model, then mechanism, then depth/edge cases, then connections outward. Objectives must be capabilities ("explain X", "predict Y"), never "understand Z". Keep every objective achievable by a grade 9-12 student.""",
                4096, temperature=0.6)
    digest = "\n".join(f"- {s['id']}: {s['heading']}\n  " + "\n  ".join(s["points"]) for s in plan["sections"])

    print("2/5 reading…", flush=True)
    reading = call("reading", f"""{PERSONALIZATION}

Write the immersive reading for the high-school course "{plan['title']}" on "{TOPIC}".
Follow this approved plan exactly — same section ids, headings, and points:

{digest}

For each section: a narrative body (markdown, 250-450 words) that teaches the points in order, opening with the single most surprising or important idea. Weave in the learner's interests for analogies. End each section with 2 embedded check-in questions (with answers and hints).""",
                   16384)

    print("3/5 quizzes…", flush=True)
    quizzes = call("quizzes", f"""{PERSONALIZATION}

Write section quizzes for the high-school course "{plan['title']}" on "{TOPIC}".
Sections:

{digest}

For each section: 3 multiple-choice questions that test application and reasoning, not memorized facts. Wrong options must be plausible mistakes a student could really make. Each needs an explanation of why the right answer is right and what each distractor gets wrong.""",
                   8192)

    print("4/5 slides…", flush=True)
    slides = call("slides", f"""{PERSONALIZATION}

Write the lecture version of the high-school course "{plan['title']}" on "{TOPIC}".
Sections:

{digest}

For each section: a slide title, 5-7 tight bullets (the skeleton of a 5-minute lecture segment), and speaker notes — the conversational 60-second spoken version of those bullets, as if explaining to a smart friend.""",
                   8192)

    print("5/5 enrichment…", flush=True)
    enrichment = call("enrichment", f"""{PERSONALIZATION}

Create the enrichment pack for the high-school course "{plan['title']}" on "{TOPIC}".
Sections:

{digest}

1. Audio lesson: a Socratic dialogue between a teacher and a curious student covering the whole arc of the course. 14-20 turns. The student asks sharp questions, voices common misconceptions, and the teacher corrects with patience and concrete examples drawn from the learner's interests.
2. Mind map: nodes covering every section's key ideas, exactly one root node, every other node naming its parent id.
3. Mnemonics: memory aids for the hardest facts. Skip if nothing genuinely needs one.""",
                   8192)

    course = {
        "meta": {"topic": TOPIC, "level": "highschool", "interests": INTERESTS,
                 "depth": "standard", "model": MODEL, "title": plan["title"],
                 "createdAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                 "version": 1},
        "plan": plan, "reading": reading, "quizzes": quizzes,
        "slides": slides, "enrichment": enrichment,
    }
    out = "/home/hatch/workspace/learnway/courses/hs-genetics.json"
    with open(out, "w") as f:
        json.dump(course, f, indent=2)
    print("wrote", out)

if __name__ == "__main__":
    main()
