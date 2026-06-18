# Synapse - Pitch deck outline

Ten slides. Keep each slide to one idea. Suggested speaker notes in italics.

---

## Slide 1 - Title

**Synapse**
Universal AI Memory over MCP
Build. Innovate. Dominate. - Hackverse X 2026, Track: LLM with MCP

*Open on the landing page hero (the animated memory network).*

## Slide 2 - The problem

Today's AI is brilliant but amnesiac.
- Every chat starts from zero.
- Context is trapped inside one tool.
- You repeat your preferences, stack, and decisions endlessly.

*One sentence: "The intelligence arrived; the continuity did not."*

## Slide 3 - The insight

Memory should be a **shared protocol**, not a per-vendor feature.
The Model Context Protocol already standardizes how AI talks to tools - so memory can be a tool every client plugs into.

## Slide 4 - The solution

**Synapse**: a local-first memory layer exposed over MCP.
Any AI client gains persistent, semantic, cross-tool recall.
- remember -> store durable facts
- recall -> semantic retrieval, any session, any tool

## Slide 5 - Live demo (the moment)

1. In the Playground, tell it: "I prefer dark mode and the Poppins font."
2. Refresh the page (new session).
3. Ask: "What UI preferences do I have?" -> it recalls.
4. Show the same memory on the Dashboard and connected in Cursor.

*This is the wow moment. Spend the most time here.*

## Slide 6 - How it works

- MCP server (stdio + Streamable HTTP) built on the official SDK.
- Embedded `sqlite-vec` vector store.
- On-device embeddings (all-MiniLM-L6-v2) - no API key.
- One shared tool surface powers clients and the in-app agent.

*Show the architecture diagram.*

## Slide 7 - Why it wins (differentiation)

| | ChatGPT memory | Synapse |
| --- | --- | --- |
| Cross-tool | No | Yes (open protocol) |
| Private / local | No | Yes (on-device) |
| Inspectable | No | Yes (dashboard + graph) |
| You own the data | No | Yes |
| Key required | Yes | No |

## Slide 8 - Real and usable today

- Connect your own Cursor with one config block.
- Works offline, key-free, in the browser.
- Genuine MCP server - not a mockup.

## Slide 9 - Roadmap

Namespaces and sharing · automatic summarization and decay · graph analytics · encrypted device-to-device sync · more client adapters.

## Slide 10 - Close

**Synapse - memory that belongs to you.**
Give every AI a lasting memory.
Repo + live demo link.

---

### Judging-criteria cheat sheet
- **Innovation**: memory as an open MCP protocol, not a walled feature.
- **Technical excellence**: real MCP server, dual transports, local vector search, zero-key embeddings.
- **Impact / usability**: solves a universal, daily pain; usable now in real tools.
- **Polish**: animated, responsive, accessible UI; clean architecture; full docs.
