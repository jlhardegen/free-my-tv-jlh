# Tizen-only fork: design

Date: 2026-11-16. Status: draft, waiting for approval. Nothing is deleted or added yet.

## Intent

This is a fork of `simbasjungles/free-my-tv` for one person's Samsung TV (Tizen). The fork should contain only what
builds and installs the Samsung app, and it should stay that way when the fork is synced from upstream.

## Goals

- Remove the Google TV / Android TV app and the LG (webOS) build from the fork.
- Remove the public website (`docs/`) and its GitHub Pages workflow, since the fork doesn't publish one.
- Keep the Samsung app working: `web/`, `tizen/`, and what they need to build.
- A workflow that merges upstream changes and then removes non-Tizen code again, so a sync never brings it back.

## Non-goals

- Changing the Samsung app's behavior or features.
- Changing anything in `web/` or `tizen/` beyond what the build needs.

## Anti-goals

- A sync that silently overwrites the fork's own Tizen changes.
- A sync that deletes Tizen code because it guessed wrong about a conflict.

## Constraints

- `web/` is shared with LG. It stays, even though the LG build goes.
- `config.example.properties`, `tools/translate.py` and the `tizen/` scripts are used by the Samsung build. They stay.
- The fork's `main` is the only branch being changed. Nothing is pushed until you approve the change.

## Approaches

1. **Manual prune, sync by hand.** Delete the files now, and each time you sync, fix up the conflicts yourself. Simple,
   but easy to forget and it breaks on every upstream change to a deleted folder. Rejected.
2. **Manual sync-and-prune workflow (chosen).** A GitHub Actions workflow runs only when you start it by hand. It merges
   `simbasjungles/free-my-tv`'s `main` into the fork, applies the Tizen-only rules, and pushes only if something changed.
3. **`.gitattributes merge=ours` for the removed paths.** Keeps the deleted files deleted on merge, but doesn't remove
   new files upstream adds under those folders, and it's hard to see what happened. Rejected.

Chosen: option 2.

## The rules: one list, two users

`tools/tizen-only.txt` lists what the fork removes: `app/`, `webos/`, `docs/`, `.github/workflows/pages.yml`, the
Android and LG build and test scripts, and so on. Both the workflow and a local script read this same list, so there is
one place to change it.

Files the fork rewrites for Tizen (`README.md`, `CLAUDE.md`, `AGENTS.md`, `tools/check.sh`, `.github/workflows/check.yml`)
are listed as fork-owned in the same file.

## The sync workflow

Runs on demand only (`workflow_dispatch`), never on a schedule or on upstream activity. It has write access to `contents` for `main` only.

1. Check out the fork with full history, add `simbasjungles/free-my-tv` as the `upstream` remote, and fetch its `main`.
2. Run `git merge upstream/main` with no edit.
3. If the merge conflicts, resolve only the cases it can know are right:
   - A conflicted path on the removed list: delete it (`git rm`).
   - A conflicted path on the fork-owned list: keep the fork's version (`git checkout --ours`).
   - Any other conflict: abort the merge and fail the run, with the conflicting files in the log. You resolve it by hand.
4. Run the prune step: delete anything on the removed list that the merge brought back, for example new files upstream
   added under `app/`.
5. If the tree changed, commit ("Sync from upstream, keep Tizen only") and push to `main`. If nothing changed, do nothing.

The workflow commits with the built-in token, so it won't trigger the other workflows. The Samsung check still runs on
its own pushes and pull requests.

## What's left to the builder

- The exact list of files on the removed list. The builder checks each folder and build script before deleting it, and
  confirms that `tools/check.sh web` and the Samsung build still run after the change.
- How the trimmed `README.md` reads: a Samsung-only install guide, with the Samsung section kept as it is today.
- What `CLAUDE.md` and `AGENTS.md` say after the change. They're rewritten to cover only the Tizen build.
- Whether `tests/` has Android-only tests to remove; the web tests stay.

## Calls I made (check these)

- The spec lives at `specs/`, not `docs/superpowers/specs/`, because `docs/` is removed.
- The sync runs only when you start it by hand, so nothing changes on `main` without you asking.
- On an unclear conflict the workflow stops and fails. It does not guess.
- Removing `docs/` also removes the Pages workflow, so the fork has no public website.
