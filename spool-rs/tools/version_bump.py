#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from pathlib import Path


def bump_workspace_package_version(manifest: Path, stamp: str) -> str:
    text = manifest.read_text(encoding="utf-8").splitlines(True)

    out: list[str] = []
    in_ws_pkg = False
    replaced = False
    new_version: str | None = None

    for line in text:
        if line.strip() == "[workspace.package]":
            in_ws_pkg = True
            out.append(line)
            continue

        if in_ws_pkg and line.lstrip().startswith("[") and line.strip().endswith("]"):
            in_ws_pkg = False

        if in_ws_pkg and not replaced:
            m = re.match(r'^version\s*=\s*"([^"]+)"\s*$', line.strip())
            if m:
                orig = m.group(1)
                base = orig.split("-local.")[0]
                new_version = f"{base}-local.{stamp}"
                out.append(f'version = "{new_version}"\n')
                replaced = True
                continue

        out.append(line)

    if not replaced or not new_version:
        raise SystemExit(f"[workspace.package] version not found in {manifest}")

    manifest.write_text("".join(out), encoding="utf-8")
    return new_version


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--stamp", required=True, help="YYYYMMDDHHMM")
    args = parser.parse_args()

    manifest = Path(args.manifest)
    if not manifest.exists():
        raise SystemExit(f"manifest not found: {manifest}")

    stamp = args.stamp
    if not re.fullmatch(r"\d{12}", stamp):
        raise SystemExit(f"invalid stamp (expected YYYYMMDDHHMM): {stamp}")

    print(bump_workspace_package_version(manifest, stamp))


if __name__ == "__main__":
    main()
