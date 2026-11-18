#!/usr/bin/env bash
# Baut alle Videos (WebM + MP4, stumm, Loop), Poster und Bilder für den EENS-Relaunch.
# Aufruf: scripts/build-media.sh <ordner-mit-quellen>
# Quellen (aus Google Drive, Dateinamen lokal):
#   lafamilia.mp4  = EENS_La_Familia_60s_WEB.mp4
#   tradeitall.mp4 = EENS_Trade_It_All_Weblogo.mp4
#   nado.mp4       = NADO_ALL_IN_40S_V12_CAR_OPEN_EENS_FINAL.mp4
#   lara.mp4       = 2026-11-08_..._LARA_Immer_Leiser_LIPSYNC_SAFE_MOBIL_FINAL.mp4
#   k19922.mp4, k19943.mov = Kling-Clips 19922 / 19943
#   assets/        = Bilder aus eensmusic.com/maison-20261029/
set -euo pipefail
SRC="$1"; HERE="$(cd "$(dirname "$0")" && pwd)"; OUT="$HERE/../dist/media"; mkdir -p "$OUT"
rm -f "$OUT"/*

# Kino-Grading in Farbe: etwas mehr Kontrast, kühle Schatten, Lichter bleiben warm
COLOR="eq=contrast=1.10:brightness=-0.02:saturation=1.05:gamma=0.97,colorbalance=rs=-0.04:gs=0.0:bs=0.07:rh=0.02:bh=-0.02"

enc() { # enc <name> <input-args...> -- <filtergraph>
  local name="$1"; shift; local fc="${!#}"; local args=("${@:1:$#-1}")
  ffmpeg -v error -y "${args[@]}" -filter_complex "$fc" -map "[v]" -an \
    -c:v libx264 -profile:v high -preset slow -crf "${CRF_MP4:-24}" -maxrate "${MAXRATE:-1800k}" -bufsize 4000k -movflags +faststart "$OUT/$name.mp4"
  ffmpeg -v error -y "${args[@]}" -filter_complex "$fc" -map "[v]" -an \
    -c:v libvpx-vp9 -b:v 0 -crf "${CRF_WEBM:-34}" -row-mt 1 -deadline good -cpu-used 2 "$OUT/$name.webm"
}
poster() { # poster <name> <video> <sekunde>
  ffmpeg -v error -y -ss "$3" -i "$OUT/$2.mp4" -frames:v 1 "$OUT/_$1.png"
}

# 1) Hero (Desktop 16:9): unscharfer Hintergrund + scharfes Hochformat-Panel mit weichen Kanten. 4.2–16.9 s.
HERO="[0:v]trim=start=4.2:end=16.9,setpts=PTS-STARTPTS,fps=24,${COLOR},split[a][b];\
[a]scale=1280:-2,crop=1280:720,gblur=sigma=24,eq=brightness=-0.22:saturation=0.9[bg];\
[b]scale=-2:720,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*clip(min(X,W-1-X)/90,0,1)'[fg];\
[bg][fg]overlay=x=800:y=0:format=auto,vignette=angle=PI/4.2,fade=t=in:st=0:d=0.5,fade=t=out:st=12.2:d=0.5,format=yuv420p[v]"
CRF_MP4=22 MAXRATE=3000k CRF_WEBM=32 enc hero-lafamilia -i "$SRC/lafamilia.mp4" "$HERO"
poster hero-poster hero-lafamilia 10.8
ffmpeg -v error -y -ss 15 -i "$SRC/lafamilia.mp4" -frames:v 1 -vf "${COLOR},vignette=angle=PI/4.5" "$OUT/_hero-poster-mobile.png"

# 2) Reel-Clips: einheitlich 2:3 (480x720), eingebrannte Logos unten weggeschnitten
R="scale=480:720,${COLOR},vignette=angle=PI/5,format=yuv420p"
reel() { # reel <name> <filtergraph-bis-[c]> <inputs...>
  local name="$1" fc="$2"; shift 2
  enc "$name" "$@" "${fc};[c]${R}[v]"
}
# La Familia: Flagge + Crew (14–19 s)
reel reel-familia "[0:v]trim=13.6:19.2,setpts=PTS-STARTPTS,fps=24,crop=512:768:0:18[c]" -i "$SRC/lafamilia.mp4"
# Trade It All: Auto im Regen → Nado bei Nacht
reel reel-trade "[0:v]trim=13.0:17.6,setpts=PTS-STARTPTS,fps=24,crop=666:1000:27:120[c]" -i "$SRC/tradeitall.mp4"
# Nado ALL IN: Club (Rot/Gelb) + rote Neon-Tür + blauer Gang
reel reel-club "[0:v]trim=2.1:4.9,setpts=PTS-STARTPTS[x];[0:v]trim=31.0:33.9,setpts=PTS-STARTPTS[y];[x][y]concat=n=2:v=1,fps=24,crop=720:1080:0:0[c]" -i "$SRC/nado.mp4"
# Nado Skyline bei Nacht
reel reel-skyline "[0:v]trim=17.0:19.9,setpts=PTS-STARTPTS[x];[0:v]trim=11.0:12.9,setpts=PTS-STARTPTS[y];[x][y]concat=n=2:v=1,fps=24,crop=720:1080:0:0[c]" -i "$SRC/nado.mp4"
# Lara: Skyline-Rücken + Flügel unter Kronleuchtern
reel reel-lara "[0:v]trim=12.5:16.3,setpts=PTS-STARTPTS[x];[0:v]trim=51.5:55.0,setpts=PTS-STARTPTS[y];[x][y]concat=n=2:v=1,fps=24,crop=720:1080:0:0[c]" -i "$SRC/lara.mp4"
# Villa bei Nacht (Kling 19922)
reel reel-villa "[0:v]trim=0:5.5,setpts=PTS-STARTPTS,fps=24,crop=720:1080:0:40[c]" -i "$SRC/k19922.mp4"
# Maske in Zeitlupe (Kling 19943)
reel reel-mask "[0:v]trim=2.9:4.9,setpts=2*(PTS-STARTPTS),fps=24,crop=440:660:420:20[c]" -i "$SRC/k19943.mov"
# Shop: Hoodie „EENS La Familia“ von hinten (27.6–31.2 s)
reel reel-hoodie "[0:v]trim=27.6:31.2,setpts=PTS-STARTPTS,fps=24,crop=512:768:0:18[c]" -i "$SRC/lafamilia.mp4"

for n in familia trade club skyline lara villa mask hoodie; do poster "reel-$n" "reel-$n" 1.2; done

python3 -I "$HERE/build-images.py" "$SRC" "$OUT"
rm -f "$OUT"/_*.png
du -ch "$OUT"/*.mp4 | tail -1; du -ch "$OUT"/*.webm | tail -1
ls -la "$OUT"
