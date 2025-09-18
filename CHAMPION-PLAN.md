# Champion Reports Implementation Plan

## Overview

Automatically generate a Reports section that replaces a `(((REPORTS: 2025-09-01 to 2025-12-31)))` placeholder with:

1. Monthly blog posts (current + historical)
2. List of teams that hvae champions assigned to one or more goals
   * For each team, a list of monthly chamption reports

The argument to the comment ("2025-09-01 to 2025-12-31") specifies a date range.

## Target Output Structure

```markdown
# Reports

This section contains automatically generated reports based on the comments left in the goal tracking issues.

These reports were last generated at $CURRENT-DATE-AND-TIME.

## Blog post

These are the main blog posts that are published each month:

* [October](./blog-post-2025-10.md) <!-- last month determined by current month -->
* [September](./blog-post-2025-09.md) <!-- first month determined by argument to the command -->

## Champion reports

These reports include the details only of goals for a particular team.

### Lang team
* [October](./lang/2025-10.md)
* [September](./lang/2025-09.md)

### Compiler team
* [October](./compiler/2025-10.md)
* [September](./compiler/2025-09.md)

... (all teams that have champions in any goal, with monthly reports for each)
```

## Implementation Requirements

### 1. Mdbook Preprocessor Enhancement
- Detect `(((REPORTS: ...)))` placeholder in markdown files
- Replace with generated reports section
- Generate `.md` files and add them as mdbook subchapters
- Research existing goal population mechanism for chapter mutation

### 2. Monthly Blog Posts
- **Format**: Full `cargo rpg updates 2025h2` output in markdown format
- **Scope**: All months within specified date range (inclusive)
- **Current Month**: Include current month as partial report
- **File naming**: `blog-post-YYYY-MM.md`
- **Integration**: Add as subchapters under Reports section

### 3. Champion Reports  
- **Teams**: Any team that has a champion assigned to at least one goal
- **Format**: Same as `cargo rpg updates --with-champion-from {team}` output in markdown
- **File naming**: `{team-name}/YYYY-MM.md` (one file per team per month)
- **File organization**: Each team gets its own folder with monthly reports
- **Team Discovery**: Scan all goals in milestone to find unique champion teams
- **Integration**: Add as subchapters under Reports section, grouped by team

### 4. Technical Details
- **Integration**: Extend existing mdbook preprocessor
- **Update Frequency**: Runs with existing GitHub action (every 30 minutes)
- **Output Location**: Generate `.md` files and register as mdbook chapters
- **Chapter Structure**: Research how goals are currently added as subchapters
- **Styling**: Use mdbook's native markdown rendering

## Implementation Steps

### Phase 1a: Research & Basic Structure
- [x] Modify mdbook preprocessor to detect `(((REPORTS: date-range)))` placeholder
- [x] Parse date range argument (inclusive endpoints) - *Note: parsing implemented in regex, full parsing deferred to Phase 1b*
- [x] Generate basic reports section with timestamp
- [x] Create framework for `.md` file generation

GOAL AT THE END OF PHASE:
* `(((REPORTS: 2025-09-01 to 2025-12-31)))` expands to fixed content with correct structure ✅

### Phase 1b: Champion TOC
- [x] Research how existing goal population adds subchapters to mdbook - *Studied replace_goal_lists_helper pattern*
- [x] Scan goals to discover teams with champions
- [x] Generate champion-specific folder structure (`{team-name}/YYYY-MM.md`) with placeholder content "TBD" - *Links generated, actual files deferred to Phase 4*
- [x] Generate champion team sections in reports with monthly links

GOAL AT THE END OF PHASE:
* `(((REPORTS)))` has correct list of champion files organized by team, but content is placeholder ✅

### Phase 1c: Blog post TOC
- [ ] Determine months to generate based on date range argument
- [ ] Generate blog post entries (`blog-post-YYYY-MM.md`) with placeholder content
- [ ] Include current month as partial report

GOAL AT THE END OF PHASE:
* `(((REPORTS)))` has correct list of blog files but content is placeholder

### Phase 2: Champion Reports
- [ ] Generate champion-specific `.md` files using existing `--with-champion-from` flag
- [ ] Generate separate file for each team for each month in date range

GOAL AT THE END OF PHASE:
* Champion sections exist with real content and are viewable

### Phase 3: Monthly Blog Posts
- [ ] Generate monthly blog post `.md` files using `cargo rpg updates` command
- [ ] Generate separate file for each month in date range
- [ ] Handle current month as partial report

### Phase 4: Table of Contents Integration
- [ ] Add champion report chapters as subchapters to table of contents (organized by team)
- [ ] Add monthly blog post chapters as subchapters to table of contents
- [ ] Ensure proper navigation and linking

### Phase 5: Polish
- [ ] Add proper error handling for date range parsing
- [ ] Optimize performance (caching, etc.)
- [ ] Test with various milestone configurations and date ranges

## Open Questions

1. **Date Range Defaults**: What should happen if no date range is provided in the placeholder?
   - Should it default to the milestone period?
   - Should it be required?

2. **Recycled Issue Handling**: How to identify and handle recycled tracking issues?
   - Look for specific comment patterns?
   - Check issue creation vs milestone dates?

3. **Error Handling**: What should happen if report generation fails?
   - Skip that report?
   - Show error message in reports section?
   - Fail the entire build?

4. **Empty Months**: What should happen for months with no comments/updates?
   - Generate empty report files?
   - Skip those months entirely?
   - Show "No updates this month" message?

## Notes

- The `--with-champion-from` flag implementation is already complete
- Generate `.md` files and integrate as proper mdbook chapters for better styling
- Research existing goal population mechanism for chapter mutation patterns
- Existing GitHub action timing controls update frequency
