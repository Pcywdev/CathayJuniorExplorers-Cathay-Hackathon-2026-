"""Screenshot the app screens at phone size (393x852) into shots/.

Usage (frontend dev server must be running):
    python tools/shoot.py                      # http://localhost:5173
    python tools/shoot.py --base http://localhost:4173 --routes /child /parent
"""

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "shots"
VIEWPORT = {"width": 393, "height": 852}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:5173")
    parser.add_argument("--routes", nargs="+", default=["/child", "/parent"])
    args = parser.parse_args()

    SHOTS.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT, device_scale_factor=2)
        for route in args.routes:
            page.goto(f"{args.base}{route}", wait_until="networkidle")
            out = SHOTS / f"{route.strip('/').replace('/', '_') or 'root'}.png"
            page.screenshot(path=str(out), full_page=False)
            print(f"saved {out.relative_to(ROOT)}")
        browser.close()


if __name__ == "__main__":
    main()
