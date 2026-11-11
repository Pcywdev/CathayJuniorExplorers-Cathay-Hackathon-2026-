"""Rules engine: missions, annual cap, chapter unlock, delay branch (plan.md sections 3 and 6)."""

import pytest

from app.logic.rules import TripState, apply_event, initial_state
from app.models.program import Program
from app.program import get_program


@pytest.fixture
def program() -> Program:
    return get_program()


@pytest.fixture
def start(program) -> TripState:
    return initial_state(program)


def run(state: TripState, program: Program, *types: str) -> TripState:
    for t in types:
        state = apply_event(state, t, program).state
    return state


# --- initial state -----------------------------------------------------------

def test_initial_state_uses_demo_member_balance_as_cap_used(start, program):
    assert start.cap_used == program.demo_member.starting_balance == 1250
    assert start.missions_done == frozenset()
    assert start.chapters_unlocked == frozenset()
    assert start.branch == "on_time"


# --- junior mode on ----------------------------------------------------------

def test_junior_mode_on_unlocks_chapter_1_without_miles(start, program):
    result = apply_event(start, "junior_mode_on", program)

    assert result.mission is None
    assert result.chapter_unlocked == 1
    assert result.state.cap_used == 1250
    assert "Chapter 1 unlocked" in result.system_lines


# --- missions and the cap ----------------------------------------------------

def test_checkin_awards_check_in_champion(start, program):
    result = apply_event(start, "checkin", program)

    assert result.mission is not None
    assert (result.mission.id, result.mission.title, result.mission.miles) == ("checkin", "Check-in Champion", 30)
    assert result.state.cap_used == 1280
    assert "checkin" in result.state.missions_done
    assert result.chapter_unlocked is None


def test_boarded_matches_plan_example_event(start, program):
    """plan.md section 9: after check-in, boarding gives 1,330 / 2,000 and unlocks chapter 2."""
    state = run(start, program, "junior_mode_on", "checkin")
    result = apply_event(state, "boarded", program)

    assert result.mission is not None
    assert (result.mission.id, result.mission.title, result.mission.miles) == ("boarding", "Boarding Badge", 50)
    assert result.state.cap_used == 1330
    assert result.chapter_unlocked == 2
    assert result.branch == "on_time"
    assert result.system_lines == [
        "Mission rule passed: Boarding Badge",
        "Cap check 1,330 / 2,000 ✓",
        "Chapter 2 unlocked",
    ]


def test_landed_awards_arrival_explorer_and_unlocks_final_chapter(start, program):
    state = run(start, program, "junior_mode_on", "checkin", "boarded", "departed")
    result = apply_event(state, "landed", program)

    assert result.mission is not None and result.mission.id == "arrival"
    assert result.mission.miles == 40
    assert result.chapter_unlocked == 4
    assert result.state.cap_used == 1250 + 30 + 50 + 40


def test_departed_unlocks_in_flight_chapter_without_miles(start, program):
    state = run(start, program, "junior_mode_on", "checkin", "boarded")
    result = apply_event(state, "departed", program)

    assert result.mission is None
    assert result.chapter_unlocked == 3


def test_award_is_trimmed_to_what_fits_under_the_cap(program):
    state = TripState(cap_used=1980, missions_done=frozenset(), chapters_unlocked=frozenset(), branch="on_time")
    result = apply_event(state, "boarded", program)

    assert result.mission is not None and result.mission.miles == 20  # 50 earned, 20 fit
    assert result.state.cap_used == 2000
    assert "Cap reached: 20 of 50 miles awarded" in result.system_lines


def test_no_miles_once_cap_is_full_but_mission_still_counts(program):
    state = TripState(cap_used=2000, missions_done=frozenset(), chapters_unlocked=frozenset(), branch="on_time")
    result = apply_event(state, "checkin", program)

    assert result.mission is not None and result.mission.miles == 0
    assert result.state.cap_used == 2000
    assert "checkin" in result.state.missions_done
    assert "Cap reached: 0 of 30 miles awarded" in result.system_lines


def test_repeated_event_never_awards_twice(start, program):
    state = run(start, program, "checkin")
    result = apply_event(state, "checkin", program)

    assert result.mission is None
    assert result.state.cap_used == 1280
    assert "Mission already completed: Check-in Champion" in result.system_lines


def test_repeated_unlock_is_not_reported_again(start, program):
    state = run(start, program, "junior_mode_on", "checkin", "boarded")
    result = apply_event(state, "boarded", program)

    assert result.chapter_unlocked is None


# --- delay branch ------------------------------------------------------------

def test_delayed_switches_branch_without_miles_or_chapter(start, program):
    state = run(start, program, "junior_mode_on", "checkin", "boarded")
    result = apply_event(state, "delayed", program)

    assert result.branch == "delayed"
    assert result.state.branch == "delayed"
    assert result.mission is None
    assert result.chapter_unlocked is None
    assert "Branch switched: on_time to delayed" in result.system_lines


def test_delayed_branch_sticks_for_later_events(start, program):
    state = run(start, program, "junior_mode_on", "checkin", "boarded", "delayed", "departed")
    result = apply_event(state, "landed", program)

    assert result.branch == "delayed"


def test_second_delay_does_not_switch_again(start, program):
    state = run(start, program, "delayed")
    result = apply_event(state, "delayed", program)

    assert result.branch == "delayed"
    assert not any(line.startswith("Branch switched") for line in result.system_lines)


# --- purity and inputs -------------------------------------------------------

def test_apply_event_does_not_mutate_input_state(start, program):
    before = start
    apply_event(start, "checkin", program)

    assert start == before
    assert start.cap_used == 1250


def test_unknown_event_type_is_rejected(start, program):
    with pytest.raises(ValueError, match="Unknown event type"):
        apply_event(start, "teleported", program)


def test_numbers_come_from_program_not_constants(start, program):
    """Change a mission value in the program and the engine follows it."""
    changed = program.model_copy(
        update={"missions": [m.model_copy(update={"miles": 99}) if m.id == "checkin" else m for m in program.missions]}
    )
    result = apply_event(start, "checkin", changed)

    assert result.mission is not None and result.mission.miles == 99
