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
            r'#\s+Functional\s+Requirements:\s*(.+)',
            r'#\s+(.+)',
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

def generate_anchor(text):
    """Generate GitHub-style anchor from text."""
    anchor = text.lower()
    anchor = re.sub(r'\.', '', anchor)
    anchor = re.sub(r'[^a-z0-9\s-]', '', anchor)
    anchor = re.sub(r'\s', '-', anchor)
    anchor = anchor.strip('-')
    return anchor

def load_fr_group_names(docs_dir):
    """Load FR group names from functional-requirements.md headings."""
    fr_groups = {}
    fr_file = Path(docs_dir) / "functional-requirements.md"

    try:
        content = fr_file.read_text(encoding='utf-8')
        # Pattern: ## FR-1: Model Management
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
            # Remove trailing period if present
            title = title.rstrip('. ')
            fr_titles[fr_code] = title
    except Exception as e:
        print(f"⚠️  Error loading FR titles: {e}")

    return fr_titles

def load_sr_mapping(docs_dir):
    """Load SR -> FR mapping from system-requirements/*.md files.
    Returns:
        sr_to_fr: dict mapping SR code -> FR code
        sr_titles: dict mapping SR code -> title
        sr_file_map: dict mapping SR code -> filename
        sr_anchors: dict mapping SR code -> anchor
    """
    sr_to_frs = defaultdict(set)  # SR -> set of FR codes
    sr_titles = {}
    sr_file_map = {}
    sr_anchors = {}
    sr_dir = Path(docs_dir) / "system-requirements"

    for sr_file in sorted(sr_dir.glob("*.md")):
        content = sr_file.read_text(encoding='utf-8')
        # Match SR scenario headings: ### SR-2.1: Title or #### SR-2.1: Title
        heading_pattern = r'^(#{3,4})\s+(SR-\d+(?:\.\d+)?):?\s*(.+?)$'
        # Pattern for FR code: - [FR-2.1] (link may continue on next lines)
        fr_pattern = r'\[(FR-\d+\.\d+)\]'

        # We'll process each SR scenario block by finding headings and then looking for FR links after them
        lines = content.splitlines()
        i = 0
        while i < len(lines):
            line = lines[i]
            heading_match = re.match(heading_pattern, line)
            if heading_match:
                sr_code = heading_match.group(2)
                title = heading_match.group(3).strip()
                sr_titles[sr_code] = title
                sr_file_map[sr_code] = sr_file.name
                heading_text = f"{sr_code}: {title}"
                sr_anchors[sr_code] = generate_anchor(heading_text)

                # Look ahead for Functional Requirements section (collect all FR links)
                j = i + 1
                while j < min(i + 50, len(lines)):
                    next_line = lines[j]
                    # Find all FR codes in this line
                    fr_matches = re.findall(fr_pattern, next_line)
                    for fr_code in fr_matches:
                        sr_to_frs[sr_code].add(fr_code)
                    # Stop if we hit another SR scenario heading (### SR- or #### SR-)
                    if re.match(r'^(#{3,4})\s+SR-', next_line):
                        break
                    j += 1

                i = j
                continue
            i += 1

    return sr_to_frs, sr_titles, sr_file_map, sr_anchors

