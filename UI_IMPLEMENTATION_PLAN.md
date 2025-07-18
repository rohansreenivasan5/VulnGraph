# VulnGraph UI Implementation Plan

## Vision Recap
- **Split View:**
  - **Main Panel:** Graph visualization (nodes & relationships)
  - **Right Panel:** Chat interface for querying and results (expandable/closable)
- **Graph Panel:**
  - Initially blank or with a placeholder
  - Populates with nodes and relationships after a query
  - Interactive: zoom, pan, select nodes, highlight relationships
- **Chat Panel:**
  - Modern chat bubble style for queries and answers
  - Each answer has collapsible sections for Reasoning (dropdown) and Raw Query (dropdown)
  - Option to re-run, refine, or expand queries

---

## Step-by-Step Implementation Plan

### 1. **Project Structure & Setup**
- [ ] Create modular directories for `graph`, `chat`, and `ui` components in `src/components/` (if not already present)
- [ ] Set up a split-view layout in `src/app/page.tsx` (or a new layout component)
- [ ] Install a graph visualization library (e.g., `react-force-graph`, `vis-network`, or `cytoscape.js`)

### 2. **Graph Panel Implementation**
- [ ] Create a `GraphPanel` component in `src/components/graph/`
- [ ] Render a placeholder or empty state initially
- [ ] Integrate the chosen graph library to render nodes and relationships
- [ ] Add interactivity: zoom, pan, select nodes, highlight relationships
- [ ] Style nodes and edges (color, size, labels, tooltips)
- [ ] Add logic to update the graph based on query results

### 3. **Chat Panel Implementation**
- [ ] Create a `ChatPanel` component in `src/components/chat/`
- [ ] Refactor chat logic from `page.tsx` into this component
- [ ] Implement chat bubble UI for queries and answers
- [ ] Add collapsible sections for Reasoning and Raw Query in each answer
- [ ] Add actions for re-running, refining, or expanding queries
- [ ] Make the chat panel expandable/closable (responsive design)

### 4. **Connecting Graph and Chat**
- [ ] Define a shared state or context for query results and selected nodes
- [ ] When a query is run, update both the chat and graph panels
- [ ] Allow clicking nodes in the graph to suggest or filter queries in the chat

### 5. **UI/UX Enhancements**
- [ ] Polish styles for a modern, clean look (dark/light mode, spacing, fonts)
- [ ] Add loading, error, and empty states for both panels
- [ ] Ensure accessibility and keyboard navigation
- [ ] Make layout responsive for different screen sizes

### 6. **Testing & Iteration**
- [ ] Test with real data and edge cases
- [ ] Gather feedback and iterate on UX
- [ ] Add unit and integration tests for components

---

## Notes & Recommendations
- **Graph Library:** Start with `react-force-graph` for ease of integration with React and good performance.
- **Componentization:** Keep components small and focused for maintainability.
- **State Management:** Use React context or a state library if the app grows in complexity.
- **Future Extensions:** Consider adding node detail sidebars, export features, or advanced filtering as follow-ups.

---

*This plan is based on the current state of the repo (no existing graph or modular chat components). Adjust as needed if new features or requirements arise.* 