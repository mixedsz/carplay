// ============================================================
//  cs_carplay  |  ui/main.js  (deobfuscated)
//  Full CarPlay UI logic: music, playlist, settings, car
//  control, autopilot, Siri AI, video player, snake game,
//  stop-watch, cameras, dashboard, parking sensor, RGB.
// ============================================================

'use strict';

// ── State ────────────────────────────────────────────────────
const State = {
    isLoggedIn:         false,
    musicPlaying:       false,
    musicLoop:          false,
    musicVolume:        20,
    currentSong:        { url: '', title: '', artist: '', thumbnail: '', duration: 0 },
    playlist:           [],
    defaultPlaylist:    [],
    settings:           {},
    theme:              'dark',
    wallpaper:          'image/wallpaper/6.jpeg',
    brightness:         50,
    siriInDashboard:    true,
    soundEffects:       true,
    rgbEnabled:         true,
    overlayEnabled:     true,
    positionEnabled:    false,
    zoomLevel:          1.0,
    autoPilotActive:    false,
    hazardActive:       false,
    engineOn:           true,
    headlightOn:        false,
    rgbOn:              false,
    sliderInterval:     null,
    stopwatchRunning:   false,
    stopwatchMs:        0,
    stopwatchTimer:     null,
    lapCount:           0,
    snakeActive:        false,
    snakeGame:          null,
    factoryResetTarget: null,
    uiVisible:          false,
};

// ── NUI fetch helper ─────────────────────────────────────────
function nuiFetch(endpoint, data) {
    return fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body:    JSON.stringify(data || {}),
    }).then(r => r.json()).catch(() => ({ status: 'error' }));
}

// ── Sound effects ─────────────────────────────────────────────
function playSound(name) {
    if (!State.soundEffects) return;
    const sounds = {
        menu:          'sound/menu.mp3',
        autopilot_on:  'sound/autopilot_on.mp3',
        autopilot_off: 'sound/autopilot_off.mp3',
        autopilot_err: 'sound/autopilot_error.mp3',
    };
    if (!sounds[name]) return;
    const audio  = new Audio(sounds[name]);
    audio.volume = 0.5;
    audio.play().catch(() => {});
}

// ── In-UI notification toast ──────────────────────────────────
function showNotification(title, msg, iconSrc) {
    const $notif = $('.notification-container');
    if (iconSrc) $('.car-play-notification-icon').attr('src', iconSrc);
    $('.notify-title').text(title || '');
    $('.notify-msg').text(msg   || '');

    $notif.stop(true).show()
          .addClass('animate__fadeInDown')
          .removeClass('animate__fadeOutUp');

    clearTimeout($notif.data('hideTimer'));
    $notif.data('hideTimer', setTimeout(() => {
        $notif.removeClass('animate__fadeInDown').addClass('animate__fadeOutUp');
        setTimeout(() => $notif.hide().removeClass('animate__fadeOutUp'), 600);
    }, 3000));
}

// ── Theme ─────────────────────────────────────────────────────
function applyTheme(theme) {
    State.theme = theme;
    const $w    = $('.wrapper');
    const $mini = $('.mini-ui-draggable');
    if (theme === 'light') {
        $w.removeClass('dark-mode').addClass('light-mode');
        $mini.removeClass('dark-mode').addClass('light-mode');
    } else {
        $w.removeClass('light-mode').addClass('dark-mode');
        $mini.removeClass('light-mode').addClass('dark-mode');
    }
}

function applyBrightness(val) {
    State.brightness = parseInt(val);
    $('.wrapper').css('filter', `brightness(${State.brightness / 100})`);
}

function applyWallpaper(src) {
    State.wallpaper = src;
    $('.home-background').attr('src', src);
}

function applyZoom(level) {
    State.zoomLevel = level;
    $('.draggable').css('transform', `scale(${level})`);
    $('#zoomLevel').text(level.toFixed(1));
}

// ── Screen navigation ─────────────────────────────────────────
const Screens = {
    music:      '.music-app',
    playlist:   '.playlist-app',
    carinfo:    '.car-details-app',
    carcontrol: '.vehicle-control-app',
    video:      '.video-app',
    settings:   '.settings-app',
    appearance: '.appearance-setting',
    wallpaper:  '.wallpaper-settings',
    factory:    '.factory-settings',
    stopwatch:  '.stop-watch-app',
    snake:      '.snake-game-app',
    siri:       '.siri-app',
    dashboard:  '.dashboard-app',
};
const HomeSelectors = '.left-slider, .main-slider-home, .main-slider-apps';

function hideAllScreens() {
    Object.values(Screens).forEach(sel => $(sel).hide());
    $(HomeSelectors).hide();
}

