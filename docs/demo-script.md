# Synapse - Demo video script (90-120 seconds)

Goal: prove, fast, that Synapse gives any AI real cross-session, cross-tool memory. Record at 1920x1080. No emojis on screen. Keep cuts tight.

---

## Pre-flight (before recording)

1. `npm install` then `npm run dev`.
2. Open http://localhost:3000 and let the embedding model finish its first-run download.
3. Optionally seed a few memories on the dashboard ("Seed sample memories") so the graph looks alive.
4. Have Cursor open with the Synapse server configured (see /connect) for the finale.

---

## Shot list

### 0:00-0:12 - Hook (landing page)
- Show the hero with the animated memory network.
- Voiceover: "Every AI is brilliant, but it forgets everything. Synapse fixes that - it gives any AI a lasting memory, over the Model Context Protocol."

### 0:12-0:25 - The problem, then the promise
- Scroll past the "brilliant but amnesiac" section and the six MCP tools.
- VO: "Synapse is a memory server. Any MCP client can store facts and recall them later - semantically, across every tool."

### 0:25-0:55 - The wow moment (Playground)
- Go to /playground. Type: "I prefer dark mode and the Poppins font." Show the `remember` tool chip.
- Type: "Remember that my main project is called Synapse." Show another `remember` chip.
- Refresh the page to prove it is a new session.
- Type: "What do you know about me?" - show the `recall` chip and the answer pulling both facts back.
- VO: "Watch the tool calls. It stored those facts, and after a full refresh, it recalled them - semantically, not by keyword."

### 0:55-1:10 - The dashboard
- Go to /dashboard. Point at the stats, the timeline, and run a semantic search ("what theme do I like").
- Hover the knowledge graph to show related memories linking.
- VO: "Everything lives in a local, private store you can inspect - including a live semantic graph of how memories connect."

### 1:10-1:35 - It is real (connect to Cursor)
- Go to /connect, show the copy-paste config.
- Cut to Cursor: ask it something, show it calling the Synapse `recall` tool and using a memory created earlier in the browser.
- VO: "This is not a mockup. Connect your own Cursor with one config block, and the same memory follows you - cross-tool."

### 1:35-1:50 - Close
- Back to the landing CTA.
- VO: "Local-first. Private. No API key. Synapse - memory that belongs to you."
- End card: project name + repo/demo link.

---

## Voiceover script (clean read)

"Every AI is brilliant, but it forgets everything. Synapse fixes that.
It is a memory server built on the Model Context Protocol, so any AI client - Cursor, Claude, your own agent - can store facts and recall them later, semantically, across every tool.
Watch: I tell it my preferences and my project. I refresh the page - a brand new session. I ask what it knows, and it recalls everything, using the recall tool.
Every memory lives in a local, private store I can browse, search, and see as a living graph.
And it is real: I connect my own Cursor with one config block, and the same memory follows me there.
Local-first. Private. No API key required. Synapse - memory that belongs to you."

---

## Tips
- Show the tool-call chips clearly; they are the proof.
- The refresh between "teach" and "ask" is the most persuasive beat - do not skip it.
- If recording without internet, pre-download the model first; semantic recall then runs fully offline.
