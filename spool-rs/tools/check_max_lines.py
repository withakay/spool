#!/usr/bin/env python3

import argparse
import os
from pathlib import Path


def iter_source_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Skip common build/cache dirs.
        dirnames[:] = [
            d
            for d in dirnames
            if d not in {".git", "target", "node_modules"} and not d.startswith(".")
        ]

        for name in filenames:
            if not name.endswith(".rs"):
                continue
            files.append(Path(dirpath) / name)

    return files


def count_lines(path: Path) -> int:
    with path.open("r", encoding="utf-8", errors="replace") as f:
        return sum(1 for _ in f)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fail if Rust source files exceed a line limit."
    )
    parser.add_argument(
        "--max-lines",
        type=int,
        default=1000,
        help="Maximum allowed physical lines per file (default: 1000)",
    )
    parser.add_argument(
        "--root",
        action="append",
        default=[],
        help="Root directory to scan (repeatable). Defaults to ./spool-rs",
    )

    args = parser.parse_args()
    max_lines: int = args.max_lines
    roots = [Path(r) for r in (args.root or ["spool-rs"])]

    offenders: list[tuple[int, Path]] = []
    for root in roots:
        if not root.exists():
            continue
        for path in iter_source_files(root):
            n = count_lines(path)
            if n > max_lines:
                offenders.append((n, path))

    if not offenders:
        return 0

    offenders.sort(key=lambda x: (-x[0], str(x[1])))
    print(f"Found {len(offenders)} Rust files over {max_lines} lines:")
    for n, path in offenders:
        print(f"- {path}: {n}")

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
