from app.config import get_settings
from app.program import load_program


def test_program_json_loads_with_plan_values():
    program = load_program(get_settings().program_path)

    assert program.note == "illustrative, confirm with team"
    assert program.annual_earn_cap == 2000
    assert {m.id: m.miles for m in program.missions} == {
        "checkin": 30,
        "boarding": 50,
        "window": 30,
        "arrival": 40,
    }
    assert program.demo_member.starting_balance == 1250
