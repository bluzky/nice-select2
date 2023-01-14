import re
import sys
from pathlib import Path

def failure():
    print("ERROR: \nYou should start your commit message with either 'ADDED: ', 'CHANGED: ' or 'FIXED: '")
    print("Your commit message: "+sys.argv[1])
    exit(1)

file    = 'CHANGELOG.md'
newLine = sys.argv[1]
lines   = newLine.split(': ', 1)
type    = lines[0].lower()
if(len(lines) == 1):
    exit()
text    = lines[1].replace("\n", " ")

# load plugin file
changelog = Path(file).read_text()

total   = re.search(r'## \[Unreleased\] - yyyy-mm-dd([\s\S]*?)## \[', changelog).group(1)
if(type == 'added'):
    added       = re.search(r'(### Added[\s\S]*?)###', total).group(1).rstrip("\n")
    newAdded    = added + "\n- " + text
    newTotal    = total.replace(added, newAdded)
elif(type == 'changed'):
    changed = re.search(r'(### Changed[\s\S]*?)###', total).group(1).rstrip("\n")
    newChanged  = changed + "\n- " + text
    newTotal    = total.replace(changed, newChanged)
elif(type == 'fixed'):
    fixed       = re.search(r'(### Fixed[\s\S]*)', total).group(1).rstrip("\n")
    newFixed    = fixed + "\n- " + text
    newTotal    = total.replace(fixed, newFixed)
elif(type == 'updated'):
    updated     = re.search(r'(### Updated[\s\S]*)', total).group(1).rstrip("\n")
    newUpdated  = updated + "\n- " + text
    newTotal    = total.replace(updated, newUpdated)
elif(type != 'skip' and type != 'skipped' and '' != newLine):
    failure()
else:
    exit()

changelog = changelog.replace(total, newTotal)

# Write changes
f = open(file, "w")
f.write(changelog)
f.close()