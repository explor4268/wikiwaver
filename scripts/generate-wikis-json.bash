#!/bin/bash
set -euo pipefail

outdir="public/listener"

if [[ ! -d "$outdir" ]]; then
    echo 'Please run this script inside the project'"'"'s root directory that contains the "'"$outdir"'" directory.'
    echo "Run scripts/${0//.\//} in your terminal to run this script inside the project's root directory."
    echo 'Exiting'
    exit 1
fi

outfile="$outdir/wikis.json"
tmpoutfile="${outfile}.new"
trap -- 'echo Error occurred; test -f "$tmpoutfile" && echo Cleaning up "$tmpoutfile"; rm "$tmpoutfile"; echo Exiting' ERR
trap -- 'echo; echo Interrupt signal received' INT

(echo '[' &&
    curl -sL 'https://gitlab.wikimedia.org/repos/movement-insights/canonical-data/-/raw/main/wiki/wikis.tsv' |
    grep -F '	wikipedia	' |
    grep -F '	open	public	public	' |
    sed -E 's#^(.*)	.*	.*	(.*)	.*	.*	.*	.*	.*	.*	(.*)$#{"w":"\1","l":"\2","n":"\3"},#' &&
    echo ']') | sed -z 's#},\n]#}\n]#' > "$tmpoutfile"
mv "$tmpoutfile" "$outfile"
