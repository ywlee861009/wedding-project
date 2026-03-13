---
name: project-manager
description: Manage the end-to-end development lifecycle of a project. Use this skill to refine user ideas into requirements, create project roadmaps, and generate developer tasks/tickets in a structured format.
---

# Project Manager

This skill provides a structured workflow for refining project ideas, managing development schedules, and creating actionable developer tasks.

## Workflow

### 1. Idea Refinement (아이디어 구체화)
When the user provides an initial idea, follow these steps:
- Ask clarifying questions about core features, target audience, and constraints.
- Create or update `REQUIREMENTS.md` with:
  - **Project Goal**: High-level objective.
  - **Core Features (MVP)**: Essential functionality.
  - **Optional Features (Nice-to-have)**: Post-MVP ideas.
  - **Technical Stack**: Planned languages/frameworks.

### 2. Schedule & Roadmap (일정 관리)
Once requirements are stable, create `ROADMAP.md`:
- Define **Milestones** (e.g., Phase 1: Core Engine, Phase 2: UI, Phase 3: Polish).
- Assign an order of operations and estimated difficulty/priority.

### 3. Ticketing (업무 지시 티켓화)
Break down roadmap items into actionable tasks in `TICKETS.md`:
- Follow the structure in `references/TICKET_TEMPLATE.md`.
- Ensure each ticket has clear **Acceptance Criteria**.
- Group tickets by status: `[ ] To Do`, `[ ] In Progress`, `[x] Done`.

## Resources

- **references/TICKET_TEMPLATE.md**: Standard format for developer tickets.

## Commands for the PM
- **Refine**: Update requirements based on feedback.
- **Plan**: Create or adjust the roadmap.
- **Ticket**: Create new developer stories from the roadmap.
