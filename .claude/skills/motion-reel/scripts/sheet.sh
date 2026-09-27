#!/bin/bash
# Render up to 6 stills (no motion blur) and tile them into one 3×2 contact sheet for cheap visual QA.
# usage: sheet.sh <reel-dir> <out.png> t1,t2,...   (SUB=4 for motion-blurred stills)
set -e
DIR="$1"; OUT="$(realpath -m "$2")"; TIMES="$3"
cd "$DIR"
FF=${FFMPEG:-$(command -v ffmpeg || python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")}
rm -f out/still-*.png
node render.cjs --stills="$TIMES" --sub="${SUB:-1}" >/dev/null
IN=(); for t in ${TIMES//,/ }; do IN+=(-i "out/still-$t.png"); done
N=$(( ${#IN[@]} / 2 ))
# pad to 6 tiles with the last frame so xstack's fixed 3×2 layout always works
while [ $N -lt 6 ]; do IN+=("${IN[-2]}" "${IN[-1]}"); N=$((N+1)); done
F=""; for i in 0 1 2 3 4 5; do F+="[$i:v]scale=640:-2[v$i];"; done
"$FF" -y -loglevel error "${IN[@]}" -filter_complex "${F}[v0][v1][v2][v3][v4][v5]xstack=inputs=6:layout=0_0|w0_0|w0+w1_0|0_h0|w0_h0|w0+w1_h0[o]" -map "[o]" "$OUT"
rm -f out/still-*.png
echo "$OUT"
