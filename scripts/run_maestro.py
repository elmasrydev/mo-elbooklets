#!/usr/bin/env python3
import os
import sys
import subprocess
from pathlib import Path

# Force unbuffered output so logs print immediately in the background runner
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)


def parse_env_yaml(yaml_path: Path) -> dict:
    """Parse key-value pairs from simple YAML env file"""
    env_vars = {}
    if not yaml_path.exists():
        print(f"Warning: env file {yaml_path} not found")
        return env_vars
        
    for line in yaml_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if ':' in line:
            parts = line.split(':', 1)
            key = parts[0].strip()
            value = parts[1].strip()
            # Strip quotes
            if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
                value = value[1:-1]
            env_vars[key] = value
    return env_vars

def main():
    # Set Maestro driver startup timeout to 300s (5 mins) to handle cold-boot xcuitest runner launch times safely
    os.environ["MAESTRO_DRIVER_STARTUP_TIMEOUT"] = "300000"

    if len(sys.argv) < 2:
        print("Usage: python3 scripts/run_maestro.py [prs|dev|prod]")
        sys.exit(1)
        
    target_env = sys.argv[1].lower()
    if target_env not in ('prs', 'dev', 'prod'):
        print(f"Error: invalid environment '{target_env}'. Must be prs, dev, or prod.")
        sys.exit(1)
        
    workspace_dir = Path(__file__).parent.parent.resolve()
    yaml_path = workspace_dir / "e2e" / "env.yaml"
    env_vars = parse_env_yaml(yaml_path)
    
    # Base arguments for Maestro
    base_args = [
        "-e", f"TARGET_ENV={target_env}"
    ]
    
    # Resolve target-specific credentials
    prefix = target_env.upper()
    student_password = env_vars.get(f"{prefix}_STUDENT_PASSWORD", "")
    parent_password = env_vars.get(f"{prefix}_PARENT_PASSWORD", "")
    
    if target_env in ('prs', 'dev'):
        import random
        rand_suffix = "".join(random.choices("0123456789", k=8))
        student_mobile = "010" + "".join(random.choices("0123456789", k=8))
        parent_mobile = "010" + "".join(random.choices("0123456789", k=8))
        # Unique parent email per run so re-runs don't collide on a uniqueness check
        parent_email = f"maestro.parent.{rand_suffix}@example.com"
        print(f"Generated dynamic test numbers for E2E: Student={student_mobile}, Parent={parent_mobile}")
        print(f"Generated dynamic parent email for E2E: {parent_email}")
    else:
        student_mobile = env_vars.get(f"{prefix}_STUDENT_MOBILE", "")
        parent_mobile = env_vars.get(f"{prefix}_PARENT_MOBILE", "")
        parent_email = env_vars.get(f"{prefix}_PARENT_EMAIL", "")

    base_args.extend([
        "-e", f"STUDENT_MOBILE={student_mobile}",
        "-e", f"STUDENT_PASSWORD={student_password}",
        "-e", f"PARENT_MOBILE={parent_mobile}",
        "-e", f"PARENT_PASSWORD={parent_password}",
        "-e", f"PARENT_EMAIL={parent_email}"
    ])
    
    # Add all parsed environment variables as -e arguments
    for key, val in env_vars.items():
        base_args.extend(["-e", f"{key}={val}"])
        
    test_files = [
        # Student auth
        "e2e/auth/01_student-register.yaml",
        "e2e/auth/02_student-login-validation.yaml",
        "e2e/auth/03_student-login.yaml",
        "e2e/auth/06_logout.yaml",
        "e2e/auth/07_forgot-password.yaml",
        # Parent auth (04 registers the run's random parent; 05/08 reuse that mobile)
        "e2e/auth/04_parent-register.yaml",
        "e2e/auth/05_parent-login.yaml",
        "e2e/auth/08_parent-logout.yaml",
    ]

    # Parent<->child linking reuses the student (01) + parent (04) registered this
    # run, so it must run last and only where those registrations happen (non-prod).
    if target_env != 'prod':
        test_files.append("e2e/auth/09_parent-link-child.yaml")

    print(f"Running Maestro tests sequentially for target environment: {target_env}\n")

    # The iOS XCUITest driver crashes intermittently during long sessions (kAXError
    # -25218 / "Request for viewHierarchy failed"). These are infrastructure flakes,
    # not test failures, so a crashed flow is retried on a fresh driver. A genuine
    # assertion failure fails every attempt and is still reported FAILED.
    APP_ID = "com.elbooklets.app"
    MAX_ATTEMPTS = 3
    # Narrow, driver-specific signatures only. Broad strings like "Exception in
    # thread"/"UnknownFailure" also appear on ordinary assertion failures and would
    # make genuine failures get retried 3x with sim reboots. These markers are
    # emitted specifically by the wedged XCUITest driver (and our own timeout-kill).
    CRASH_SIGNATURES = (
        "kAXError",
        "Request for viewHierarchy failed",
        "viewHierarchy failed",
        "Unable to launch",
    )

    def run_flow_capture(cmd, timeout=420):
        """Run maestro, stream output live, and return (returncode, combined_output).
        A watchdog kills the process if it exceeds `timeout` (a wedged XCUITest driver
        hangs instead of exiting); the kill is surfaced as a crash so the caller does a
        hard recovery and retries. 420s comfortably covers the long 09 link flow."""
        import threading
        captured = []
        timed_out = {"hit": False}
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            cwd=str(workspace_dir), bufsize=1, universal_newlines=True,
        )

        def _kill():
            timed_out["hit"] = True
            try:
                process.kill()
            except Exception:
                pass

        watchdog = threading.Timer(timeout, _kill)
        watchdog.start()
        try:
            for line in process.stdout:
                sys.stdout.write(line)
                captured.append(line)
            process.wait()
        finally:
            watchdog.cancel()

        returncode = process.returncode
        if timed_out["hit"]:
            msg = f"\n[runner] flow exceeded {timeout}s and was killed (kAXError hang) — treating as driver crash\n"
            sys.stdout.write(msg)
            captured.append(msg)
            if returncode == 0:
                returncode = 1
        return returncode, "".join(captured)

    def booted_udid():
        """Return the UDID of the first booted simulator, or None."""
        try:
            out = subprocess.run(["xcrun", "simctl", "list", "devices", "booted"],
                                 capture_output=True, text=True).stdout
            import re as _re
            m = _re.search(r"\(([0-9A-Fa-f-]{36})\)\s*\(Booted\)", out)
            return m.group(1) if m else None
        except Exception:
            return None

    def recover_driver(hard=False):
        """Reset between attempts. A soft reset just relaunches the app; a hard reset
        reboots the simulator, which is what clears a fully wedged XCUITest driver
        (kAXErrorInvalidUIElement). The app stays installed and reconnects to Metro."""
        import time
        if hard:
            udid = booted_udid()
            if udid:
                print(f"--- hard recovery: rebooting simulator {udid} ---")
                subprocess.run(["xcrun", "simctl", "shutdown", udid],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(["xcrun", "simctl", "boot", udid],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(["xcrun", "simctl", "bootstatus", udid, "-b"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(["xcrun", "simctl", "launch", "booted", APP_ID],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                time.sleep(8)
                return
        subprocess.run(["xcrun", "simctl", "terminate", "booted", APP_ID],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        time.sleep(5)

    results = {}
    any_failed = False

    for test_file in test_files:
        test_path = workspace_dir / test_file
        if not test_path.exists():
            print(f"Skipping missing test file: {test_file}")
            continue

        cmd = ["maestro", "test"] + base_args + [str(test_path)]
        print(f"=== Running: {test_file} ===")
        print(f"Command: {' '.join(cmd)}\n")

        try:
            for attempt in range(1, MAX_ATTEMPTS + 1):
                returncode, output = run_flow_capture(cmd)

                if returncode == 0:
                    results[test_file] = "PASSED" if attempt == 1 else f"PASSED (retry {attempt})"
                    break

                is_crash = any(sig in output for sig in CRASH_SIGNATURES)
                if attempt < MAX_ATTEMPTS:
                    reason = "driver crash" if is_crash else "failure"
                    print(f"\n--- {test_file} {reason} on attempt {attempt}; "
                          f"recovering and retrying ({attempt + 1}/{MAX_ATTEMPTS}) ---\n")
                    # A driver crash needs a full sim reboot; a plain failure just needs a relaunch.
                    recover_driver(hard=is_crash)
                else:
                    results[test_file] = "FAILED"
                    any_failed = True
        except KeyboardInterrupt:
            print("\nTest run cancelled by user.")
            sys.exit(130)
        except Exception as e:
            print(f"Error running Maestro for {test_file}: {e}")
            results[test_file] = "ERROR"
            any_failed = True

        print("\n" + "="*50 + "\n")

    print("=== E2E Test Execution Summary ===")
    for test_file, status in results.items():
        print(f"{test_file}: {status}")
        
    if any_failed:
        print("\nSome E2E tests FAILED.")
        sys.exit(1)
    else:
        print("\nAll E2E tests PASSED successfully!")
        sys.exit(0)

if __name__ == "__main__":
    main()
