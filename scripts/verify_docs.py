#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

# ANSI colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{text.center(60)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*60}{Colors.ENDC}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")

# Regex to match Markdown links containing file:// URLs
# Matches [label](file://path) or [label](file:///path)
LINK_REGEX = re.compile(r'\[([^\]]+)\]\((file:///[^\)]+)\)')

def get_markdown_files(workspace_dir: Path) -> list[Path]:
    """Find all markdown files in the workspace, excluding node_modules and .git"""
    md_files = []
    for root, dirs, files in os.walk(workspace_dir):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules', '.expo')]
        for file in files:
            if file.endswith('.md'):
                md_files.append(Path(root) / file)
    return md_files

def verify_file_links(file_path: Path, workspace_dir: Path) -> tuple[int, int]:
    """
    Verify all file:// links in a markdown file.
    Returns (verified_count, broken_count)
    """
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        print_error(f"Failed to read file {file_path.name}: {e}")
        return 0, 1

    relative_file_path = file_path.relative_to(workspace_dir)
    print(f"{Colors.BOLD}{Colors.BLUE}Scanning: {relative_file_path}{Colors.ENDC}")

    matches = LINK_REGEX.findall(content)
    if not matches:
        print(f"  No file:// links found.")
        return 0, 0

    verified = 0
    broken = 0

    for label, link in matches:
        # Extract the path from the file:// URI
        # Remove file:/// or file:// prefix
        path_str = link.replace('file://', '')
        # Handle triple slash prefix
        if path_str.startswith('/'):
            path_str = path_str[1:]
        
        # On Windows/Mac, resolve absolute paths
        target_path = Path('/' + path_str) if link.startswith('file:///') else Path(path_str)
        
        # We also support absolute paths like /Users/...
        # Verify if the target file/folder exists
        if target_path.exists():
            print(f"  {Colors.GREEN}✓{Colors.ENDC} Link [{label}] -> {target_path.name} exists")
            verified += 1
        else:
            print_error(f"  Broken link [{label}] -> Path does not exist:\n     {target_path}")
            broken += 1

    return verified, broken

def main():
    workspace_dir = Path(__file__).parent.parent.resolve()
    print_header("📝 DOCS-GUARD: MARKDOWN FILE LINK VERIFIER")
    print(f"Workspace: {workspace_dir}")
    
    md_files = get_markdown_files(workspace_dir)
    print(f"Found {len(md_files)} markdown file(s) to scan.\n")

    total_verified = 0
    total_broken = 0

    for md_file in md_files:
        verified, broken = verify_file_links(md_file, workspace_dir)
        total_verified += verified
        total_broken += broken
        print()

    print_header("📊 DOCS-GUARD SUMMARY")
    print(f"Total Markdown Files Scanned: {len(md_files)}")
    print(f"{Colors.GREEN}✅ Valid file:// links: {total_verified}{Colors.ENDC}")
    if total_broken > 0:
        print_error(f"Broken file:// links found: {total_broken}")
        print_error("Docs-guard check: FAILED")
        sys.exit(1)
    else:
        print_success("All file:// links are valid!")
        print_success("Docs-guard check: PASSED ✨")
        sys.exit(0)

if __name__ == "__main__":
    main()
