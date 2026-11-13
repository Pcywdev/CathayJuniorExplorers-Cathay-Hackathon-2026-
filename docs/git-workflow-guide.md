# Git workflow guide

## Stashing instead of committing (no push intended)

```bash
# 1. Stash your uncommitted + untracked changes
git stash push -u -m "wip graduation-score"
```
**What it does:** Takes everything in your working directory that differs from the last commit (`-u` includes untracked files like `docs/backend-walkthrough.md` and `tools/demo_trip.py`) and tucks it away in a hidden stack, resetting your working tree back to a clean state matching `HEAD`. The `-m` just labels the stash so you can find it later if you make more than one.

```bash
# 2. Update your branch pointer to match the latest origin/main
git fetch origin
```
**What it does:** Downloads new commits/refs from GitHub into your local `origin/main` tracking ref. It does **not** touch your working files or current branch — purely updates what your local repo knows about the remote.

```bash
git rebase origin/main
```
**What it does:** Takes your branch and replays it on top of the new `origin/main` tip. If your branch has 0 unique commits ahead of main, this is really just a fast-forward — your branch pointer moves forward, no replaying actually needed.

```bash
# 3. Bring your changes back
git stash pop
```
**What it does:** Takes the most recent stash off the stack, reapplies it onto your now-updated working tree, and removes it from the stash list. If the new commits didn't touch the same files, this applies cleanly with no conflicts.

```bash
# 4. Verify
git status
git stash list   # should be empty now
```

If step 3 does conflict, resolve it like a merge conflict (see below), then `git stash drop` once you've manually confirmed the stash contents were restored correctly — `pop` normally drops it automatically only on clean apply.

---

## Visual 1 — Conflict resolution (rebase)

```
Before:
main:     A---B---C---D          (origin/main, has new commits)
                   \
yours:              E---F        (feat/graduation-score, based on old B)

Step: git fetch                  (origin/main ref updates locally, nothing else moves)

Step: git rebase origin/main
  - git finds common ancestor (B)
  - "unplugs" your commits E, F
  - replays them one by one on top of D
  - if a replayed commit touches the same lines as C/D -> CONFLICT, pauses here

      main:   A---B---C---D
                           \
      yours:                E'---F'   (E and F replayed = new commits E', F')

During a conflict pause:
  <<<<<<< HEAD           <- what's on origin/main (D's version)
  their version of line
  =======
  your version of line
  >>>>>>> E' (your commit being replayed)

  You edit the file to keep what's actually correct -> git add file -> git rebase --continue
  (repeats per conflicting commit, until all of E, F are replayed)

  Escape hatch at any point: git rebase --abort -> back to the "Before" state exactly.
```

**Key concept to remember:** rebase doesn't merge histories together — it *rewrites* your commits as if you'd started from the new tip all along. That's why conflicts show up commit-by-commit instead of all at once, and why a rebased branch needs `--force-with-lease` to push if it was already on the remote (you changed commit SHAs).

---

## Visual 2 — Other collaboration situations

**a) Wrong branch commit → split it off**
```
main:  A---B---C(wrong commit made here, meant for feature branch)

git branch feat/correct-branch     -> tag C with a new branch name
git reset --hard origin/main       -> move "main" pointer back to B (C still alive via feat/correct-branch)

main:  A---B
              \
feat/correct:  C
```
The commit object `C` never dies — `git branch` grabs a second name pointing at it before you rewind the first.

**b) Diverged remote branch → rebase onto remote**
```
origin/feat/x:  A---B---C---D      (teammate pushed C, D)
local feat/x:   A---B---E          (you committed E locally)

git fetch; git rebase origin/feat/x

origin/feat/x:  A---B---C---D
local feat/x:                \
                               E'   (your commit replayed after D)
```

**c) Revert a bad commit on main (safe, non-destructive)**
```
main:  A---B---C(bad)---D

git revert C

main:  A---B---C(bad)---D---C-inv   (new commit that undoes C's changes)
```
History isn't erased — everyone who already pulled `C` just pulls `C-inv` next and ends up correct. Contrast with `reset --hard`, which *removes* commits from the branch pointer and breaks anyone who already has them.

**d) Lost commits → reflog is your safety net**
```
git reflog
  f8a1c2e HEAD@{0}: reset: moving to origin/main
  3b9e0a1 HEAD@{1}: commit: that thing you thought you lost  <- still here!

git checkout 3b9e0a1          # look around
git branch recovery-branch    # pin it to a name before it gets garbage collected
```
**Concept:** nothing is deleted by `reset`/rebase/checkout — only unreferenced. The reflog is a local-only log of every place `HEAD` has pointed, usually kept ~90 days. If a commit SHA shows up in reflog, it's recoverable.

---

## Notes to keep for memory

- **Rebase = rewrite, Merge = combine.** Rebase replays your commits on a new base (clean linear history, but changes SHAs — don't force-push over others' work without `--force-with-lease`). Merge creates a new commit joining two histories (preserves exact history, messier graph, safe to push normally).
- **Stash = temporary shelf, not a commit.** Good for "I need a clean tree for a second" — bad for anything you might want to find weeks later (stashes are easy to lose track of; `git stash list` regularly).
- **Nothing is really gone until garbage collection.** `reset`, `checkout`, abandoned rebases — all recoverable via `git reflog` as long as the commit SHA hasn't been GC'd (default ~90 days unreferenced).
- **`--force` vs `--force-with-lease`.** Plain `--force` overwrites the remote no matter what's there — can silently delete a teammate's just-pushed work. `--force-with-lease` refuses if the remote moved since your last fetch, which is effectively always the safer default.
- **Conflict markers `<<<<<<< / ======= / >>>>>>>`** — top block is always "the thing already there at this point in the operation" (HEAD during merge, the base you're rebasing onto during rebase); bottom block is "the incoming change." Direction flips between merge and rebase, which is a common source of confusion.
- **`git fetch` is always safe.** It only updates your knowledge of the remote (`origin/*` refs); it never touches your branches or working tree. `git pull` is `fetch` + `merge` (or `rebase` with `--rebase`) combined — know which one your pull does, since that's where surprises happen.