function showScreen(name) {
    playSound('menu');
    hideAllScreens();

    if (name === 'home') {
        $('.left-slider').show();
        $('.main-slider-home').show();
        $('.main-slider-apps').show()
            .addClass('animate__slideInUp')
            .one('animationend', function () {
                $(this).removeClass('animate__slideInUp');
            });
    } else if (Screens[name]) {
        $(Screens[name]).show();
    }
}

// ── Clock ─────────────────────────────────────────────────────
function updateTime() {
    const now = new Date();
    const str = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    $('.left-time-text').text(str);
    $('.time-cont-title').text(str);
    $('.dashboard-time').text(str);
}
setInterval(updateTime, 10000);
updateTime();

// ── Music helpers ─────────────────────────────────────────────
function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function setMusicUI(song) {
    const title     = song.title     || 'Unknown';
    const artist    = song.artist    || 'Music Player';
    const thumbnail = song.thumbnail || 'image/fm.jpeg';

    // Main music app
    $('.music-song-title p').text(title);
    $('.music-song-subtitle p').text(artist);
    $('.music-thumbnail').attr('src', thumbnail);
    $('.bg-music-app').attr('src', thumbnail);

    // Home mini card
    $('.music-card-title').text(title);
    $('.music-card').attr('src', thumbnail);

    // Overlay
    $('.mini-song-title span').text(title);
    $('.mini-ui-image-rotate').attr('src', thumbnail);

    if (song.duration) {
        $('#end-time').text(formatTime(song.duration)).data('duration', song.duration);
        $('#slider').prop('max', song.duration);
    }
}

function setPlayingState(playing) {
    State.musicPlaying = playing;
    const cls = playing ? 'fa-pause' : 'fa-play';
    $('.music-stop, .menu-music-stop').removeClass('fa-play fa-pause').addClass(cls);

    if (playing) {
        $('.mini-ui-image-rotate').addClass('rotating');
        if (State.overlayEnabled) $('.mini-ui-draggable').show();
        startSliderPoll();
    } else {
        $('.mini-ui-image-rotate').removeClass('rotating');
        stopSliderPoll();
        if (!State.overlayEnabled) $('.mini-ui-draggable').hide();
    }
}

function startSliderPoll() {
    stopSliderPoll();
    State.sliderInterval = setInterval(async () => {
        const res = await nuiFetch('/musicTimeStamp', {});
        if (!res || res.status !== 'ok' || res.timestamp == null) return;
        const ts  = res.timestamp;
        const dur = parseFloat($('#end-time').data('duration')) || 0;
        $('#start-time').text(formatTime(ts));
        if (dur > 0) {
            const pct = (ts / dur) * 100;
            $('#slider').val(pct);
            $('.mini-ui-length').val(pct);
        }
    }, 1000);
}

function stopSliderPoll() {
    if (State.sliderInterval) {
        clearInterval(State.sliderInterval);
        State.sliderInterval = null;
    }
}

async function playMusic(url) {
    if (!url) return;

    // Resolve metadata from noembed
    let meta = {};
    try {
        meta = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
                     .then(r => r.json());
    } catch (_) {}

    State.currentSong = {
        url:       url,
        title:     meta.title        || 'Unknown',
        artist:    meta.author_name  || 'Unknown',
        thumbnail: meta.thumbnail_url || 'image/fm.jpeg',
        duration:  0,
    };

    setMusicUI(State.currentSong);
    await nuiFetch('/playMusic', State.currentSong);
    setPlayingState(true);
}

async function stopMusic() {
    await nuiFetch('/stopMusic', {});
    setPlayingState(false);
}

