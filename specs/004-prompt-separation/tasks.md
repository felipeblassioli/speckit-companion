# Implementation Plan – Prompt Separation

## 1. Project Setup and Infrastructure

* Build scripts to convert Markdown to TS modules
* Dependency installation (`gray-matter`, `handlebars`)

## 2. Prompt File Structure

* Create `spec/`, `steering/`, and optional `shared/` directories
* Convert all existing prompts to Markdown with frontmatter

## 3. PromptLoader Service

* Define types
* Implement singleton loader
* Preload and cache compiled templates

## 4. Update Existing Interfaces

* Remove legacy hard-coded prompt files
* Replace usage with PromptLoader
* Initialize loader at extension activation

## 5. Testing and Validation

* Unit tests for parsing, rendering, and errors
* Integration tests for full prompt lifecycle
* Pending: performance and compatibility testing

## 6. Cleanup and Optimization

* Remove all hard-coded prompt strings
* Refactor and document updated code
* Optimize packaging and build configuration

### Implementation Summary

* **Completed**: 16 / 17 tasks
* **Remaining**: performance & compatibility testing
* **Not required**: shared prompt directory (for now)

---

## Suggested next steps

Typical follow-ups after this translation would be:

* Normalize into **canonical Spec-Kit templates**
* Convert into **Cursor rules / commands**
* Generate **PromptLoader ADR**
* Add **environment-aware prompt resolution**
* Formalize **prompt versioning & rollout strategy**

State the next action and I will proceed directly.
