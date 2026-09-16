@echo off
setlocal EnableExtensions
chcp 65001 >nul
title OMORI Web Port Builder

echo ==========================================
echo          OMORI WEB PORT BUILDER
echo ==========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo Git wurde nicht gefunden.
    echo Git wird mit winget installiert...
    winget install --id Git.Git -e --source winget
    echo Bitte diese BAT danach erneut starten.
    pause
    exit /b
)

where python >nul 2>&1
if errorlevel 1 (
    echo Python wurde nicht gefunden.
    echo Python wird mit winget installiert...
    winget install --id Python.Python.3.13 -e --source winget
    echo Bitte diese BAT danach erneut starten.
    pause
    exit /b
)

if not exist "OmoriSource" (
    echo [1/5] Lade OmoriSource herunter...
    git clone https://github.com/Escartem/OmoriSource.git
    if errorlevel 1 (
        echo FEHLER beim Download.
        pause
        exit /b 1
    )
) else (
    echo [1/5] OmoriSource existiert bereits.
)

echo [2/5] Suche RPG Maker Web-Dateien...
set "SOURCE="
if exist "OmoriSource\www\index.html" set "SOURCE=OmoriSource\www"
if not defined SOURCE if exist "OmoriSource\index.html" set "SOURCE=OmoriSource"

if not defined SOURCE (
    echo.
    echo KEIN FERTIGER WEB BUILD GEFUNDEN.
    echo OmoriSource wurde nach "%CD%\OmoriSource" geladen.
    start "" "OmoriSource"
    pause
    exit /b
)

echo [3/5] Erstelle Web-Port...
if exist "web_port" rmdir /s /q "web_port"
mkdir "web_port"
xcopy "%SOURCE%\*" "web_port\" /E /I /H /Y >nul

echo [4/5] Erstelle Touch Controls...
powershell -NoProfile -Command ^
"$js=@'
window.addEventListener('load',function(){
const s=document.createElement('style');
s.textContent='#mobileControls{position:fixed;inset:0;pointer-events:none;z-index:999999}.omoriButton{position:absolute;width:70px;height:70px;border-radius:50%%;border:2px solid rgba(255,255,255,.7);background:rgba(0,0,0,.35);color:white;font-size:20px;font-weight:bold;pointer-events:auto;touch-action:none;user-select:none}#up{left:85px;bottom:155px}#down{left:85px;bottom:15px}#left{left:15px;bottom:85px}#right{left:155px;bottom:85px}#buttonA{right:25px;bottom:100px;width:90px;height:90px}#buttonB{right:125px;bottom:35px}@media(min-width:1000px){#mobileControls{display:none}}';
document.head.appendChild(s);
const c=document.createElement('div');c.id='mobileControls';
c.innerHTML='<button class="omoriButton" id="up">UP</button><button class="omoriButton" id="down">DOWN</button><button class="omoriButton" id="left">LEFT</button><button class="omoriButton" id="right">RIGHT</button><button class="omoriButton" id="buttonA">A</button><button class="omoriButton" id="buttonB">B</button>';
document.body.appendChild(c);
function key(k,t){document.dispatchEvent(new KeyboardEvent(t,{bubbles:true,cancelable:true,keyCode:k,which:k}))}
function bind(id,k){const b=document.getElementById(id);b.addEventListener('pointerdown',e=>{e.preventDefault();key(k,'keydown')});['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,e=>{e.preventDefault();key(k,'keyup')}))}
bind('up',38);bind('down',40);bind('left',37);bind('right',39);bind('buttonA',90);bind('buttonB',88);
});
'@; Set-Content -Path 'web_port\touch.js' -Value $js -Encoding UTF8"

powershell -NoProfile -Command ^
"$p='web_port\index.html';$x=Get-Content $p -Raw;if($x -notmatch 'touch\.js'){$x=$x -replace '</body>','<script src=""touch.js""></script></body>';Set-Content $p $x -Encoding UTF8}"

echo [5/5] Fertig.
echo Starte http://localhost:8000
cd /d "%CD%\web_port"
start "" "http://localhost:8000"
python -m http.server 8000
pause
