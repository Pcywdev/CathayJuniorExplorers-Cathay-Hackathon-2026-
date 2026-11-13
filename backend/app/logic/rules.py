"""Rules engine: what one trip event does to a trip (plan.md section 3).

Pure functions only: no I/O, no clock, no database. Every number comes from the
Program passed in (shared/program.json). The router turns a RuleResult into the
API Event shape (docs/api.md) and stores the new state.
"""

from dataclasses import dataclass, field, replace
from typing import Literal

from app.models.program import Mission, Program

Branch = Literal["on_time", "delayed"]

EVENT_TYPES = ("junior_mode_on", "checkin", "boarded", "departed", "delayed", "landed")

# Which mission an event completes. Window Watcher is a child action, not a trip event.
EVENT_MISSION: dict[str, str] = {"checkin": "checkin", "boarded": "boarding", "landed": "arrival"}

# Which story chapter an event unlocks (check-in, boarding, in-flight, landing).
EVENT_CHAPTER: dict[str, int] = {"junior_mode_on": 1, "boarded": 2, "departed": 3, "landed": 4}
DEPARTED_CHAPTER = EVENT_CHAPTER["departed"]


class UnknownMission(ValueError):
    """The mission id isn't in program.json."""


class MissionLocked(ValueError):
    """The trip hasn't reached the point where this mission opens."""


@dataclass(frozen=True)
class TripState:
    cap_used: int
    missions_done: frozenset[str] = frozenset()
    chapters_unlocked: frozenset[int] = frozenset()
    branch: Branch = "on_time"


@dataclass(frozen=True)
class RuleResult:
    state: TripState
    mission: Mission | None  # miles = what was actually awarded after the cap
    chapter_unlocked: int | None
    branch: Branch
    system_lines: list[str] = field(default_factory=list)


def initial_state(program: Program) -> TripState:
    """A new trip starts from the member's miles already earned this year."""
    return TripState(cap_used=program.demo_member.starting_balance)


def capped_award(miles: int, cap_used: int, cap_limit: int) -> int:
    """Miles that fit under the annual cap (never negative)."""
    return max(0, min(miles, cap_limit - cap_used))


def apply_event(state: TripState, event_type: str, program: Program) -> RuleResult:
    """Apply one event: mission check, cap check, chapter unlock, branch switch."""
    if event_type not in EVENT_TYPES:
        raise ValueError(f"Unknown event type: {event_type!r}")

    lines: list[str] = []

    # 1. Mission + cap
    awarded: Mission | None = None
    cap_used = state.cap_used
    missions_done = state.missions_done
    mission_id = EVENT_MISSION.get(event_type)
    if mission_id is not None:
        awarded, cap_used, missions_done = _award(state, _mission(program, mission_id), program, lines)

    # 2. Chapter unlock
    unlocked: int | None = None
    chapters = state.chapters_unlocked
    chapter = EVENT_CHAPTER.get(event_type)
    if chapter is not None and chapter not in chapters:
        unlocked = chapter
        chapters = chapters | {chapter}
        lines.append(f"Chapter {chapter} unlocked")

    # 3. Branch switch (sticky once delayed)
    branch: Branch = state.branch
    if event_type == "delayed" and branch != "delayed":
        lines.append(f"Branch switched: {branch} to delayed")
        branch = "delayed"

    new_state = replace(
        state, cap_used=cap_used, missions_done=missions_done, chapters_unlocked=chapters, branch=branch
    )
    return RuleResult(
        state=new_state, mission=awarded, chapter_unlocked=unlocked, branch=branch, system_lines=lines
    )


def mission_unlocked(state: TripState, mission_id: str) -> bool:
    """Has the trip reached the point where this mission opens? (Done missions count as unlocked.)"""
    departed = DEPARTED_CHAPTER in state.chapters_unlocked
    opens = {
        "checkin": True,
        "boarding": "checkin" in state.missions_done,
        "window": departed,
        "arrival": departed,
    }
    return mission_id in state.missions_done or opens.get(mission_id, False)


def complete_mission(state: TripState, mission_id: str, program: Program) -> RuleResult:
    """The child finished a mission on the phone. Same cap as trip events; whichever comes first pays.

    Never unlocks a chapter or changes the branch: those follow trip events only.
    """
    mission = _mission(program, mission_id)  # raises UnknownMission
    if not mission_unlocked(state, mission_id):
        raise MissionLocked(f"{mission.title} isn't open yet")

    lines: list[str] = []
    awarded, cap_used, missions_done = _award(state, mission, program, lines, by_child=True)
    new_state = replace(state, cap_used=cap_used, missions_done=missions_done)
    return RuleResult(state=new_state, mission=awarded, chapter_unlocked=None, branch=state.branch, system_lines=lines)


def _award(
    state: TripState, mission: Mission, program: Program, lines: list[str], *, by_child: bool = False
) -> tuple[Mission | None, int, frozenset[str]]:
    """Mission + cap check, shared by trip events and child completions. Appends to `lines`."""
    if mission.id in state.missions_done:
        lines.append(f"Mission already completed: {mission.title}")
        return None, state.cap_used, state.missions_done

    limit = program.annual_earn_cap
    miles = capped_award(mission.miles, state.cap_used, limit)
    cap_used = state.cap_used + miles
    lines.append(f"Mission rule passed: {mission.title}" + (" (completed by child)" if by_child else ""))
    if miles == mission.miles:
        lines.append(f"Cap check {cap_used:,} / {limit:,} ✓")
    else:
        lines.append(f"Cap reached: {miles} of {mission.miles} miles awarded")
    return mission.model_copy(update={"miles": miles}), cap_used, state.missions_done | {mission.id}


def _mission(program: Program, mission_id: str) -> Mission:
    for m in program.missions:
        if m.id == mission_id:
            return m
    raise UnknownMission(f"Mission {mission_id!r} missing from program.json")