// ── Playlist ──────────────────────────────────────────────────
function renderPlaylist(songs) {
    State.playlist = songs || [];
    const $mid = $('.playlist-middle');
    $mid.empty();

    if (!State.playlist.length) {
        $mid.append('<p style="text-align:center;padding:20px;opacity:0.5;">No saved songs</p>');
        return;
    }

    State.playlist.forEach(song => {
        const thumb = song.thumbnail || 'image/fm.jpeg';
        const $item = $(`
            <div class="playlist-song" data-url="${escHtml(song.url)}">
                <div class="playlist-song-img">
                    <div class="saved-song-img"><img src="${escHtml(thumb)}"></div>
                </div>
                <div class="playlist-song-title">
                    <h1 class="saved-music-title">${escHtml(song.title || 'Unknown')}</h1>
                    <h4 class="saved-sub-artist">${escHtml(song.artist || 'Unknown')}</h4>
                </div>
                <div class="playlist-song-btns">
                    <i class="fa-solid fa-play saved-icon-play"></i>
                    <i class="fa-solid fa-trash-can saved-icon-delete"></i>
                </div>
            </div>
        `);
        $item.find('.saved-icon-play').on('click', () => {
            showScreen('music');
            playMusic(song.url);
        });
        $item.find('.saved-icon-delete').on('click', () => {
            nuiFetch('/removeFromPlaylist', { url: song.url });
        });
        $mid.append($item);
    });
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Settings ──────────────────────────────────────────────────
function saveSettings() {
    nuiFetch('/saveSettings', {
        theme:           State.theme,
        wallpaper:       State.wallpaper,
        brightness:      State.brightness,
        siriInDashboard: State.siriInDashboard,
        soundEffects:    State.soundEffects,
        rgbEnabled:      State.rgbEnabled,
        overlayEnabled:  State.overlayEnabled,
        zoomLevel:       State.zoomLevel,
        volume:          State.musicVolume,
        loggedIn:        State.isLoggedIn,
    });
}

function applySettings(s) {
    if (!s) return;
    if (s.theme       != null) applyTheme(s.theme);
    if (s.wallpaper   != null) applyWallpaper(s.wallpaper);
    if (s.brightness  != null) { applyBrightness(s.brightness); $('#brightslider').val(s.brightness); }
    if (s.zoomLevel   != null) applyZoom(parseFloat(s.zoomLevel));
    if (s.volume      != null) { State.musicVolume = s.volume; $('.volume-slider').val(s.volume); }
    if (s.siriInDashboard != null) { State.siriInDashboard = s.siriInDashboard; $('#checkbox-siri').prop('checked', s.siriInDashboard); }
    if (s.soundEffects    != null) { State.soundEffects    = s.soundEffects;    $('#checkbox-sound').prop('checked', s.soundEffects); }
    if (s.rgbEnabled      != null) { State.rgbEnabled      = s.rgbEnabled;      $('#checkbox-rgb').prop('checked', s.rgbEnabled); }
    if (s.overlayEnabled  != null) {
        State.overlayEnabled = s.overlayEnabled;
        $('#checkbox-minimized').prop('checked', s.overlayEnabled);
        if (s.overlayEnabled && State.musicPlaying) $('.mini-ui-draggable').show();
        else if (!s.overlayEnabled)                 $('.mini-ui-draggable').hide();
    }
    if (s.loggedIn != null) { State.isLoggedIn = s.loggedIn; updateLoginUI(); }
}

function updateLoginUI() {
    if (State.isLoggedIn) {
        $('.login-user-title').text('Welcome Back!');
        $('.sign-text').text('Tap to logout');
        $('.settings-box.login-box').attr('login', 'true');
    } else {
        $('.login-user-title').text('Welcome, User!');
        $('.sign-text').text('Sign in to your Car Play');
        $('.settings-box.login-box').attr('login', 'false');
    }
}

// ── Vehicle data ──────────────────────────────────────────────
function updateVehicleData(data) {
    if (!data) return;
    if (data.body   != null) $('.body_health').text(data.body   + '%');
    if (data.fuel   != null) $('.fuel_health').text(data.fuel   + '%');
    if (data.engine != null) $('.engine_health').text(data.engine + '%');
    if (data.vehName)        $('.car-name-cont').text(data.vehName);
    if (data.speed  != null) $('.dashboard-speed-box h2').text(data.speed);
    if (data.rpm    != null) $('.dashboard-rpm-box h2').text(data.rpm);
    if (data.gear   != null) $('.dashboard-gear-text h2').text('Gear ' + data.gear);
    if (data.street)         { $('.dashboard-location-title').text(data.street); $('.location-title-text').text(data.street); }
    if (data.distance != null) {
        const lbl = (data.unit || 'Km');
        $('.dashboard-distance-title').text(data.distance + lbl);
        $('.maps-distance span').text(data.distance + lbl);
    }
}

// ── Autopilot ─────────────────────────────────────────────────
async function requestAutoPilot() {
    const wpRes = await nuiFetch('/autoPilot', { action: 'getWaypoint' });
    if (!wpRes || wpRes.status !== 'ok') {
        playSound('autopilot_err');
        showNotification('AutoPilot', 'Mark a destination on the map first.', 'image/apps/my-shortcuts.png');
        return;
    }
    const startRes = await nuiFetch('/autoPilot', { action: 'start', coords: wpRes.coords });
    if (startRes && startRes.status === 'ok') {
        State.autoPilotActive = true;
        playSound('autopilot_on');
        setAutoPilotUI(true);
    } else {
        playSound('autopilot_err');
    }
}

async function doStopAutoPilot() {
    await nuiFetch('/autoPilot', { action: 'stop' });
    State.autoPilotActive = false;
    playSound('autopilot_off');
    setAutoPilotUI(false);
}

function setAutoPilotUI(active) {
    if (active) {
        $('.dashboard-start-container h5').text('Stop Auto Pilot');
        $('.dashboard-start-container').addClass('ap-active');
        $('.dashboard-distance-stop-container').show();
    } else {
        $('.dashboard-start-container h5').text('Start Auto Pilot');
        $('.dashboard-start-container').removeClass('ap-active');
    }
}

// ── Car control toggle ────────────────────────────────────────
function carControlBtn($btn, type) {
    const $bar = $btn.find('.icon-active-bar');
    nuiFetch('/carControl', { type }).then(res => {
        if (!res || res.status !== 'ok') return;
        $bar.css('background', res.on ? '#00c853' : '');
    });
}

// ── Stopwatch ─────────────────────────────────────────────────
function fmtSw(ms) {
    const cs   = Math.floor((ms % 1000) / 10);
    const secs = Math.floor(ms / 1000) % 60;
    const mins = Math.floor(ms / 60000);
    return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(cs).padStart(2,'0')}`;
}

// ── Snake game ────────────────────────────────────────────────
function initSnakeGame(container) {
    const SIZE = 20, W = 300, H = 300, SPEED = 150;
    container.innerHTML = `
        <canvas id="snakeCanvas" width="${W}" height="${H}"
            style="background:#1a1a2e;border:2px solid #444;display:block;margin:20px auto 0;border-radius:4px;"></canvas>
        <div style="text-align:center;color:#fff;margin-top:8px;">
            <span id="snakeScore">Score: 0</span>
            <span style="margin-left:12px;opacity:.5;font-size:12px;">Arrow keys · Enter to restart</span>
        </div>
    `;
    const canvas  = document.getElementById('snakeCanvas');
    const ctx     = canvas.getContext('2d');
    const cols    = W / SIZE, rows = H / SIZE;
    let snake     = [{ x: 5, y: 5 }];
    let dir       = { x: 1, y: 0 };
    let nextDir   = { x: 1, y: 0 };
    let food      = newFood();
    let score     = 0;
    let dead      = false;
    let iv        = null;

    function newFood() {
        return { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
    }
    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#ff1744';
        ctx.fillRect(food.x * SIZE, food.y * SIZE, SIZE - 2, SIZE - 2);
        snake.forEach((s, i) => {
            ctx.fillStyle = i === 0 ? '#69f0ae' : '#00c853';
            ctx.fillRect(s.x * SIZE, s.y * SIZE, SIZE - 2, SIZE - 2);
        });
        if (dead) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Game Over!', W / 2, H / 2 - 12);
            ctx.font = '13px sans-serif';
            ctx.fillText('Press Enter to restart', W / 2, H / 2 + 14);
        }
    }
    function tick() {
        dir = { ...nextDir };
        const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= cols || h.y >= rows || snake.some(s => s.x === h.x && s.y === h.y)) {
            dead = true; clearInterval(iv); draw(); return;
        }
        snake.unshift(h);
        if (h.x === food.x && h.y === food.y) {
            score++;
            document.getElementById('snakeScore').textContent = 'Score: ' + score;
            food = newFood();
        } else { snake.pop(); }
        draw();
    }
    function restart() {
        snake = [{ x: 5, y: 5 }]; dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
        food = newFood(); score = 0; dead = false;
        document.getElementById('snakeScore').textContent = 'Score: 0';
        clearInterval(iv);
        iv = setInterval(tick, SPEED);
        draw();
    }
    const keyHandler = e => {
        if (!State.snakeActive) return;
        const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0} };
        if (map[e.key]) { const nd = map[e.key]; if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd; e.preventDefault(); }
        if (e.key === 'Enter' && dead) restart();
    };
    document.addEventListener('keydown', keyHandler);
    State.snakeActive = true;
    iv = setInterval(tick, SPEED);
    draw();
    State.snakeGame = {
        stop: () => { clearInterval(iv); State.snakeActive = false; document.removeEventListener('keydown', keyHandler); }
    };
}

// ── App visibility ────────────────────────────────────────────
function applyAppVisibility(apps) {
    if (!apps) return;
    if (!apps.Music_Playlist) { $('.home-playlist-app').hide(); }
    if (!apps.AI_Assistant)   { $('.siri-icon, .siri-setting').hide(); }
    if (!apps.Video_Player)   { $('.home-video-app').hide(); }
    if (!apps.Car_Control)    { $('.home-carcontrol-app').hide(); }
    if (!apps.Car_Info)       { $('.home-carinfo-app').hide(); }
    if (!apps.Car_Automation) { $('.home-dashboard-app').hide(); }
    if (!apps.Game)           { $('.home-snake-game').hide(); }
    if (!apps.Music_Neon_RGB) { $('.musicrgb_btn, .rgb-setting').hide(); }
    if (!apps.Music_Overlay)  { $('.minimized-setting').hide(); }
}

// ── URL validator ─────────────────────────────────────────────
function isValidUrl(url) {
    try { new URL(url); return true; } catch (_) { return false; }
}

function extractYoutubeId(url) {
    const m = url.match(/(?:youtu\.be\/|[?&]v=)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

// ══════════════════════════════════════════════════════════════
//  jQuery ready – wire all UI events
// ══════════════════════════════════════════════════════════════
$(document).ready(function () {

    // Make the UI and overlay draggable
    $('.drag-container').draggable({ handle: '.left-slider', containment: 'window' });
    $('.mini-ui-draggable').draggable({ containment: 'window' });

    // Initial state: everything hidden
    $('.drag-container').hide();
    $('.mini-ui-draggable').hide();
    $('.camera-container').hide();
    $('.sign-in-confirmation-box').hide();
    $('.factory-confirmation-box').hide();
    $('.wallpaper-insert-url').hide();
    $('.notification-container').hide();
    hideAllScreens();

    // ── FiveM NUI message handler ─────────────────────────────
    window.addEventListener('message', function (event) {
        const { action, data } = event.data;

        switch (action) {

            case 'openUI': {
                State.uiVisible = true;
                $('.drag-container').fadeIn(300);
                if (data.settings)        applySettings(data.settings);
                if (data.playlist)        renderPlaylist(data.playlist);
                if (data.defaultPlaylist) State.defaultPlaylist = data.defaultPlaylist;
                if (data.vehName)         $('.car-name-cont').text(data.vehName);
                if (data.apps)            applyAppVisibility(data.apps);
                if (data.defaultVolume != null && !data.settings?.volume) {
                    State.musicVolume = data.defaultVolume;
                    $('.volume-slider').val(data.defaultVolume);
                }
                if (State.overlayEnabled && State.musicPlaying) $('.mini-ui-draggable').show();
                showScreen('home');
                break;
            }

            case 'closeUI':
                State.uiVisible = false;
                $('.drag-container').fadeOut(200);
                $('.mini-ui-draggable').hide();
                $('.camera-container').hide();
                if (State.snakeGame) { State.snakeGame.stop(); State.snakeGame = null; }
                break;

            case 'vehicleData':
                updateVehicleData(data);
                break;

            case 'dashboardUpdate':
                if (data.speed    != null) $('.dashboard-speed-box h2').text(data.speed);
                if (data.rpm      != null) $('.dashboard-rpm-box h2').text(data.rpm);
                if (data.gear     != null) $('.dashboard-gear-text h2').text('Gear ' + data.gear);
                if (data.distance != null) $('.dashboard-distance-title').text(data.distance + 'm');
                break;

            case 'autoPilotStatus':
                State.autoPilotActive = data.active;
                setAutoPilotUI(data.active);
                break;

            case 'updateTime':
                $('.left-time-text, .time-cont-title, .dashboard-time').text(data.time);
                break;

            case 'playlistSaved':
                showNotification('Playlist', 'Song saved!', 'image/apps/apple-music.png');
                break;

            case 'songRemoved':
                State.playlist = State.playlist.filter(s => s.url !== data.url);
                renderPlaylist(State.playlist);
                showNotification('Playlist', 'Song removed', 'image/apps/apple-music.png');
                break;

            case 'playlistCleared':
                State.playlist = [];
                renderPlaylist([]);
                showNotification('Settings', 'Playlist cleared', 'image/apps/settings.png');
                break;

            case 'settingsReset':
                applySettings({ theme:'dark', brightness:50, wallpaper:'image/wallpaper/6.jpeg', zoomLevel:1.0 });
                showNotification('Settings', 'Settings reset', 'image/apps/settings.png');
                break;

            case 'allReset':
                State.playlist = [];
                renderPlaylist([]);
                applySettings({ theme:'dark', brightness:50, wallpaper:'image/wallpaper/6.jpeg', zoomLevel:1.0 });
                showNotification('Settings', 'Factory reset done', 'image/apps/settings.png');
                break;

            case 'radioInstalled':
                showNotification('Radio',
                    data.installed ? 'Radio Installed in ' + data.plate : 'Radio Uninstalled from ' + data.plate,
                    'image/apps/car.png');
                break;

            case 'playMusicFromSiri':
                playMusic(data.url);
                break;
        }
    });

    // ── Home: app grid clicks ──────────────────────────────────
    $('.home-music-app').on('click',    () => showScreen('music'));
    $('.home-playlist-app').on('click', () => showScreen('playlist'));
    $('.home-timer-app').on('click',    () => showScreen('stopwatch'));
    $('.home-settings-app').on('click', () => showScreen('settings'));
    $('.home-carinfo-app').on('click',  () => showScreen('carinfo'));
    $('.home-video-app').on('click',    () => showScreen('video'));
    $('.home-carcontrol-app').on('click', () => showScreen('carcontrol'));
    $('.home-snake-game').on('click', () => {
        showScreen('snake');
        initSnakeGame($('.snake-game-app')[0]);
    });
    $('.home-dashboard-app').on('click', () => showScreen('dashboard'));

    // ── Left-side quick-access ────────────────────────────────
    $('.siri-icon').on('click', () => showScreen('siri'));
    $('.left-map-icon').on('click', () => nuiFetch('/openMap', {}));
    $('.left-camera-icon').on('click', () => {
        nuiFetch('/carCamera', { type: 'back' }).then(res => {
            if (res && res.status === 'ok') {
                $('.camera-container').show();
            } else {
                showNotification('Camera', 'No rear camera', 'image/apps/camera.png');
            }
        });
    });

    // Home menu toggle
    $('.left-home-menu-btn').on('click', function () {
        $('.main-slider-apps').toggle();
    });

    // ── Back navigation ───────────────────────────────────────
    $('.music-back-arrow').on('click',    () => showScreen('home'));
    $('.playlist-back-music').on('click', () => showScreen('music'));
    $('.video-back-btn').on('click',      () => { $('#frame').attr('src', ''); showScreen('home'); });
    $('.settings-back-btn').on('click',   () => showScreen('home'));
    $('.appearance-exit').on('click',     () => showScreen('settings'));
    $('.wallpaper-exit').on('click',      () => showScreen('settings'));
    $('.reset-exit').on('click',          () => showScreen('settings'));
    $('.car-details-exit').on('click',    () => showScreen('home'));
    $('.car-control-exit').on('click',    () => showScreen('home'));
    $('.dashboard-back-btn').on('click',  () => showScreen('home'));
    $('.timer-back-btn').on('click', () => {
        if (State.stopwatchRunning) { clearInterval(State.stopwatchTimer); State.stopwatchRunning = false; }
        showScreen('home');
    });

    // Car info → control
    $('.car-control-button').on('click', () => showScreen('carcontrol'));

    // ── Music controls ────────────────────────────────────────

    // Play / Pause
    $('.music-stop, .menu-music-stop').on('click', function () {
        if (!State.musicPlaying) {
            const url = State.currentSong.url || (State.defaultPlaylist && State.defaultPlaylist[1]);
            if (url) playMusic(url);
        } else {
            stopMusic();
        }
    });

    // Skip
    $('.music-skip, .menu-music-skip').on('click', () => {
        const idx  = State.playlist.findIndex(s => s.url === State.currentSong.url);
        const next = State.playlist[(idx + 1) % State.playlist.length];
        if (next) playMusic(next.url);
    });

    // Previous
    $('.music-back, .menu-music-back').on('click', () => {
        const idx  = State.playlist.findIndex(s => s.url === State.currentSong.url);
        const prev = State.playlist[(idx - 1 + State.playlist.length) % State.playlist.length];
        if (prev) playMusic(prev.url);
    });

    // Like / heart
    $('.like-music').on('click', function () {
        if (!State.currentSong.url) return;
        nuiFetch('/likeData', State.currentSong);
        $(this).toggleClass('fa-heart fa-heart-circle-check');
    });

    // Loop
    $('.music-loop').on('click', function () {
        nuiFetch('/loopMusic', {}).then(res => {
            if (res) { State.musicLoop = !!res.loop; $(this).toggleClass('active-loop', !!res.loop); }
        });
    });

    // Volume
    $('.volume-slider').on('input', function () {
        State.musicVolume = parseInt($(this).val());
        nuiFetch('/adjustVolume', { volume: State.musicVolume });
    });

    // Seek slider
    $('#slider').on('change', function () {
        const pct = parseInt($(this).val());
        const dur = parseFloat($('#end-time').data('duration')) || 0;
        if (dur > 0) nuiFetch('/setMusicPosition', { position: (pct / 100) * dur });
    });

    // Search & play
    function searchAndPlay() {
        const url = $('.music-search-field input').val().trim();
        if (!url || !url.startsWith('http')) {
            showNotification('Music', 'Invalid URL', 'image/apps/apple-music.png');
            return;
        }
        playMusic(url);
        showScreen('music');
    }
    $('.music-search-play-btn').on('click', searchAndPlay);
    $('.music-search-field input').on('keydown', e => { if (e.key === 'Enter') searchAndPlay(); });

    // ── Video player ──────────────────────────────────────────

    function playVideo() {
        const url  = $('.video-app .input').val().trim();
        if (!url) return;
        const ytId = extractYoutubeId(url);
        $('#frame').attr('src', ytId
            ? `https://www.youtube.com/embed/${ytId}?autoplay=1`
            : url);
        $('.no-media-text').hide();
        $('.video-player').show();
    }
    $('.video-play-btn').on('click', playVideo);
    $('.video-stop-btn').on('click', () => {
        $('#frame').attr('src', '');
        $('.no-media-text').show();
        $('.video-player').hide();
    });
    $('.video-app .input').on('keydown', e => { if (e.key === 'Enter') playVideo(); });

    // ── Settings ──────────────────────────────────────────────

    // Login box
    $('.settings-box.login-box').on('click', function () {
        if (State.isLoggedIn) {
            nuiFetch('/logoutAccount', {}).then(() => {
                State.isLoggedIn = false;
                updateLoginUI();
                saveSettings();
            });
        } else {
            $('.sign-in-confirmation-box').fadeIn(200);
        }
    });
    $('.sign-in-close').on('click', () => $('.sign-in-confirmation-box').fadeOut(200));
    $('.sign-in-button').on('click', () => {
        State.isLoggedIn = true;
        updateLoginUI();
        nuiFetch('/loginAccount', {});
        saveSettings();
        $('.sign-in-confirmation-box').fadeOut(200);
        showNotification('CarPlay', 'Logged In', 'image/apps/user.png');
    });

    // Appearance
    $('.apperance-box').on('click', () => showScreen('appearance'));
    $('.dark-mode-btn').on('click', () => { applyTheme('dark');  saveSettings(); });
    $('.light-mode-btn').on('click', () => { applyTheme('light'); saveSettings(); });
    $('#brightslider').on('input', function () { applyBrightness(parseInt($(this).val())); saveSettings(); });

    // Wallpaper
    $('.wallpaper-set-box').on('click', () => showScreen('wallpaper'));
    $('.wallpaper-image').on('click', function () {
        applyWallpaper($(this).attr('src'));
        saveSettings();
        $('.wallpaper-check-icon').remove();
        $(this).after('<i class="fa-solid fa-circle-check wallpaper-check-icon" style="position:absolute;bottom:4px;right:4px;color:#00c853;pointer-events:none;"></i>');
    });
    $('.wallpaper-url').on('click', () => $('.wallpaper-insert-url').toggle());
    $('.close-url-btn').on('click', () => $('.wallpaper-insert-url').hide());
    $('.save-url-btn').on('click', () => {
        const url = $('.insert-url-wallpaper').val().trim();
        if (url && isValidUrl(url)) { applyWallpaper(url); saveSettings(); $('.wallpaper-insert-url').hide(); }
    });

    // Toggles
    $('#checkbox-siri').on('change', function () { State.siriInDashboard = $(this).is(':checked'); saveSettings(); });
    $('#checkbox-sound').on('change', function () { State.soundEffects    = $(this).is(':checked'); saveSettings(); });
    $('#checkbox-rgb').on('change', function ()   { State.rgbEnabled      = $(this).is(':checked'); saveSettings(); });
    $('#checkbox-minimized').on('change', function () {
        State.overlayEnabled = $(this).is(':checked');
        if (State.overlayEnabled && State.musicPlaying) $('.mini-ui-draggable').show();
        else $('.mini-ui-draggable').hide();
        saveSettings();
    });
    $('#checkbox-position').on('change', function () {
        State.positionEnabled = $(this).is(':checked');
        if (State.positionEnabled) {
            $('.drag-message').fadeIn(200);
            setTimeout(() => $('.drag-message').fadeOut(400), 2500);
        }
        saveSettings();
    });
    $('.reset-ui-position-btn').on('click', () => {
        $('.drag-container, .mini-ui-draggable').css({ left: '', top: '' });
    });

    // Zoom
    $('.zoomInBtn').on('click', () => { applyZoom(Math.min(parseFloat((State.zoomLevel + 0.1).toFixed(1)), 2.0)); saveSettings(); });
    $('.zoomOutBtn').on('click', () => { applyZoom(Math.max(parseFloat((State.zoomLevel - 0.1).toFixed(1)), 0.5)); saveSettings(); });

    // Factory reset
    $('.factory-reset').on('click', () => showScreen('factory'));
    $('.reset-playlist').on('click', () => { State.factoryResetTarget = 'playlist'; $('.factory-confirmation-box').fadeIn(200); });
    $('.reset-settings').on('click', () => { State.factoryResetTarget = 'settings'; $('.factory-confirmation-box').fadeIn(200); });
    $('.reset-all').on('click',      () => { State.factoryResetTarget = 'all';      $('.factory-confirmation-box').fadeIn(200); });
    $('.no-button').on('click',  () => $('.factory-confirmation-box').fadeOut(200));
    $('.yes-button').on('click', () => {
        $('.factory-confirmation-box').fadeOut(200);
        const t = State.factoryResetTarget;
        if (t === 'playlist') nuiFetch('/resetPlaylist', {});
        else if (t === 'settings') nuiFetch('/resetSettings', {});
        else if (t === 'all')      nuiFetch('/resetAll', {});
    });

    // ── Car control ───────────────────────────────────────────

    // Doors 0-5
    for (let i = 0; i <= 5; i++) {
        (function (di) {
            $(`.door${di}_btn`).on('click', function () {
                nuiFetch('/carAction', { action: 'door', index: di }).then(res => {
                    if (res && res.status === 'ok')
                        $(`.door${di}_btn`).css('background', res.open ? '#00c853' : '');
                });
            });
        })(i);
    }

    // All doors
    $('.alldoor_btn').on('click', function () {
        nuiFetch('/carAction', { action: 'alldoors' }).then(res => {
            if (res && res.status === 'ok') {
                const col = res.open ? '#00c853' : '';
                for (let i = 0; i <= 5; i++) $(`.door${i}_btn`).css('background', col);
            }
        });
    });

    // Windows 0-3
    for (let i = 0; i <= 3; i++) {
        (function (wi) {
            $(`.window${wi}_btn`).on('click', function () {
                nuiFetch('/carAction', { action: 'window', index: wi }).then(res => {
                    if (res && res.status === 'ok')
                        $(`.window${wi}_btn`).css('background', res.open ? '#0091ea' : '');
                });
            });
        })(i);
    }

    // Seats (eject)
    [0, 1, 2, 10].forEach(si => {
        const cls = si === 10 ? '.seat10_btn' : `.seat${si}_btn`;
        $(cls).on('click', () => nuiFetch('/carAction', { action: 'seat', index: si }));
    });

    // Toggle controls
    $('.engine_btn').on('click',    function () { carControlBtn($(this), 'engine'); });
    $('.headlight_btn').on('click', function () { carControlBtn($(this), 'headlight'); });
    $('.hazard_btn').on('click',    function () { carControlBtn($(this), 'hazard'); });
    $('.musicrgb_btn').on('click',  function () { carControlBtn($(this), 'musicrgb'); });

    // ── Camera ────────────────────────────────────────────────

    $('.front-cam').on('click', () => {
        nuiFetch('/carCamera', { type: 'front' }).then(res => {
            if (res && res.status !== 'ok')
                showNotification('Camera', 'No front camera', 'image/apps/camera.png');
        });
    });
    $('.back-cam').on('click', () => {
        nuiFetch('/carCamera', { type: 'back' }).then(res => {
            if (res && res.status !== 'ok')
                showNotification('Camera', 'No rear camera', 'image/apps/camera.png');
        });
    });
    $('.exit-cam').on('click', () => {
        nuiFetch('/carCamera', { type: 'exit' });
        $('.camera-container').hide();
    });

    // ── Siri / AI ─────────────────────────────────────────────

    async function sendSiriMsg() {
        const msg = $('.siri-input').val().trim();
        if (!msg) return;
        $('.siri-input').val('');
        const $qa = $('.siri-qa-box');
        $qa.append(`<div class="siri-question-box"><div class="siri-answer-box"><h3>${escHtml(msg)}</h3></div></div>`);
        $qa.scrollTop($qa[0].scrollHeight);
        const res = await nuiFetch('/chatGPTAction', { msg });
        if (res && res.answer) {
            $qa.append(`<div class="siri-answer-cont"><div class="siri-answer-box"><h3>${escHtml(res.answer)}</h3></div></div>`);
            $qa.scrollTop($qa[0].scrollHeight);
        }
    }
    $('.siri-search-icon').on('click', sendSiriMsg);
    $('.siri-input').on('keydown', e => { if (e.key === 'Enter') sendSiriMsg(); });

    // ── Autopilot ─────────────────────────────────────────────

    $('.dashboard-start-container').on('click', () => {
        if (State.autoPilotActive) doStopAutoPilot();
        else requestAutoPilot();
    });
    $('.dashboard-stop-btn').on('click', () => doStopAutoPilot());

    // ── Stopwatch ─────────────────────────────────────────────

    $('.start-btn').on('click', () => {
        if (State.stopwatchRunning) return;
        State.stopwatchRunning = true;
        const t0 = Date.now() - State.stopwatchMs;
        State.stopwatchTimer = setInterval(() => {
            State.stopwatchMs = Date.now() - t0;
            $('.timer-stopwatch').text(fmtSw(State.stopwatchMs));
        }, 10);
    });
    $('.pause-btn').on('click', () => {
        if (!State.stopwatchRunning) return;
        clearInterval(State.stopwatchTimer);
        State.stopwatchRunning = false;
    });
    $('.reset-btn').on('click', () => {
        clearInterval(State.stopwatchTimer);
        State.stopwatchRunning = false;
        State.stopwatchMs      = 0;
        State.lapCount         = 0;
        $('.timer-stopwatch').text('00:00.00');
        $('.tracker').empty();
    });
    $('.lap-btn').on('click', () => {
        if (!State.stopwatchRunning) return;
        State.lapCount++;
        $('.tracker').append(`<div class="lap-data"><span>Lap ${State.lapCount}</span><span>${fmtSw(State.stopwatchMs)}</span></div>`);
        const $tw = $('.tracker-wrapper');
        $tw.scrollTop($tw[0].scrollHeight);
    });

    // ── Radio install card ────────────────────────────────────

    $('.install-radio-button').on('click', function () {
        const installing = $(this).text().trim().toLowerCase() === 'install radio';
        nuiFetch('/installRadio', { install: installing });
    });

    // ── Escape closes UI ──────────────────────────────────────

    $(document).on('keydown', e => {
        if (e.key === 'Escape' && State.uiVisible) nuiFetch('/closeUI', {});
    });

});