def get_implemented_test_cases(tests_e2e_dir):
    """Scan the e2e test directory and return a set of implemented TC codes (e.g., 'TC-2.1.1').
    Excludes tests that are marked as skipped (test.skip, xit, xdescribe, describe.skip).
    """
    implemented = set()
    e2e_path = Path(tests_e2e_dir)

    if not e2e_path.exists():
        print(f"⚠️  Warning: e2e test directory '{tests_e2e_dir}' does not exist")
        return implemented

    # Pattern to find active test declarations: test('TC-...') or it('TC-...')
    # Captures the TC code in group 1. Excludes test.skip, xit, xdescribe, describe.skip.
    active_test_pattern = re.compile(
        r'(?<!\.)\b(?:test|it)\s*\(\s*[\'"](TC-\d+(?:\.\d+)+)',  # test('TC-...' or it('TC-...
        re.MULTILINE
    )

    # Pattern to detect skip modifiers before test: test.skip, xit, xdescribe
    skip_pattern = re.compile(r'\b(test\.skip|xit|xdescribe)\s*\(', re.MULTILINE)

    # Pattern to detect block-level skips: describe.skip or xdescribe
    skip_block_start_pattern = re.compile(r'^\s*(describe\.skip|xdescribe)\s*\(', re.MULTILINE)

    # Track if we're inside a describe.skip block
    inside_skipped_describe = False

    for spec_file in e2e_path.rglob("*.spec.js"):
        try:
            content = spec_file.read_text(encoding='utf-8')
            lines = content.splitlines()

            # Reset for each file
            inside_skipped_describe = False
            describe_indentation = 0

            # We need to process line by line to track describe.skip blocks
            for line in lines:
                stripped = line.strip()

                # Check for describe.skip or xdescribe at the beginning of a block
                if skip_block_start_pattern.match(line):
                    inside_skipped_describe = True
                    # Track indentation level to know when block ends
                    describe_indentation = len(line) - len(line.lstrip())
                    continue

                # Check if we're exiting a describe block (closing brace at the same or less indentation)
                if inside_skipped_describe and re.match(r'^\s*}', line):
                    current_indent = len(line) - len(line.lstrip())
                    if current_indent <= describe_indentation:
                        inside_skipped_describe = False
                    continue

                # If we're inside a skipped describe block, skip this line
                if inside_skipped_describe:
                    continue

                # Check for skip modifiers in this line (test.skip, xit, xdescribe)
                if skip_pattern.search(line):
                    continue

                # Check for active test declarations
                matches = active_test_pattern.findall(line)
                for tc_code in matches:
                    implemented.add(tc_code)

        except Exception as e:
            print(f"⚠️  Error reading {spec_file}: {e}")

    return implemented

def parse_test_file(filepath, rel_path):
    """Parse a test case file and extract scenarios with their FR mappings.
    Returns:
        scenarios: list of scenario dicts with code, base_tc_code, title, file, anchor
        sr_links: dict with single entry {sr_code: ''} (placeholder)
        fr_codes_per_scenario: not used anymore (FR links removed from test files)
    """
    content = filepath.read_text(encoding='utf-8')
    lines = content.splitlines()
    scenarios = []
    file_link = str(rel_path)

    # Extract SR link at file level (only one per file)
    sr_code = None
    # Use DOTALL to allow newlines between colon and bracket
    sr_pattern = re.compile(r'\*\*System Requirement\*\*:\s*\[(SR-\d+\.\d+)\]', re.DOTALL)
    sr_match = sr_pattern.search(content)
    if sr_match:
        sr_code = sr_match.group(1)

    if not sr_code:
        return [], {}, {}

    sr_links = {sr_code: ''}  # placeholder

    # Scenario heading pattern (look for ## TC-... or ### TC-...)
    heading_pattern = re.compile(r'^(##|###)\s+(TC-\d+(?:\.\d+)+):?\s*(.+)$')

    current_scenario = None
    i = 0
    while i < len(lines):
        line = lines[i]
        heading_match = heading_match = heading_pattern.match(line)
        if heading_match:
            code = heading_match.group(2)
            title = heading_match.group(3).strip()
            # Generate anchor from heading text
            heading_text = re.sub(r'^(#+)\s*', '', line.strip())
            anchor = generate_anchor(heading_text)
            # Extract base TC code (e.g., "TC-1.1" from "TC-1.1.1")
            parts = code.split('.')
            base_tc_code = '.'.join(parts[:2]) if len(parts) >= 2 else code
            scenario = {
                'code': code,
                'base_tc_code': base_tc_code,
                'title': title,
                'file': file_link,
                'anchor': anchor,
            }
            scenarios.append(scenario)
            current_scenario = scenario
        i += 1

    return scenarios, sr_links, {}

