# Implementation Tasks

## 1. Agent Manager Core

* Implement `AgentManager`
* Initialize built-in agents
* List agents with metadata
* Manage agent paths

## 2. Agents Explorer Provider

* Tree view implementation
* File opening
* Auto-refresh via filesystem watchers

## 3. VS Code Extension Integration

* Initialize AgentManager on activation
* Register Agents Explorer
* Update `package.json`
* Add Spec Explorer button
* Implement new workflow trigger

## 4. File Edit Confirmation

* Modal confirmation before saving agent files

## 5. File Watching

* Monitor project and user agent directories

## 6. System Prompt Copy

* Copy `spec-workflow-starter.md` if missing

## 7. Commands

* Add refresh agents command

## 8. Error Handling and Logging

* Defensive file operations
* Output channel logging

## 9. Testing

* Unit tests (completed)
* Integration tests (pending)
* Acceptance tests (pending)

---

If you want, the next logical steps would be:

* Converting these into **Cursor rules / commands**
* Normalizing them into **spec-kit canonical format**
* Producing a **single ARCHITECTURE.md** synthesized from all three
* Generating **agent .md templates** directly from these specs

State which direction you want to proceed.
