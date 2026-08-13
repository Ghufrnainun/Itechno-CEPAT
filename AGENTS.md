<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Codebase Memory & Auto-Indexing Workflow

- At the start of EVERY session/chat:
  1. **Check & Read Index**: Confirm index status with `codebase-memory-mcp` for the current project directory.
  2. **Auto-Index if Missing**: If the current directory is not yet indexed, execute:
     `npx codebase-memory-mcp cli index_repository --repo-path "."`
  3. **Use Knowledge Graph**: Always prefer graph-based code discovery (`search_graph`, `trace_path`, `get_code_snippet`, `get_architecture`) over manual file searching.