def build_mapping(docs_dir, sr_to_frs):
    """Build mapping: FR -> set(SR). Also return fr_group_tcs and fr_scenarios for statistics.
    Only includes SR and TC that are properly linked (SR must have FR mapping).
    Args:
        sr_to_frs: dict mapping SR code -> set of FR codes (from system-requirements)
    Returns:
        mapping: dict FR -> set of SR codes
        fr_group_tcs: dict FR group -> set of base TC codes (for backward compatibility)
        fr_scenarios: dict FR -> set of full TC scenario codes (e.g., TC-2.1.1)
        bound_scenarios: set of all scenario codes that are linked through SR->FR
        orphan_sr_codes: set of SR codes that exist but have no FR mapping
        orphan_tc_codes: set of TC codes whose SR has no FR mapping
    """
    mapping = defaultdict(set)  # FR -> set of SR codes
    fr_group_tcs = defaultdict(set)  # FR group -> set of base TC codes
    fr_scenarios = defaultdict(set)  # FR -> set of full TC scenario codes
    bound_scenarios = set()  # scenarios linked through SR->FR
    orphan_tc_codes = set()  # scenarios whose SR has no FR mapping
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

        # Each test file has one SR link (at file level)
        sr_code = list(sr_links.keys())[0]

        # Check if this SR has any FR mapping
        if sr_code not in sr_to_frs or not sr_to_frs[sr_code]:
            # SR exists but has no FR mapping - TC is orphan
            for scenario in scenarios:
                orphan_tc_codes.add(scenario['code'])
            continue

        fr_codes = sr_to_frs[sr_code]

        # For each FR, add SR mapping and track scenarios
        for fr_code in fr_codes:
            mapping[fr_code].add(sr_code)

            # Track scenarios by FR
            for scenario in scenarios:
                code = scenario['code']
                fr_scenarios[fr_code].add(code)
                bound_scenarios.add(code)
                # Also track by FR group for compatibility (base TC codes like TC-2.1)
                group_num = fr_code.split('-')[1].split('.')[0]
                fr_group = f"FR-{group_num}"
                fr_group_tcs[fr_group].add(scenario['base_tc_code'])

    # Find orphan SR codes: SR that exist in system-requirements but have no FR mapping
    all_sr_codes = set(sr_to_frs.keys())
    bound_sr_codes = set()
    for sr_set in mapping.values():
        bound_sr_codes.update(sr_set)
    orphan_sr_codes = all_sr_codes - bound_sr_codes

    return mapping, fr_group_tcs, fr_scenarios, bound_scenarios, orphan_sr_codes, orphan_tc_codes

def group_frs_by_prefix(fr_titles):
    """Group FR codes by their main number (FR-1 -> [FR-1.1, FR-1.2, ...])."""
    groups = defaultdict(list)
    for fr_code in sorted(fr_titles.keys(), key=lambda x: (int(x.split('-')[1].split('.')[0]), int(x.split('-')[1].split('.')[1]) if '.' in x else 0)):
        group_num = fr_code.split('-')[1].split('.')[0]
        groups[f"FR-{group_num}"].append(fr_code)
    return groups

