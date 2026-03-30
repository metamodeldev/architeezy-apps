#!/usr/bin/env python3
"""
Generate traceability-matrix.md by analyzing all test case files.
Creates a traceability matrix: FR Group -> FR -> SR -> Individual TC scenarios.
"""

import re
import argparse
from pathlib import Path
from collections import defaultdict

def get_app_name(docs_dir):
    """Extract application name from functional-requirements.md."""
    fr_file = Path(docs_dir) / "functional-requirements.md"

    try:
        content = fr_file.read_text(encoding='utf-8')
        # Try to match: "# Functional Requirements: App Name" or "# App Name"
        patterns = [
            r'#\s+Functional\s+Requirements:\s*(.+)',  # "# Functional Requirements: Architeezy Graph"
            r'#\s+(.+)',  # Just "# App Name" as fallback
        ]

        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                app_name = match.group(1).strip()
                # Clean up: remove trailing colons, etc.
                app_name = app_name.rstrip(': ')
                return app_name

        # Default fallback
        return "Application"
    except Exception as e:
        print(f"⚠️  Error extracting app name: {e}")
        return "Application"

def load_fr_group_names(docs_dir):
    """Load FR group names from functional-requirements.md headings."""
    fr_groups = {}
    fr_file = Path(docs_dir) / "functional-requirements.md"

    try:
        content = fr_file.read_text(encoding='utf-8')
        # Pattern: ## FR-1: Model Management (only the heading line, not multi-line)
        pattern = r'##\s+(FR-\d+):\s*([^\n]+)'
        for match in re.finditer(pattern, content, re.MULTILINE):
            group_code = match.group(1)
            group_name = match.group(2).strip()
            fr_groups[group_code] = group_name
    except Exception as e:
        print(f"⚠️  Error loading FR group names: {e}")

    return fr_groups

def load_fr_titles(docs_dir):
    """Load all FR titles from functional-requirements.md."""
    fr_titles = {}
    fr_file = Path(docs_dir) / "functional-requirements.md"

    try:
        content = fr_file.read_text(encoding='utf-8')
        # Match list items with potential multi-line titles (continuation lines are indented)
        pattern = r'-\s+\*?\*?(FR-\d+(?:\.\d+)?)\*?\*?:\s*(.+?)(?=\n\s*-|\n\s*$|\n##|\Z)'
        for match in re.finditer(pattern, content, re.DOTALL):
            fr_code = match.group(1)
            title = match.group(2).strip()
            # Clean up any internal line breaks/extra whitespace
            title = re.sub(r'\s+', ' ', title)
            fr_titles[fr_code] = title
    except Exception as e:
        print(f"⚠️  Error loading FR titles: {e}")

    return fr_titles

def load_sr_titles(docs_dir):
    """Load all SR titles from system-requirements/*.md files and return both titles and file mapping."""
    sr_titles = {}
    sr_file_map = {}  # Maps SR code -> filename
    sr_dir = Path(docs_dir) / "system-requirements"

    for sr_file in sorted(sr_dir.glob("*.md")):
        content = sr_file.read_text(encoding='utf-8')
        # Match list items with potential multi-line titles (continuation lines are indented)
        pattern = r'-\s+\*?\*?(SR-\d+\.\d+)\*?\*?:\s*(.+?)(?=\n\s*-|\n\s*$|\n##|\Z)'
        for match in re.finditer(pattern, content, re.DOTALL):
            sr_code = match.group(1)
            title = match.group(2).strip()
            # Clean up any internal line breaks/extra whitespace
            title = re.sub(r'\s+', ' ', title)
            sr_titles[sr_code] = title
            sr_file_map[sr_code] = sr_file.name

    return sr_titles, sr_file_map

def get_implemented_test_cases(tests_e2e_dir):
    """Scan the e2e test directory and return a set of implemented TC base codes (e.g., 'TC-1.1')."""
    implemented = set()
    e2e_path = Path(tests_e2e_dir)

    if not e2e_path.exists():
        print(f"⚠️  Warning: e2e test directory '{tests_e2e_dir}' does not exist")
        return implemented

    # Scan all .spec.js files
    for spec_file in e2e_path.rglob("*.spec.js"):
        filename = spec_file.name.lower()
        # Expected pattern: tc-<major>.<minor>.spec.js
        # Extract the tc-<major>.<minor> part
        match = re.match(r'^tc-(\d+\.\d+)\.spec\.js$', filename)
        if match:
            tc_code = f"TC-{match.group(1)}"
            implemented.add(tc_code)
        else:
            # Try alternative pattern: tc-<major>.<minor>.<sub>?.spec.js
            match = re.match(r'^tc-(\d+(?:\.\d+)+)\.spec\.js$', filename)
            if match:
                parts = match.group(1).split('.')
                if len(parts) >= 2:
                    base_code = '.'.join(parts[:2])
                    tc_code = f"TC-{base_code}"
                    implemented.add(tc_code)

    return implemented

def parse_test_file(filepath, rel_path):
    """Parse a test case file and extract scenarios with their FR/SR mappings."""
    content = filepath.read_text(encoding='utf-8')
    lines = content.splitlines()
    scenarios = []
    file_link = str(rel_path)

    # Extract all SR links (typically file-level)
    sr_links = {}
    sr_pattern = re.compile(r'\*\*System Requirement\*\*:\s*\[(SR-\d+\.\d+)\]\(([^)]+)\)')

    # Scenario heading pattern
    heading_pattern = re.compile(r'^(##|###)\s+(TC-\d+(?:\.\d+)+):?\s*(.+)$')

    # Functional Requirements start pattern
    fr_start_pattern = re.compile(r'\*\*Functional Requirements\*\*:')

    current_scenario = None
    i = 0
    while i < len(lines):
        line = lines[i]
        # Check for scenario heading
        heading_match = heading_pattern.match(line)
        if heading_match:
            code = heading_match.group(2)
            title = heading_match.group(3).strip()
            # Extract the full heading text (without leading # symbols) to generate anchor
            heading_text = re.sub(r'^(#+)\s*', '', line.strip())
            # Generate GitHub-style anchor:
            anchor = heading_text.lower()
            anchor = re.sub(r'\.', '', anchor)
            anchor = re.sub(r'[^a-z0-9\s-]', '', anchor)
            anchor = re.sub(r'\s', '-', anchor)
            anchor = anchor.strip('-')
            # Extract base TC code (e.g., "TC-1.1" from "TC-1.1.1")
            base_tc_code = code
            if '.' in code:
                parts = code.split('.')
                # Keep only first two parts: TC-<major>.<minor>
                if len(parts) >= 2:
                    base_tc_code = '.'.join(parts[:2])
            scenario = {
                'code': code,
                'base_tc_code': base_tc_code,
                'title': title,
                'file': file_link,
                'anchor': anchor,
                'fr_codes': []  # will collect FR codes per scenario
            }
            scenarios.append(scenario)
            current_scenario = scenario
            i += 1
            continue

        # Check for SR line
        sr_match = sr_pattern.search(line)
        if sr_match:
            sr_links[sr_match.group(1)] = sr_match.group(2)
            i += 1
            continue

        # Check for Functional Requirements block
        if fr_start_pattern.search(line):
            # Gather the block lines: from this line onward as long as lines are continuation (empty or start with '[' after lstrip)
            block_lines = [line]
            j = i + 1
            while j < len(lines):
                next_line = lines[j]
                stripped = next_line.lstrip()
                if stripped == '' or stripped.startswith('['):
                    block_lines.append(next_line)
                    j += 1
                else:
                    break
            block_text = "\n".join(block_lines)
            # Extract FR codes from block_text
            fr_codes = re.findall(r'\[(FR-\d+\.\d+)\]', block_text)
            if current_scenario is not None:
                current_scenario['fr_codes'].extend(fr_codes)
            # Skip to j
            i = j
            continue

        i += 1

    return scenarios, sr_links, {}

def build_mapping(docs_dir):
    """Build mapping: FR -> SR -> [scenarios]. Also return fr_group_tcs for statistics."""
    mapping = defaultdict(lambda: defaultdict(list))
    fr_group_tcs = defaultdict(set)  # FR group -> set of base TC codes
    test_cases_dir = Path(docs_dir) / "test-cases"

    for test_file in sorted(test_cases_dir.rglob("*.md")):
        rel_path = test_file.relative_to(Path(docs_dir))

        try:
            scenarios, sr_links, _ = parse_test_file(test_file, rel_path)
        except Exception as e:
            print(f"⚠️  Error parsing {test_file}: {e}")
            continue

        if not scenarios or not sr_links:
            continue

        for scenario in scenarios:
            if not scenario['fr_codes']:
                continue
            for fr_code in scenario['fr_codes']:
                for sr_code in sr_links:
                    mapping[fr_code][sr_code].append(scenario)
                    # Track base TC codes by FR group (FR-1 -> TC-1.1, TC-1.2, etc.)
                    group_num = fr_code.split('-')[1].split('.')[0]
                    fr_group = f"FR-{group_num}"
                    fr_group_tcs[fr_group].add(scenario['base_tc_code'])

    return mapping, fr_group_tcs

def group_frs_by_prefix(fr_titles):
    """Group FR codes by their main number (FR-1 -> [FR-1.1, FR-1.2, ...])."""
    groups = defaultdict(list)
    for fr_code in sorted(fr_titles.keys(), key=lambda x: (int(x.split('-')[1].split('.')[0]), int(x.split('-')[1].split('.')[1]) if '.' in x else 0)):
        group_num = fr_code.split('-')[1].split('.')[0]
        groups[f"FR-{group_num}"].append(fr_code)
    return groups

def generate_requirements_map(mapping, sr_titles, sr_file_map, fr_titles, fr_group_names, fr_group_tcs, implemented_tcs, app_name, docs_dir):
    """Generate the markdown content."""
    lines = []
    lines.append(f"# Traceability Matrix: {app_name}")
    lines.append("")
    lines.append("This document provides a complete traceability matrix mapping functional requirements (FR) to system")
    lines.append("requirements (SR) and test cases (TC). It serves as a single source of truth for understanding the")
    lines.append("complete coverage of all requirements and their validation status.")
    lines.append("")

    # Group FRs by main number
    groups = group_frs_by_prefix(fr_titles)

    # Build summary statistics for each FR group
    lines.append("| FR group | FR count | SR count | TC count | Implemented TCs |")
    lines.append("|----------|:--------:|:--------:|:--------:|:---------------:|")

    def group_sort_key(group):
        m = re.match(r'FR-(\d+)', group)
        return int(m.group(1)) if m else 0

    # Collect all unique SRs and test scenarios across ALL groups for the total row
    all_srs_unique = set()
    all_scenarios_unique = set()
    all_scenarios_implemented = set()
    total_fr_count = 0

    for group_num in sorted(groups.keys(), key=group_sort_key):
        frs_in_group = groups[group_num]
        fr_count = len(frs_in_group)
        total_fr_count += fr_count

        # Collect unique SRs and test scenarios for this group
        sr_set = set()
        group_scenarios = set()
        group_implemented_scenarios = set()
        for fr_code in frs_in_group:
            if fr_code in mapping:
                for sr_code in mapping[fr_code]:
                    sr_set.add(sr_code)
                    for scenario in mapping[fr_code][sr_code]:
                        group_scenarios.add(scenario['code'])
                        if scenario['base_tc_code'] in implemented_tcs:
                            group_implemented_scenarios.add(scenario['code'])

        sr_count = len(sr_set)
        tc_count = len(group_scenarios)
        group_implemented = len(group_implemented_scenarios)

        # Accumulate for total (unique across all groups)
        all_srs_unique.update(sr_set)
        all_scenarios_unique.update(group_scenarios)
        all_scenarios_implemented.update(group_implemented_scenarios)

        group_name = fr_group_names.get(group_num, group_num)
        # Generate anchor for linking to group section within this document
        group_key = group_num.split('-')[1]
        if group_name != group_num:
            kebab = re.sub(r'[^a-z0-9]+', '-', group_name.lower()).strip('-')
            anchor = f"fr-{group_key}-{kebab}"
        else:
            anchor = f"fr-{group_key}"
        group_link = f"[{group_num}: {group_name}](#{anchor})"
        lines.append(f"| {group_link} | {fr_count} | {sr_count} | {tc_count} | {group_implemented} |")

    # Add total row with unique counts (SRs and test scenarios may be shared across groups, so unique counts may be less than sum)
    total_srs_unique = len(all_srs_unique)
    total_scenarios_unique = len(all_scenarios_unique)
    total_implemented_unique = len(all_scenarios_implemented)

    lines.append("| **Total** | **{}** | **{}** | **{}** | **{}** |".format(
        total_fr_count, total_srs_unique, total_scenarios_unique, total_implemented_unique
    ))
    lines.append("")

    # Sort groups numerically
    def group_sort_key(group):
        m = re.match(r'FR-(\d+)', group)
        return int(m.group(1)) if m else 0

    for group_num in sorted(groups.keys(), key=group_sort_key):
        # Use both code and name if available
        group_name = fr_group_names.get(group_num, group_num)
        lines.append(f"## {group_num}: {group_name}")
        lines.append("")

        frs_in_group = sorted(groups[group_num], key=lambda x: (int(x.split('-')[1].split('.')[0]), int(x.split('-')[1].split('.')[1]) if '.' in x else 0))

        for fr_code in frs_in_group:
            fr_title = fr_titles.get(fr_code, fr_code)

            # Generate anchor based on group to match test case format: fr-<group-number>-<kebab-group-name>
            group_key = fr_code.split('-')[1].split('.')[0]  # e.g., "1" from "FR-1.1"
            group_code = f"FR-{group_key}"
            group_name_for_anchor = fr_group_names.get(group_code, "")
            if group_name_for_anchor:
                # Convert to kebab case (lowercase, replace non-alphanumeric with hyphen, strip hyphens)
                kebab = re.sub(r'[^a-z0-9]+', '-', group_name_for_anchor.lower()).strip('-')
                anchor = f"fr-{group_key}-{kebab}"
            else:
                anchor = f"fr-{group_key}"

            fr_link_md = f"[{fr_code}](functional-requirements.md#{anchor})"

            lines.append(f"### {fr_link_md}: {fr_title}")
            lines.append("")

            if fr_code not in mapping:
                lines.append("*No test scenarios mapped*")
                lines.append("")
                continue

            sr_mapping = mapping[fr_code]
            # Sort SRs numerically
            def sr_sort_key(sr):
                m = re.match(r'SR-(\d+)\.(\d+)', sr)
                if m:
                    return (int(m.group(1)), int(m.group(2)))
                return (0, 0)

            sorted_srs = sorted(sr_mapping.keys(), key=sr_sort_key)

            for sr_code in sorted_srs:
                sr_title = sr_titles.get(sr_code, sr_code)
                # Use dynamic file mapping instead of hardcoded
                sr_file = sr_file_map.get(sr_code, f'sr-{sr_code}.md'.lower())
                sr_link = f"[{sr_code}](system-requirements/{sr_file})"

                lines.append(f"- {sr_link}: {sr_title}")

                # Deduplicate scenarios
                seen = {}
                for item in sr_mapping[sr_code]:
                    if item['code'] not in seen:
                        seen[item['code']] = item

                sorted_scenarios = sorted(seen.values(), key=lambda s: s['code'])
                for scenario in sorted_scenarios:
                    scenario_link = f"[{scenario['code']}]({scenario['file']}#{scenario['anchor']})"
                    lines.append(f"  - {scenario_link}: {scenario['title']}")

                lines.append("")

    return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description='Generate requirements map from test cases.')
    parser.add_argument('docs_dir', nargs='?', default='docs/graph',
                        help='Path to the documentation directory (default: docs/graph)')
    parser.add_argument('tests_e2e_dir', nargs='?', default='src/graph/tests/e2e',
                        help='Path to the e2e test directory (default: src/graph/tests/e2e)')

    args = parser.parse_args()
    docs_dir = Path(args.docs_dir)
    tests_e2e_dir = args.tests_e2e_dir

    # Validate docs_dir exists
    if not docs_dir.exists():
        print(f"❌ Error: Documentation directory '{docs_dir}' does not exist")
        return 1

    # Get application name from functional-requirements.md
    app_name = get_app_name(docs_dir)
    print(f"📋 Application: {app_name}")

    output_file = docs_dir / "traceability-matrix.md"

    print("🔍 Loading FR group names...")
    fr_group_names = load_fr_group_names(docs_dir)
    print(f"   Loaded {len(fr_group_names)} FR group names")

    print("🔍 Loading FR titles...")
    fr_titles = load_fr_titles(docs_dir)
    print(f"   Loaded {len(fr_titles)} FR titles")

    print("🔍 Loading SR titles...")
    sr_titles, sr_file_map = load_sr_titles(docs_dir)
    print(f"   Loaded {len(sr_titles)} SR titles")

    print("🔍 Building FR -> SR -> TC mapping...")
    mapping, fr_group_tcs = build_mapping(docs_dir)

    print("🔍 Scanning e2e test directory for implemented tests...")
    implemented_tcs = get_implemented_test_cases(tests_e2e_dir)
    print(f"   Found {len(implemented_tcs)} implemented test case groups:")
    for tc in sorted(implemented_tcs):
        print(f"     - {tc}")

    print("📝 Generating requirements map...")
    content = generate_requirements_map(mapping, sr_titles, sr_file_map, fr_titles, fr_group_names, fr_group_tcs, implemented_tcs, app_name, docs_dir)

    output_file.write_text(content, encoding='utf-8')
    print(f"✅ Generated {output_file}")

    total_scenarios = sum(len(v) for fr in mapping.values() for v in fr.values())
    # Calculate unique base TCs across all groups
    all_base_tcs = set()
    for tcs in fr_group_tcs.values():
        all_base_tcs.update(tcs)
    total_base_tcs = len(all_base_tcs)
    total_implemented_base = len(all_base_tcs & implemented_tcs)

    print(f"   Total scenario references: {total_scenarios}")
    print(f"   FRs covered: {len(mapping)}")
    print(f"   Total base TC groups: {total_base_tcs}")
    print(f"   Implemented base TC groups: {total_implemented_base}")
    print(f"   Coverage: {total_implemented_base}/{total_base_tcs} ({total_implemented_base/total_base_tcs*100:.1f}%)" if total_base_tcs > 0 else "   Coverage: N/A")

    return 0

if __name__ == "__main__":
    exit(main())
