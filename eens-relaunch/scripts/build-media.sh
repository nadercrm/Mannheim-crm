#!/usr/bin/env bash
# Baut Videos, Poster und Bilder für den EENS-Relaunch.
# Aufruf: scripts/build-media.sh <ordner-mit-quellen>
#   Quellen: lafamilia.mp4 (EENS_La_Familia_60s_WEB.mp4), tradeitall.mp4 (EENS_Trade_It_All_Weblogo.mp4),
#            assets/*.png|webp (aus eensmusic.com/maison-20261029/)
set -euo pipefail
SRC="$1"; OUT="$(cd "$(dirname "$0")/.." && pwd)/dist/media"; mkdir -p "$OUT"
# Silber-Grading: fast monochrom, leicht kühl, mehr Kontrast
GRADE="eq=contrast=1.14:brightness=-0.035:saturation=0.10:gamma=0.96,colorchannelmixer=rr=0.97:bb=1.04"

# 1) Hero (Desktop, 16:9): unscharfer Hintergrund + scharfes Hochformat-Panel, 4.2s–16.9s des La-Familia-Visuals
HERO_FC="[0:v]trim=start=4.2:end=16.9,setpts=PTS-STARTPTS,fps=24,${GRADE},split[a][b];\
[a]scale=1280:-2,crop=1280:720,gblur=sigma=22,eq=brightness=-0.20[bg];\
[b]scale=-2:720,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*clip(min(X,W-1-X)/90,0,1)'[fg];[bg][fg]overlay=x=800:y=0:format=auto,vignette=angle=PI/4.2,\
fade=t=in:st=0:d=0.5,fade=t=out:st=12.2:d=0.5,format=yuv420p[v]"
ffmpeg -v error -y -i "$SRC/lafamilia.mp4" -filter_complex "$HERO_FC" -map "[v]" -an \
  -c:v libx264 -profile:v high -preset slow -crf 22 -maxrate 3000k -bufsize 6000k -movflags +faststart "$OUT/hero-lafamilia.mp4"
ffmpeg -v error -y -i "$SRC/lafamilia.mp4" -filter_complex "$HERO_FC" -map "[v]" -an \
  -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 -deadline good -cpu-used 2 "$OUT/hero-lafamilia.webm"

# Poster Desktop (Flaggen-Shot, Sekunde 15 der Quelle = 10.8 im Schnitt)
ffmpeg -v error -y -i "$SRC/lafamilia.mp4" -filter_complex "${HERO_FC/fade=t=in:st=0:d=0.5,fade=t=out:st=12.2:d=0.5,/}" -map "[v]" -ss 10.8 -frames:v 1 "$OUT/_hero-poster.png"
# Poster Mobil (Hochformat, gleicher Shot)
ffmpeg -v error -y -ss 15 -i "$SRC/lafamilia.mp4" -frames:v 1 -vf "${GRADE},vignette=angle=PI/4.5" "$OUT/_hero-poster-mobile.png"

# 2) Video-Band: Trade It All (13.0s–17.6s), Letterbox weg, Hochformat 9:13
TIA_FC="[0:v]trim=start=13.0:end=17.6,setpts=PTS-STARTPTS,fps=24,crop=720:1040:0:120,scale=540:-2,${GRADE},vignette=angle=PI/4.5,fade=t=in:st=0:d=0.35,fade=t=out:st=4.25:d=0.35,format=yuv420p[v]"
ffmpeg -v error -y -i "$SRC/tradeitall.mp4" -filter_complex "$TIA_FC" -map "[v]" -an \
  -c:v libx264 -profile:v high -preset slow -crf 22 -maxrate 2000k -bufsize 4000k -movflags +faststart "$OUT/band-tradeitall.mp4"
ffmpeg -v error -y -i "$SRC/tradeitall.mp4" -filter_complex "$TIA_FC" -map "[v]" -an \
  -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 -deadline good -cpu-used 2 "$OUT/band-tradeitall.webm"
ffmpeg -v error -y -ss 15.6 -i "$SRC/tradeitall.mp4" -frames:v 1 -vf "crop=720:1040:0:120,scale=540:-2,${GRADE},vignette=angle=PI/4.5" "$OUT/_band-poster.png"

# Shop-Motiv: Hoodie "EENS LA FAMILIA" (Sekunde 29)
ffmpeg -v error -y -ss 29 -i "$SRC/lafamilia.mp4" -frames:v 1 -vf "${GRADE},vignette=angle=PI/4.5" "$OUT/_shop.png"

python3 -I "$(dirname "$0")/build-images.py" "$SRC" "$OUT"
rm -f "$OUT"/_*.png
ls -la "$OUT"