def generate_requirements_map(mapping, sr_titles, sr_file_map, sr_anchors, fr_titles, fr_group_names, fr_scenarios, implemented_tcs, app_name, docs_dir, bound_scenarios):
    """Generate the markdown content."""
    lines = []
    lines.append(f"# Traceability Matrix: {app_name}")
    lines.append("")
    lines.append("## Summary")
    lines.append("")
    lines.append("This document provides a complete mapping between functional requirements (FR), system requirements")
    lines.append("(SR), and test cases (TC). It acts as the authoritative index for tracking documentation coverage")
    lines.append("and validation status.")
    lines.append("")

    # Group FRs by main number
    groups = group_frs_by_prefix(fr_titles)

    # Build summary statistics for each FR group
    lines.append("| Functional Domain | FR | SR | TC | Done |")
    lines.append("|-------------------|:--:|:--:|:--:|:----:|")

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

        # Collect unique SRs and scenarios for this group
        sr_set = set()
        group_scenarios = set()
        for fr_code in frs_in_group:
            if fr_code in mapping:
                sr_set.update(mapping[fr_code])
            if fr_code in fr_scenarios:
                group_scenarios.update(fr_scenarios[fr_code])

        tc_count = len(group_scenarios)

        # Count implemented scenarios in this group (direct comparison, implemented_tcs contains full codes)
        group_implemented = len(group_scenarios & implemented_tcs)

        sr_count = len(sr_set)

        # Accumulate for total (unique across all groups)
        all_srs_unique.update(sr_set)
        all_scenarios_unique.update(group_scenarios)
        all_scenarios_implemented.update(group_scenarios & implemented_tcs)

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

    # Add total row: only count SR and TC that are bound (linked to FR via SR)
    # Count bound SRs: those that appear in mapping (i.e., have at least one FR)
    bound_sr_codes = set()
    for sr_set in mapping.values():
        bound_sr_codes.update(sr_set)
    total_sr = len(bound_sr_codes)
    total_tc = len(bound_scenarios)
    total_implemented = len(bound_scenarios & implemented_tcs)

    lines.append("| **Total** | **{}** | **{}** | **{}** | **{}** |".format(
        total_fr_count, total_sr, total_tc, total_implemented
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

            lines.append(f"- {fr_link_md}: {fr_title}")

            if fr_code not in mapping:
                lines.append("  - *No system requirements mapped*")
                continue

            sr_codes = sorted(mapping[fr_code], key=lambda sr: (
                int(sr.split('-')[1].split('.')[0]) if '-' in sr and '.' in sr.split('-')[1] else 0,
                int(sr.split('-')[1].split('.')[1]) if '-' in sr and '.' in sr.split('-')[1] and len(sr.split('-')[1].split('.')) > 1 else 0
            ))

            for sr_code in sr_codes:
                sr_title = sr_titles.get(sr_code, sr_code)
                # Use dynamic file mapping with anchor
                sr_file = sr_file_map.get(sr_code, f'sr-{sr_code}.md'.lower())
                sr_anchor = sr_anchors.get(sr_code)
                if sr_anchor:
                    sr_link = f"[{sr_code}](system-requirements/{sr_file}#{sr_anchor})"
                else:
                    sr_link = f"[{sr_code}](system-requirements/{sr_file})"

                lines.append(f"  - {sr_link}: {sr_title}")

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

    print("🔍 Loading SR mapping from system-requirements...")
    sr_to_frs, sr_titles, sr_file_map, sr_anchors = load_sr_mapping(docs_dir)
    print(f"   Loaded {len(sr_titles)} SR titles, {len(sr_to_frs)} SR->FR mappings")

    print("🔍 Building FR -> SR mapping...")
    mapping, fr_group_tcs, fr_scenarios, bound_scenarios, orphan_sr_codes, orphan_tc_codes = build_mapping(docs_dir, sr_to_frs)

    print("🔍 Scanning e2e test directory for implemented tests...")
    implemented_tcs = get_implemented_test_cases(tests_e2e_dir)
    print(f"   Found {len(implemented_tcs)} implemented test case groups:")

    print("📝 Generating requirements map...")
    content = generate_requirements_map(mapping, sr_titles, sr_file_map, sr_anchors, fr_titles, fr_group_names, fr_scenarios, implemented_tcs, app_name, docs_dir, bound_scenarios)

    output_file.write_text(content, encoding='utf-8')
    print(f"✅ Generated {output_file}")

    # Report orphan SRs (SR without any FR mapping)
    if orphan_sr_codes:
        print(f"\n❌ Error: {len(orphan_sr_codes)} SR(s) have no FR mapping:")
        for sr_code in sorted(orphan_sr_codes):
            print(f"   - {sr_code}")
    else:
        print(f"\n✅ All SRs are linked to at least one FR")

    # Report orphan TCs (TC whose SR has no FR mapping)
    if orphan_tc_codes:
        print(f"\n❌ Error: {len(orphan_tc_codes)} TC(s) are not bound to any FR (their SR has no FR mapping):")
        for tc_code in sorted(orphan_tc_codes):
            print(f"   - {tc_code}")
    else:
        print(f"✅ All TCs are bound to FRs through their SR")

    # Calculate statistics for bound items only
    total_sr_links = sum(len(srs) for srs in mapping.values())
    total_sr = len(bound_sr_codes) if 'bound_sr_codes' in locals() else len(sr_titles)  # We'll compute bound_sr below
    bound_sr_codes = set()
    for sr_set in mapping.values():
        bound_sr_codes.update(sr_set)
    total_sr = len(bound_sr_codes)
    total_tc = len(bound_scenarios)
    total_implemented = len(bound_scenarios & implemented_tcs)

    print(f"\n   Total FR-SR links: {total_sr_links}")
    print(f"   FRs covered: {len(mapping)}")
    print(f"   Bound SRs: {total_sr}")
    print(f"   Bound TCs: {total_tc}")
    print(f"   Implemented bound TCs: {total_implemented}")
    print(f"   Coverage: {total_implemented}/{total_tc} ({total_implemented/total_tc*100:.1f}%)" if total_tc > 0 else "   Coverage: N/A")

    return 0

if __name__ == "__main__":
    exit(main())
