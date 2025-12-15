#!/bin/bash

# dependency check
if ! command -v mktemp >/dev/null 2>&1; then
    echo 'mktemp not found in PATH. Please install it on your system. Exiting...'
    exit 1
fi
if ! command -v python3 >/dev/null 2>&1; then
    echo 'python3 not found in PATH. Please install it on your system. Exiting...'
    exit 1
fi
if ! command -v fluidsynth >/dev/null 2>&1; then
    echo 'fluidsynth not found in PATH. Please install it on your system. Exiting...'
    exit 1
fi
if ! command -v sox >/dev/null 2>&1; then
    echo 'sox not found in PATH. Please install it on your system. Exiting...'
    exit 1
fi
python3 -c 'import sys,argparse,mido'
exitcode="$?"
if [[ "$exitcode" != "0" ]]; then
    echo 'Please install mido in a python3 environment, or as a user, or globally as a package.'
    echo 'https://pypi.org/project/mido/'
    echo 'Make sure to activate your python3 environment before running this script.'
    echo 'Exiting...'
    exit 1
fi

notes_celesta=("49" "51" "54" "56" "58" "61" "63" "66" "68" "70" "73" "75" "78" "80" "82" "85" "87" "90" "92" "94" "97" "99" "102" "104")
notes_clavi=("25" "27" "30" "32" "34" "37" "39" "42" "44" "46" "49" "51" "54" "56" "58" "61" "63" "66" "68" "70" "73" "75" "78" "80")
notes_swells=("42,46,49" "37,44,49,53" "32,39,44")

soundfont="$1"

if [[ -z "$soundfont" ]]; then
    # Arch Linux
    soundfont="/usr/share/soundfonts/FluidR3_GM.sf2"
    if [[ ! -r "$soundfont" ]]; then
        # Debian
        soundfont="/usr/share/sounds/sf2/FluidR3_GM.sf2"
    fi
fi

if [[ ! -r "$soundfont" ]]; then
    echo "Unable to open soundfont: $soundfont"
    echo 'Please supply a valid soundfont as a first argument, or install the'
    echo 'Fluid (R3) GM SoundFont (default option) using the following command:'
    echo 'Debian/Ubuntu: sudo apt install fluid-soundfont-gm'
    echo 'Arch Linux-based distributions: sudo pacman -S soundfont-fluid'
    echo 'Alternatively, you could download FluidR3_GM.sf2 manually from the'
    echo 'following link and pass the file path to this command as an argument:'
    echo 'http://deb.debian.org/debian/pool/main/f/fluid-soundfont/fluid-soundfont_3.1.orig.tar.gz'
    echo 'Exiting...'
    exit 1
fi

set -u

tempoutdir="$(mktemp -d --suffix="-wikiwaver")"
exitcode="$?"
if [[ -z "$tempoutdir" || ! -d "$tempoutdir" || "$exitcode" != "0" ]]; then
    echo 'Failed to create temporary MIDI file. Exiting...'
    exit 1
fi

set -eo pipefail

tempmidiout="${tempoutdir}/out.mid"
tempwavout="${tempoutdir}/out.wav"

renderdir="public/playback/webaudio-samples"
celestadir="${renderdir}/celesta"
clavidir="${renderdir}/clavi"
swellsdir="${renderdir}/swells"

trap -- 'echo Error occurred; test -d "$tempoutdir" && echo Cleaning up "$tempoutdir"; rm -r "$tempoutdir"; echo Exiting...' ERR
trap -- 'echo; echo Interrupt signal received' INT

if [[ ! -d "$renderdir" ]]; then
    echo 'Please run this script inside the project'"'"'s root directory that contains the "'"$renderdir"'" directory.'
    echo "Run scripts/${0//.\//} in your terminal to run this script inside the project's root directory."
    echo 'Exiting...'
    rm -r "$tempoutdir"
    exit 1
fi

mkdir -p "$celestadir"
mkdir -p "$clavidir"
mkdir -p "$swellsdir"

echo "Using soundfont: $soundfont"

set -x

# celesta
for note in "${notes_celesta[@]}"; do
    echo "$note"
    python3 scripts/gen_midi_tones.py "$note" 8 60 127 0 4 -s "$tempmidiout"
    fluidsynth -i -C no -R no -g 1 -F "$tempwavout" -T "wav" -nq "$soundfont" "$tempmidiout"
    sox "$tempwavout" "${celestadir}/${note}.ogg" silence 1 1 0% -1 0.1 0%
done

# clavi
for note in "${notes_clavi[@]}"; do
    echo "$note"
    python3 scripts/gen_midi_tones.py "$note" 7 60 127 0 4 -s "$tempmidiout"
    fluidsynth -i -C no -R no -g 1 -F "$tempwavout" -T "wav" -nq "$soundfont" "$tempmidiout"
    sox "$tempwavout" "${clavidir}/${note}.ogg" silence 1 1 0% -1 0.1 0%
done

# swells
for note in "${notes_swells[@]}"; do
    echo "$note"
    python3 scripts/gen_midi_tones.py "$note" 89 60 127 0 8 -s "$tempmidiout"
    fluidsynth -i -C no -R no -g 1 -F "$tempwavout" -T "wav" -nq "$soundfont" "$tempmidiout"
    sox "$tempwavout" "${swellsdir}/${note}.ogg" silence 1 1 0% -1 0.1 0%
done

rm -r "$tempoutdir"

# vim: set noexpandtab ts=8 sw=4:
