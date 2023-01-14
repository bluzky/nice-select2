import re
import sys
from pathlib import Path
import datetime

# Update the changelog with the new release

file        = 'CHANGELOG.md'
newVersion  = sys.argv[1]

# load plugin file
changelog = Path(file).read_text()

# Get the whole unrelease section
try:
    total       = re.search(r'## \[Unreleased\] - yyyy-mm-dd([\s\S]*?)## \[', changelog).group(1)
    newTotal    = total

    # Remove emty sections
    for x in ["Added", "Changed", "Fixed", "Updated"]:
        pattern = r'(### '+x+'[\s\S]*'

        if(x != 'Fixed'):
            pattern = pattern+'?)###'
        else:
            pattern = pattern+')'

        added   = re.search(pattern, total).group(1)

        if(added.rstrip("\n") == '### '+x):
            newTotal    = newTotal.replace(added, '')

    # Update in changelog
    changelog   = changelog.replace(total, newTotal)
except Exception as e:
    pass

# Add new unreleased section
newSection  = "## [Unreleased] - yyyy-mm-dd\n\n### Added\n\n### Changed\n\n### Fixed\n\n### Updated\n\n## [" + newVersion + "] - " + datetime.datetime.now().strftime("%Y-%m-%d")+"\n"
changelog    = changelog.replace('## [Unreleased] - yyyy-mm-dd', newSection)

# Write changes
f = open(file, "w")
f.write(changelog)
f.close()