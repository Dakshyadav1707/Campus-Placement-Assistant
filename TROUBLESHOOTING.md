# Troubleshooting Notes

## Backend: uvicorn using global Python packages instead of .venv (Windows/PowerShell)

**Symptom:** After activating `.venv` and running `uvicorn app.main:app --reload`,
Python still imports packages (e.g. `typing_extensions`) from the global
Python 3.13 `site-packages` instead of from `.venv`. This can also surface
later as `uvicorn` reporting a missing `click` dependency, even though
`requirements.txt` was installed.

**Root cause:** A PowerShell `PYTHONPATH` environment variable was set
globally and pointed at the global Python installation's `site-packages`.
`PYTHONPATH` takes priority over the virtual environment's own package
directory, so the venv's isolation was silently broken.

**Fix:**
```powershell
$env:PYTHONPATH=""
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Clearing `PYTHONPATH` for the session forces Python to resolve packages
from `.venv` only. Reinstalling `requirements.txt` afterward ensures any
packages that had only ever been installed globally (e.g. `click`) are
now actually present inside `.venv`.

**If it recurs:** check `echo $env:PYTHONPATH` in PowerShell before
activating the venv. If it's non-empty and points outside the project,
clear it (`$env:PYTHONPATH=""`) before installing dependencies or running
`uvicorn`. You can also add `$env:PYTHONPATH=""` to the top of a small
`run-backend.ps1` script so it happens automatically.
