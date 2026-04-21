# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**たまっぷ (Tamap)** is a bus timetable lookup app for Hosei University students. It shows upcoming/past bus times for three routes (Nishi-Hachioji, Mejirodai, Aihara) and displays estimated arrival times at campus facilities.

## Running the App

No build step — this is a static vanilla JS app.

```bash
python -m http.server 8000
# or
npx http-server
```

Then open `http://localhost:8000` in a browser. Opening `index.html` directly may fail due to ES module CORS restrictions.

## Architecture

**Entry point:** `index.html` loads `js/main.js` as an ES module.

**`js/main.js`** — UI layer and state management
- Global state: `now` (current time), `station` (selected station), `isComingToHosei` (direction)
- `render()` re-renders the bus time display and facility arrival times on every state change
- Station names and facility walk times are hardcoded as mappings at the top of the file

**`js/timeHandlers.js`** — All business logic
- `isHoliday(date)` — checks `Holidays.json`; holidays and Sundays are treated equivalently (no Sunday service on some routes)
- `findNextBuses(...)` / `findPastBuses(...)` — binary search within a day's timetable, with day-boundary crossing logic
- `keioRapid()` — transforms hardcoded per-hour departure minutes into flat bus objects with departure + arrival times per stop

**`js/TimeTable_4_18_23_53.json`** — Pre-built timetable (~1.6MB). Each entry has departure/arrival times per stop, day type, and station/direction flags.

**`js/Holidays.json`** — Maps date strings to Japanese holiday names (including substitute holidays).

## Key Conventions

- Japan Standard Time is UTC+9; this offset is applied manually via `equationOfTime = 9` in `timeHandlers.js`.
- The timetable JSON filename encodes its effective date (`4_18_23_53` = April 18, 23:53). When updating timetable data, rename the file and update the import in `timeHandlers.js`.
- Facility arrival times (economics: +5 min, health: +4 min, sport: +8 min, gym: +15 min) are added to bus arrival time in `main.js` — update `facilitiesTimesMapping` there.
- There is no test suite and no linter configured.
