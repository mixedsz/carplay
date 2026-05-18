/**
 * CarPlay UI - Main JavaScript (Deobfuscated)
 * Original: cs_carplay/ui/main.js
 *
 * FiveM CarPlay NUI - Full-featured in-car interface
 * Deobfuscated from JavaScript Obfuscator (_0x variable names, encoded string array)
 *
 * ========== NUI ENDPOINTS (outbound to Lua server) ==========
 * All calls: $.post(`https://${GetParentResourceName()}/ENDPOINT`, JSON.stringify(data))
 *
 * /chatGPT          - Ask AI question; body: string message
 * /chatGPTAction    - Execute AI-suggested action; body: GPT response data object
 * /loginAccount     - Authenticate user; body: {loginID, password}
 * /logoutAccount    - Logout; body: {vehID}
 * /openMap          - Open game map
 * /closeUI          - Close CarPlay UI
 * /carCamera        - Toggle car camera view
 * /fetchPlaylist    - Request user's playlist data
 * /savePlaylist     - Save current playlist
 * /clearPlaylist    - Clear playlist; body: {vehID, login}
 * /addPlaylist      - Add track; body: {musicSrc, musicURL, thumbnailUrl, music_artist}
 * /removed_playlist - Remove track; body: {musicID}
 * /adjustVolume     - Set volume; body: {volume}
 * /updateMusicTime  - Update playback position; body: {time}
 * /updateMusicState - Update play/pause state; body: {state}
 * /syncUI           - Sync UI state with server
 * /setSettings      - Save settings; body: settings object
 * /getSettings      - Request settings
 * /openAutopilot    - Open autopilot control
 * /closeAutopilot   - Close autopilot
 * /setAutopilotSpeed- Set speed; body: {speed}
 * /toggleDoor       - Toggle door; body: {door: 0-4}
 * /toggleWindow     - Toggle window; body: {window: 0-3}
 * /toggleEngine     - Toggle engine on/off
 * /toggleTrunk      - Toggle trunk
 * /toggleBonnet     - Toggle bonnet
 * /locDist          - Update location/distance; body: location data
 * /RGB              - Set car RGB color; body: {r, g, b}
 *
 * ========== INBOUND EVENTS (from Lua via window.addEventListener) ==========
 * Event data always wrapped in: event.data = {type: "eventName", ...}
 *
 * openUI         - Show CarPlay; data: {loginID, vehicles, settings, playlist, ...}
 * closeUI        - Hide CarPlay
 * updateUI       - Update state; data: various fields
 * syncUI         - Full sync; data: {musicURL, musicPlaying, volume, time, ...}
 * updateMusicTime- Seek update; data: {time, maxTime}
 * resume         - Resume playback
 * pause          - Pause playback
 * skip           - Skip track; data: {direction}
 * end            - Track ended
 * volume         - Volume change; data: {volume: 0-1}
 * login          - Login result; data: {loginID, success}
 * logout         - Force logout
 * invalid_link   - Bad music URL
 * locDist        - Location update; data: {distance, address}
 * updateTime     - Clock update; data: {time: "HH:MM"}
 * updateWeather  - Weather update; data: {name, img}
 * updateDashboard- Dash update; data: {speed, rpm, gear}
 * playlistData   - Playlist loaded; data: [{musicSrc, musicURL, thumbnailUrl, ...}]
 * removed_playlist- Track removed; data: {musicID}
 * settings       - Settings data; data: settings object
 * RGB            - Car color; data: {r, g, b}
 * carPlayRGB     - UI accent color; data: {r, g, b}
 */

let curVeh, musicPlaying, loginID, musicOverlay;
var uiLanguage;
let isUpdateUIExecuted = false,
  savedMusic = {};
const searchIcon = $(".siri-search-icon"),
  inputBox = $(".siri-input"),
  chatContainer = $(".siri-qa-box"),
  savedChat = {};
function clearAllChats() {
  const _0x244a83 = {
    SVcqn: function (_0x11f6db, _0x3d054b) {
      return _0x11f6db(_0x3d054b);
    },
    pyxWZ: ".siri-qa-box",
    cEWnn: ".siri-input",
  };
  ($(".siri-qa-box").empty(), $(".siri-input").empty());
}
function loadSavedChats() {
  const _0x43524f = { bAxwv: "scrollHeight" },
    _0x2e5991 = savedChat[curVeh] || [];
  _0x2e5991.forEach((_0x54694c) => {
    const _0x13bda1 =
      '\n            <div class="siri-question-box">\n                <h3>' +
      _0x54694c.user +
      "</h3>\n            </div>\n        ";
    (chatContainer.append(_0x13bda1),
      chatContainer.scrollTop(chatContainer.prop("scrollHeight")));
    const _0x9b8938 =
      '\n            <div class="siri-answer-box">\n                <h3>' +
      _0x54694c.gpt +
      "</h3>\n            </div>\n        ";
    (chatContainer.append(_0x9b8938),
      chatContainer.scrollTop(chatContainer.prop("scrollHeight")));
  });
}
function handleSearch() {
  const _0x4b51ff = {
      CmpmJ: function (_0x44b113, _0x32cf2e) {
        return _0x44b113 + _0x32cf2e;
      },
      lrhCT: "scrollHeight",
      zswTY: function (_0x658ac3, _0x129ca2, _0x50bdd0) {
        return _0x658ac3(_0x129ca2, _0x50bdd0);
      },
      fCJhX: function (_0x30c925, _0x3f25bc) {
        return _0x30c925 + _0x3f25bc;
      },
      pMWLg: "https://",
      ZJmQQ: function (_0x30eeed) {
        return _0x30eeed();
      },
    },
    _0x5c3963 = inputBox.val().trim();
  if (_0x5c3963 === "") return;
  $.post(
    `https://${GetParentResourceName()}/chatGPT`,
    JSON.stringify(_0x5c3963),
  ).then((_0x5c4d4b) => {
    const _0x5b42e0 = {
      isUNN: function (_0x2e412d, _0x2685d0) {
        return _0x2e412d(_0x2685d0);
      },
      nsaXt: function (_0xdb9a39, _0x1ffde7) {
        return _0xdb9a39 + _0x1ffde7;
      },
      YvPhs: "https://",
      MUiqQ: "scrollHeight",
      UEDVQ: function (_0xc4effc, _0x2976c2, _0x2d7ea8) {
        return _0xc4effc(_0x2976c2, _0x2d7ea8);
      },
    };
    if (_0x5c4d4b) {
      const _0x137113 =
        '\n                <div class=\"siri-question-box\">\n                    <h3>' +
        _0x5c3963 +
        "</h3>\n                </div>\n            ";
      (chatContainer.append(_0x137113),
        chatContainer.scrollTop(chatContainer.prop("scrollHeight")),
        setTimeout(function () {
          const _0x2fa6d2 = {
              BCCnV: function (_0x597bf4, _0xb32071) {
                return _0x597bf4(_0xb32071);
              },
              ePuqt: function (_0x36a0d2, _0x23f2e2) {
                return _0x36a0d2 + _0x23f2e2;
              },
              srntF: "https://",
              ASuNL: "/chatGPTAction",
            },
            _0x518cbe =
              '\n                    <div class=\"siri-answer-box\">\n                        <h3>' +
              _0x5c4d4b.response +
              "</h3>\n                    </div>\n                ";
          (chatContainer.append(_0x518cbe),
            chatContainer.scrollTop(chatContainer.prop("scrollHeight")),
            setTimeout(() => {
              $.post(
                `https://${GetParentResourceName()}/chatGPTAction`,
                JSON.stringify(_0x5c4d4b.data),
              ).then((_0x304dcd) => {
                if (_0x304dcd) {
                  var _0x388265 =
                      /(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+)/g,
                    _0x1f1864 = _0x5c3963.match(_0x388265),
                    _0x1c5085 = _0x1f1864[0];
                  playMusic(_0x1c5085);
                }
              });
            }, 400));
        }, 250),
        inputBox.val(""),
        !savedChat[curVeh] && (savedChat[curVeh] = []),
        savedChat[curVeh].push({ user: _0x5c3963, gpt: _0x5c4d4b.response }));
    }
  });
}
(searchIcon.click(handleSearch),
  inputBox.keydown(function (_0x40f1c3) {
    const _0x4791b2 = {
      fbOFC: function (_0x5ec317, _0x2a33f8) {
        return _0x5ec317 === _0x2a33f8;
      },
      JcnDU: function (_0x26af7a) {
        return _0x26af7a();
      },
    };
    _0x40f1c3.keyCode === 13 && handleSearch();
  }),
  $(".siri-icon").click(function () {
    const _0x200226 = {
      VVUrm: function (_0x12ff6a, _0x5436d5) {
        return _0x12ff6a(_0x5436d5);
      },
      zMiXI: ".left-home-menu-btn",
      ZyfYi: ".siri-app",
      bqFIp: "display",
      OnHuQ: "flex",
      KPTor: ".main-slider-home",
      YXKkh: function (_0x4b323d, _0x2bca04) {
        return _0x4b323d(_0x2bca04);
      },
      mIxXS: ":visible",
      QIajh: function (_0x486118) {
        return _0x486118();
      },
    };
    $(".siri-app").is(":visible")
      ? $(".siri-app").fadeOut(250, function () {
          $(".left-home-menu-btn").click();
        })
      : (clearAllChats(),
        loadSavedChats(),
        $(".main-slider-home").is(":visible")
          ? $(".main-slider-home").fadeOut(250, function () {
              $(".siri-app").fadeIn();
            })
          : fadeOutElements().then(() => {
              ($(".main-slider-home").css("display", "flex"),
                $(".main-slider-home").hide(),
                $(".siri-app").fadeIn());
            }));
  }));
function UpdateTime(_0x36e58e) {
  const _0x51d446 = {
    habXT: function (_0x5b1310, _0x490f8c) {
      return _0x5b1310(_0x490f8c);
    },
    bjPuv: ".dashboard-time",
  };
  ($(".left-time-text").text(_0x36e58e),
    $(".time-cont-title").text(_0x36e58e),
    $(".dashboard-time").text(_0x36e58e));
}
function UpdateWeather(_0x3ac77e) {
  const _0x3d56d8 = {
    UHyFj: function (_0x3e2a36, _0x1d9f94) {
      return _0x3e2a36(_0x1d9f94);
    },
    lszfa: ".weather-box p",
    nDkmJ: "Sunny",
  };
  if (!_0x3ac77e.img || !_0x3ac77e.name) {
    $(".weather-box p").text("Sunny");
    return;
  }
  $(".weather-box p").text(_0x3ac77e.name);
}
$(".left-map-icon, .map-cont, .home-maps-app").click(function () {
  const _0x42399c = {
    blcDy: function (_0x555767, _0x15f76a) {
      return _0x555767 + _0x15f76a;
    },
    cPQSZ: function (_0x48a4bc, _0x3ba630) {
      return _0x48a4bc + _0x3ba630;
    },
    kStiF: function (_0x5d43f0) {
      return _0x5d43f0();
    },
    eukyo: "/openMap",
  };
  ($.post`https://${GetParentResourceName()}/openMap`, Close());
});
function Close() {
  const _0x2d3c8d = {
    GwMXv: function (_0xbe91d6) {
      return _0xbe91d6();
    },
    xrdQu: function (_0x479b71, _0x4718fe) {
      return _0x479b71(_0x4718fe);
    },
    SmvZR: "fa-house",
    QDZXn: "fa-bars",
    CGtyt: ".main-slider-home",
    bqFCo: "display",
    RGHIs: "flex",
    DAahJ: function (_0x1b18cc, _0x491318) {
      return _0x1b18cc + _0x491318;
    },
    xDnlL: "https://",
    xKHsL: function (_0xe90897) {
      return _0xe90897();
    },
    QTPtL: "/closeUI",
    qBJaT: ".assemble-card",
    Jkjvh: function (_0x59801b, _0x1b2b6c) {
      return _0x59801b(_0x1b2b6c);
    },
    fYIeL: function (_0x174dbe, _0x125dd9) {
      return _0x174dbe + _0x125dd9;
    },
    xgfrZ: function (_0x9e834a, _0x42fdef) {
      return _0x9e834a + _0x42fdef;
    },
    aADMl: function (_0x21198c) {
      return _0x21198c();
    },
    TRDPc: "/carCamera",
  };
  ($.post("https://" + GetParentResourceName() + "/closeUI"),
    $(".drag-container").fadeOut(function () {
      (fadeOutElements(),
        $(".left-home-menu-btn").removeClass("fa-house").addClass("fa-bars"),
        $(".main-slider-home").css("display", "flex"));
    }),
    $(".assemble-card").fadeOut(),
    $(".camera-container").fadeOut(),
    $.post(`https://${GetParentResourceName()}/carCamera`));
}
$("#brightslider").on("input", function () {
  const _0x37f9f5 = {
    PPwym: function (_0x4f50fe, _0x24f9f1) {
      return _0x4f50fe(_0x24f9f1);
    },
    tauCe: ".wrapper",
    YejPo: "filter",
    XGDwH: "carPlayBrightness",
  };
  $(this).val();
  (_0x5a11f8 < 10 && (_0x5a11f8 = 10),
    $(".wrapper").css("filter", "brightness(" + _0x5a11f8 + "%)"),
    localStorage.setItem("carPlayBrightness", _0x5a11f8));
});
let useSound = false;
function SoundEffect(_0x4f0238, _0x3c2eaa) {
  if (!useSound) return;
  var _0xf44055 = new Audio("sound/" + _0x4f0238 + ".mp3");
  ((_0xf44055.volume = _0x3c2eaa), _0xf44055.play());
}
($(document).on("click", function () {
  const _0x5ceee8 = {
    FjINY: function (_0x11a7ff, _0x4d1508, _0x1d8f1) {
      return _0x11a7ff(_0x4d1508, _0x1d8f1);
    },
    tckzm: "menu",
  };
  SoundEffect("menu", 0.1);
}),
  $(".left-home-menu-btn").click(async function () {
    const _0x5dba41 = {
      uSPOP: ".main-slider-apps",
      SDWos: "grid",
      sAawn: ".main-slider-home",
      cUiTA: "display",
      GKQvi: "flex",
      Vmpvh: function (_0x50387d, _0x5d027f) {
        return _0x50387d(_0x5d027f);
      },
      HgkXz: "animate__zoomOut",
      CYcME: function (_0x15013d) {
        return _0x15013d();
      },
      gQjWc: "fa-bars",
      MUcfH: "fa-house",
      pwJrl: ".left-home-menu-btn",
      bUocP: function (_0x590b72) {
        return _0x590b72();
      },
      fsuGB: function (_0x1e3696, _0x17c2cb) {
        return _0x1e3696(_0x17c2cb);
      },
    };
    $(".main-slider-home").css("display") === "flex"
      ? ($(".main-slider-apps").removeClass("animate__zoomOut"),
        await fadeOutElements(),
        $(".main-slider-home").fadeOut(150, function () {
          $(".main-slider-apps")
            .css("display", "grid")
            .addClass("animate__zoomIn");
        }),
        $(".left-home-menu-btn").removeClass("fa-bars").addClass("fa-house"))
      : ($(".left-home-menu-btn").removeClass("fa-house").addClass("fa-bars"),
        await fadeOutElements(),
        $(".main-slider-home").css("display", "flex").hide().fadeIn());
  }));
function fadeOutElements() {
  const _0x59bc42 = {
    CdAzO: function (_0x2c65fa) {
      return _0x2c65fa();
    },
    Aolxh: function (_0x704f76, _0x2b6396) {
      return _0x704f76 === _0x2b6396;
    },
    HRvvY: "flex",
    rLvhF: "grid",
    eeDJG: "2|4|1|3|0",
    FPZPo: "animate__zoomIn",
    nnRWO: ".snake-game-app",
    nvyfk: function (_0x4efc45, _0x514eac) {
      return _0x4efc45(_0x514eac);
    },
    JNJzh: ".wallpaper-middle",
    yocEl: function (_0x3ac734, _0x1ad2fe) {
      return _0x3ac734(_0x1ad2fe);
    },
    MZggQ: ".music-app",
    qfHDo: function (_0x33c9ca, _0xda3c28) {
      return _0x33c9ca(_0xda3c28);
    },
    tOOTD: ".playlist-app",
    KjcrB: function (_0x380333, _0x29b078) {
      return _0x380333(_0x29b078);
    },
    VEbOK: ".car-details-app",
    yDWdt: function (_0x39a325, _0x107e2e) {
      return _0x39a325(_0x107e2e);
    },
    sWsMW: ".vehicle-control-app",
    kzyyb: ".settings-app",
    ufUus: ".appearance-setting",
    xQOcR: ".wallpaper-insert-url",
    EWCPC: function (_0x3c40d8, _0x5cc333) {
      return _0x3c40d8(_0x5cc333);
    },
    QYcjX: ".factory-settings",
    lYJrZ: ".main-slider-apps",
    WiHnX: function (_0x1107fc, _0x48f65f) {
      return _0x1107fc(_0x48f65f);
    },
    qWBsY: ".siri-app",
    SlGsf: function (_0x1f10b3, _0x54edbd) {
      return _0x1f10b3(_0x54edbd);
    },
    wgoSK: ".dashboard-app",
  };
  return new Promise((_0x4cf7f5) => {
    const _0x9193c3 = {
        SwoGZ: function (_0x5b6689) {
          return _0x5b6689();
        },
        dsfJl: function (_0x2a838a, _0x380650) {
          return _0x2a838a === _0x380650;
        },
        DXvJs: "block",
        aZZxC: "flex",
        oUpkL: "grid",
        hPwLT: "2|4|1|3|0",
        AAkga: function (_0x347e5f, _0x595753) {
          return _0x347e5f + _0x595753;
        },
        amXXe: "animate__zoomIn",
        hDEHJ: ".snake-game-app",
        dJrvq: function (_0x238e06, _0x4d65b5) {
          return _0x238e06(_0x4d65b5);
        },
        LoSNe: ".wallpaper-middle",
      },
      _0x3e3dfc = [
        $(".music-app"),
        $(".playlist-app"),
        $(".car-details-app"),
        $(".vehicle-control-app"),
        $(".video-app"),
        $(".stop-watch-app"),
        $(".snake-game-app"),
        $(".settings-app"),
        $(".appearance-setting"),
        $(".wallpaper-settings"),
        $(".wallpaper-insert-url"),
        $(".factory-settings"),
        $(".main-slider-apps"),
        $(".siri-app"),
        $(".dashboard-app"),
      ],
      _0x1f355f = _0x3e3dfc.map((_0x3d9ebd) => {
        const _0xa180d1 = {
          fDHCW: function (_0x4c407e) {
            return _0x4c407e();
          },
          VOWye: function (_0xb59426, _0x30163e) {
            return _0xb59426 === _0x30163e;
          },
          JKfVr: "display",
          AMGdp: "block",
          cDRAP: function (_0x2ca4fd, _0x1194c5) {
            return _0x2ca4fd === _0x1194c5;
          },
          skaeA: "flex",
          WdGdG: "grid",
          fSrSs: "2|4|1|3|0",
          ugrXo: function (_0x5d1281, _0x261589) {
            return _0x5d1281 + _0x261589;
          },
          fJajn: function (_0x2ed2b2, _0x1ad006) {
            return _0x2ed2b2 + _0x1ad006;
          },
          bVpmE: "/carDashboard",
          GTucs: "animate__zoomIn",
          aQdaS: ".snake-game-app",
          UkwuR: function (_0x49251f, _0x578c94) {
            return _0x49251f(_0x578c94);
          },
          addna: ".wallpaper-middle",
          nbUjH: "add-blur",
        };
        return new Promise((_0x2ef559) => {
          const _0x493ceb = {
            NMwTt: function (_0x46290e) {
              return _0x46290e();
            },
          };
          if (
            _0x3d9ebd.css("display") === "block" ||
            _0x3d9ebd.css("display") === "flex" ||
            _0x3d9ebd.css("display") === "grid"
          ) {
            const _0x5ccb7b = "2|4|1|3|0".split("|");
            let _0x35a1e8 = 0;
            while (true) {
              switch (_0x5ccb7b[_0x35a1e8++]) {
                case "0":
                  _0x3d9ebd.fadeOut(250, function () {
                    _0x2ef559();
                  });
                  continue;
                case "1":
                  $.post(
                    `https://${GetParentResourceName()}/carDashboard`,
                    JSON.stringify(false),
                  );
                  continue;
                case "2":
                  _0x3d9ebd.hasClass("animate__zoomIn") &&
                    (_0x3d9ebd.removeClass("animate__zoomIn"),
                    _0x3d9ebd.addClass("animate__zoomOut"));
                  continue;
                case "3":
                  $(".snake-game-app").empty();
                  continue;
                case "4":
                  $(".wallpaper-middle").removeClass("add-blur");
                  continue;
              }
              break;
            }
          } else _0x2ef559();
        });
      });
    Promise.all(_0x1f355f).then(() => {
      _0x4cf7f5();
    });
  });
}
function getVideoIdFromUrl(_0x40fd35) {
  var _0x553269 = /[?&]v=([^&#]*)/,
    _0x3649e7 = _0x553269.exec(_0x40fd35);
  return _0x3649e7 && _0x3649e7[1];
}
function autoplayVideo(_0x56b0f1) {
  const _0x139946 = {
    NMFvA: function (_0x5a2773, _0x23a314) {
      return _0x5a2773 + _0x23a314;
    },
    JvZdR: function (_0x1f348c, _0x536107) {
      return _0x1f348c + _0x536107;
    },
    sxJkH: "https://www.youtube.com/embed/",
    esqmR: "?autoplay=1",
    raFvw: function (_0x502957, _0x5e2640) {
      return _0x502957(_0x5e2640);
    },
    toFEo: "#frame",
    wMYeV: function (_0x77f2a7, _0x27ddc5, _0x3fcb3e) {
      return _0x77f2a7(_0x27ddc5, _0x3fcb3e);
    },
    hvATD: "<iframe>",
    EnQYi: "frame",
    eVyoz: "100%",
    mjfFp: "autoplay",
    dirdB: function (_0x5e8373, _0x365eab) {
      return _0x5e8373(_0x365eab);
    },
    mOdwE: ".no-media-text",
    cJIne: ".video-player",
    MLgwP: "display",
    MJkPN: "flex",
  };
  const embedUrl = "https://www.youtube.com/embed/" + _0x56b0f1 + "?autoplay=1";
  $("#frame").replaceWith(
    $("<iframe>", {
      id: "frame",
      src: embedUrl,
      width: "100%",
      height: "100%",
      frameborder: "0",
      allow: "autoplay",
      allowfullscreen: "",
    }),
  );
  $(".no-media-text").hide();
  $(".video-player").css("display", "flex");
}
($(document).on("click", ".video-play-btn", function () {
  const _0x1383d2 = {
      vQdRJ: function (_0xeba115, _0x3ce292) {
        return _0xeba115(_0x3ce292);
      },
      CAHVe: ".video-player-input-box input",
    },
    _0x43aa3a = $(".video-player-input-box input").val(),
    _0x333f3e =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9]+\.[a-zA-Z]{2,}(\/?([^\s]*)?)$/;
  _0x333f3e.test(_0x43aa3a) && autoplayVideo(getVideoIdFromUrl(_0x43aa3a));
}),
  $(document).on("click", ".video-stop-btn", function () {
    const _0xe161d2 = {
      xDJLM: function (_0x521b43, _0x5217b7) {
        return _0x521b43(_0x5217b7);
      },
      nTzts: "#frame",
      UBLjA: ".video-player",
      sZuRU: function (_0x582079, _0x209e7c) {
        return _0x582079(_0x209e7c);
      },
      YejFm: ".no-media-text",
    };
    ($("#frame").attr("src", ""),
      $(".video-player-input-box input").val(""),
      $(".video-player").hide(),
      $(".no-media-text").show());
  }),
  $(".home-music-app").click(function () {
    const _0x394dad = {
      XFJUg: function (_0x5008ad, _0xd08f1b) {
        return _0x5008ad == _0xd08f1b;
      },
      ZDRER: ".music-app",
      XdDKY: "true",
      ONbXT: function (_0x1ba708, _0x1d16ed) {
        return _0x1ba708(_0x1d16ed);
      },
      WIysB: "flex",
      WEmnW: "animate__zoomIn",
      fRCSS: ".main-slider-apps",
      hszaK: "animate__zoomOut",
      Hbddx: function (_0x4f3d52, _0x7a4f0c) {
        return _0x4f3d52(_0x7a4f0c);
      },
    };
    ($(".main-slider-apps").removeClass("animate__zoomIn"),
      $(".main-slider-apps").addClass("animate__zoomOut"),
      $(".main-slider-apps").fadeOut(250, function () {
        $(".music-app").attr("active") == "true" &&
          $(".music-app").css("display", "flex").hide().fadeIn();
      }));
  }),
  $(".music-back-arrow, .radio-back-arrow").click(function () {
    const _0x4d00e9 = {
      aNgtq: function (_0x65cb7b, _0x5820d8) {
        return _0x65cb7b(_0x5820d8);
      },
      NyKzJ: "animate__zoomOut",
      vWKeD: function (_0x41d1fa, _0x52c8a8) {
        return _0x41d1fa(_0x52c8a8);
      },
      JdmJw: "display",
      DjaSW: "grid",
      WhhjY: function (_0x2d1734, _0x1a6f0b) {
        return _0x2d1734(_0x1a6f0b);
      },
      xDohv: "music-back-arrow",
      QUexf: function (_0x3d9fc3, _0xa83f0d) {
        return _0x3d9fc3(_0xa83f0d);
      },
      gsyGC: ".music-app",
    };
    $(this).hasClass("music-back-arrow") &&
      $(".music-app").fadeOut(250, function () {
        ($(".main-slider-apps").removeClass("animate__zoomOut"),
          $(".main-slider-apps").css("display", "grid").hide().fadeIn());
      });
  }),
  $(".music-card").click(function () {
    const _0x3c10d7 = {
      gEpFg: ".music-app",
      LqEtu: "display",
      Uwqvj: "flex",
      nHUZe: function (_0x50f572, _0x582795) {
        return _0x50f572(_0x582795);
      },
      vligo: ".main-slider-home",
    };
    $(".main-slider-home").fadeOut(250, function () {
      $(".music-app").css("display", "flex").hide().fadeIn();
    });
  }));
function addBeatClass() {
  const _0x515e5b = {
    tIiCh: function (_0x369c5b, _0x245456) {
      return _0x369c5b(_0x245456);
    },
    ZEvKt: "fa-beat",
  };
  $(this).addClass("fa-beat");
}
function removeBeatClass() {
  const _0x5ece9c = {
    qcCiI: function (_0x2fe78f, _0x1bd924) {
      return _0x2fe78f(_0x1bd924);
    },
    rkaQy: "fa-beat",
  };
  $(this).removeClass("fa-beat");
}
$(document).ready(function () {
  const _0x4c09b4 = {
    EnTZv: function (_0x3bdbce, _0x4f4ab8) {
      return _0x3bdbce(_0x4f4ab8);
    },
    QpgMi: ".fa-heart, .fa-volume-high, .fa-repeat, .fa-radio",
  };
  $(".fa-heart, .fa-volume-high, .fa-repeat, .fa-radio").hover(
    addBeatClass,
    removeBeatClass,
  );
});
let isDraggingSlider = false,
  progressUpdateTimer,
  currentTimeInSeconds = 0,
  maxDurationInSeconds = 0;
function formatTime(_0x11abbe) {
  const _0x5e5b4b = Math.floor(_0x11abbe / 60),
    _0x50ae9d = _0x11abbe % 60,
    _0x4af249 = _0x50ae9d.toFixed(2);
  return (
    _0x5e5b4b.toString().padStart(2, "0") +
    ":" +
    _0x4af249.toString().padStart(5, "0").slice(0, 2)
  );
}
function startProgressUpdateTimer() {
  const _0x4d3194 = {
    IfTTw: function (_0x5113fe, _0x88d605, _0x3bb02e) {
      return _0x5113fe(_0x88d605, _0x3bb02e);
    },
  };
  !progressUpdateTimer &&
    (progressUpdateTimer = setInterval(updateProgress, 100));
}
function stopProgressUpdateTimer() {
  const _0x47e593 = {
    XeIHl: function (_0x3b14aa, _0x4d3594) {
      return _0x3b14aa(_0x4d3594);
    },
    IPPce: "src",
    RzooB: "image/music-note.png",
    BXXMS: function (_0x567e7b, _0x3d4e1) {
      return _0x567e7b(_0x3d4e1);
    },
    HXbga: ".music-card-title",
    FioJL: ".music-card-sub-artistname",
    seofo: "#start-time",
    lhtuz: "0:00",
    UvSYn: "#end-time",
    SLGxb: '.music-app-sliderbar input[type="range"]',
    ypMgc: function (_0x78cd5a, _0x75466e) {
      return _0x78cd5a(_0x75466e);
    },
    uWgWx: ".music-song-subtitle p",
    ORgIV: ".music-thumbnail",
    oqGme: function (_0xe15b8e, _0x244766) {
      return _0xe15b8e(_0x244766);
    },
    wZUJg: ".bg-music-app",
    HcAoY: "image/fm.jpeg",
    zjbLF: ".music-stop",
    hWrHM: "fa-pause",
    PziHf: "fa-play",
    YvIFd: function (_0x461d7c, _0x59e16f) {
      return _0x461d7c(_0x59e16f);
    },
    prPxW: "red",
    fgmlu: ".music-app-slider",
    bcYcT: function (_0x30c309, _0x18ce60) {
      return _0x30c309(_0x18ce60);
    },
    eGCcn: ".mini-ui-draggable",
  };
  progressUpdateTimer &&
    (clearInterval(progressUpdateTimer),
    (progressUpdateTimer = null),
    (musicPlaying = false),
    (currentTimeInSeconds = 0),
    (maxDurationInSeconds = 0),
    $(".music-card").attr("src", "image/music-note.png"),
    $(".music-card-title").text(uiLanguage.music_track),
    $(".music-card-sub-artistname").text(uiLanguage.music_artist),
    $("#start-time").text("0:00"),
    $("#end-time").text("0:00"),
    $('.music-app-sliderbar input[type="range"]').val(0),
    $(".music-song-title p").text(uiLanguage.music_track),
    $(".music-song-subtitle p").text(uiLanguage.music_artist),
    $(".music-thumbnail").attr("src", "image/fm.jpeg"),
    $(".bg-music-app").attr("src", "image/fm.jpeg"),
    $(".music-stop").removeClass("fa-pause").addClass("fa-play"),
    $(".menu-music-stop").removeClass("fa-pause").addClass("fa-play"),
    $(".like-music").removeClass("red"),
    $(".music-app-slider").prop("disabled", true),
    $(".mini-ui-draggable").fadeOut());
}
function updateProgress() {
  const _0x5a2343 = {
    HlLYD: "start-time",
    CHbbk: '.mini-ui-draggable input[type="range"]',
    jRjRa: function (_0x2511a5, _0x6ad1d6) {
      return _0x2511a5 * _0x6ad1d6;
    },
    wIYUs: function (_0x14ca99, _0x3df243) {
      return _0x14ca99 / _0x3df243;
    },
    GiONb: function (_0xe091f1, _0x423257) {
      return _0xe091f1 > _0x423257;
    },
    XeHtD: function (_0x4e942c, _0x17710d) {
      return _0x4e942c(_0x17710d);
    },
  };
  if (!isDraggingSlider) {
    const _0x2ae9ab = document.querySelector(
        '.music-app-sliderbar input[type=\"range\"]',
      ),
      _0x266728 = document.getElementById("start-time"),
      _0x21ea66 = document.querySelector(
        '.mini-ui-draggable input[type="range"]',
      );
    let _0x5cc3b9 = Math.round(
      _0x5a2343.wIYUs(currentTimeInSeconds, maxDurationInSeconds) * 100,
    );
    (_0x5cc3b9 > 100 && (_0x5cc3b9 = 100),
      (_0x2ae9ab.value = _0x5cc3b9),
      (_0x21ea66.value = _0x5cc3b9),
      (_0x266728.textContent = formatTime(currentTimeInSeconds)));
  }
}
($(document).on("input", ".music-app-slider", function () {
  const _0x31ab46 = {
    UkXAY: function (_0x5a80b6, _0x37f259) {
      return _0x5a80b6(_0x37f259);
    },
    jGivJ: function (_0x285633, _0x3e7cbd) {
      return _0x285633(_0x3e7cbd);
    },
    poqQd: function (_0x194f42, _0x1a17cf) {
      return _0x194f42 * _0x1a17cf;
    },
    JUCEk: function (_0x342b09, _0x1ab583) {
      return _0x342b09 / _0x1ab583;
    },
    bzknW: function (_0x5a4956, _0x24852d) {
      return _0x5a4956(_0x24852d);
    },
    mSxSl: "#start-time",
  };
  isDraggingSlider = true;
  parseInt($(this).val());
  ((currentTimeInSeconds =
    _0x31ab46.JUCEk(_0x37ba62, 100) * maxDurationInSeconds),
    $("#start-time").text(formatTime(currentTimeInSeconds)));
}),
  $(document).on("change", ".music-app-slider", function () {
    const _0x24dd3c = {
      OTRuO: function (_0x14fe2e, _0x2f11b6) {
        return _0x14fe2e(_0x2f11b6);
      },
      fZJaV: function (_0x4d0a76, _0x33e5d7) {
        return _0x4d0a76 * _0x33e5d7;
      },
      STEPr: function (_0x482c17, _0x29b8f6) {
        return _0x482c17 / _0x29b8f6;
      },
      EnNzi: function (_0x1dc955, _0x64ac5c) {
        return _0x1dc955 + _0x64ac5c;
      },
      IcfhU: function (_0x465d07, _0x4927f5) {
        return _0x465d07 + _0x4927f5;
      },
      vToEY: "https://",
    };
    isDraggingSlider = false;
    parseInt($(this).val());
    ((currentTimeInSeconds =
      _0x24dd3c.STEPr(_0x360490, 100) * maxDurationInSeconds),
      $.post(
        `https://${GetParentResourceName()}/musicTimeStamp`,
        JSON.stringify({ vehID: curVeh, time: currentTimeInSeconds }),
      ));
  }));
function playMusic(_0x2b76bb) {
  const _0x2033d0 = {
      oYKUt: function (_0x4a54f2, _0x26929e) {
        return _0x4a54f2(_0x26929e);
      },
      wDZsh: ".volume-slider",
      XxeWE: function (_0x14b8b2, _0x2a45d1) {
        return _0x14b8b2 * _0x2a45d1;
      },
      NSiHk: function (_0x10e286, _0x5ac4ef) {
        return _0x10e286 === _0x5ac4ef;
      },
      NUvUV: function (_0x2bf424, _0x34ac81) {
        return _0x2bf424(_0x34ac81);
      },
      tWvQZ: "fa-play",
      Jnltc: function (_0x29ab4f, _0x4f4dc6) {
        return _0x29ab4f(_0x4f4dc6);
      },
      Eobzb: ".menu-music-stop",
      sToZy: function (_0x4702f3, _0x51e208) {
        return _0x4702f3 + _0x51e208;
      },
      fPBOi: "https://",
      WEqlY: function (_0x5603dd) {
        return _0x5603dd();
      },
      XBkul: function (_0xf25cfb, _0x5703fb, _0x829a66, _0x482b45) {
        return _0xf25cfb(_0x5703fb, _0x829a66, _0x482b45);
      },
      vecVv: "image/apps/apple-music.png",
    },
    _0x403f02 =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)*[a-zA-Z0-9]+\.[a-zA-Z]{2,}(\/?([^\s]*)?)$/;
  if (_0x403f02.test(_0x2b76bb)) {
    let _0x503891 = false;
    for (const _0x5525d8 in savedMusic) {
      if (savedMusic[_0x5525d8].musicSrc === _0x2b76bb) {
        _0x503891 = true;
        break;
      }
    }
    ($(".music-stop").removeClass("fa-play").addClass("fa-pause"),
      $(".menu-music-stop").removeClass("fa-play").addClass("fa-pause"),
      $.post(
        "https://" + GetParentResourceName() + "/musicPlay",
        JSON.stringify({ vehID: curVeh, url: _0x2b76bb, liked: _0x503891 }),
      ).then((_0xd96b2b) => {
        $(".volume-slider").val(_0xd96b2b * 100);
      }));
  } else
    _0x2033d0.XBkul(
      Notify,
      uiLanguage.music_app,
      uiLanguage.invalid_link,
      "image/apps/apple-music.png",
    );
}
$(document).on("click", ".music-search-play-btn", function () {
  const _0x3241c5 = {
      HvJKn: function (_0x450f76, _0x358968) {
        return _0x450f76(_0x358968);
      },
    },
    _0x5a1330 = $(".music-search-field input").val();
  playMusic(_0x5a1330);
});
const volumeBtn = $(".volume-btn"),
  volumeBarCont = $(".volume-bar-cont"),
  volumeSlider = $(".volume-slider");
let isVolumeBarContHovered = false,
  isVolumeBtnHovered = false,
  volHideTimeout;
(volumeBtn.on("mouseenter", function () {
  const _0x4be900 = { Wzgnh: "display", tBRnm: "flex" };
  if (!musicPlaying) return;
  (volumeBarCont.css("display", "flex").hide().fadeIn(100),
    (isVolumeBtnHovered = true));
}),
  volumeBtn.on("mouseleave", function () {
    const _0x394b3a = {
      mmcNY: function (_0x2c3ea6, _0xe95ee5) {
        return _0x2c3ea6 && _0xe95ee5;
      },
    };
    ((isVolumeBtnHovered = false),
      (volHideTimeout = setTimeout(function () {
        _0x394b3a.mmcNY(!isVolumeBarContHovered, !isVolumeBtnHovered) &&
          volumeBarCont.fadeOut(100);
      }, 500)));
  }),
  volumeBarCont.on("mouseenter", function () {
    ((isVolumeBarContHovered = true), clearTimeout(volHideTimeout));
  }),
  volumeBarCont.on("mouseleave", function () {
    const _0xc174fe = {
      wiPhB: function (_0x45c240, _0x584e67, _0x162399) {
        return _0x45c240(_0x584e67, _0x162399);
      },
    };
    ((isVolumeBarContHovered = false),
      (volHideTimeout = setTimeout(function () {
        !isVolumeBarContHovered &&
          !isVolumeBtnHovered &&
          volumeBarCont.fadeOut(100);
      }, 500)));
  }));
let timeoutId = null;
volumeSlider.on("input", function () {
  const _0x129440 = {
    nJrqW: function (_0x2bbe19, _0x34efcf) {
      return _0x2bbe19 / _0x34efcf;
    },
    JNzmW: function (_0x240a34, _0xbb06df) {
      return _0x240a34 + _0xbb06df;
    },
    DoWur: "/adjustVolume",
    aYlnr: function (_0x325144, _0x3bc8d0) {
      return _0x325144(_0x3bc8d0);
    },
    lEaIo: function (_0x5f08e8, _0x231e41, _0xddfeeb) {
      return _0x5f08e8(_0x231e41, _0xddfeeb);
    },
  };
  (clearTimeout(timeoutId),
    (timeoutId = setTimeout(function () {
      xs.volume(volumeSlider.val());
      $.post(
        `https://${GetParentResourceName()}/adjustVolume`,
        JSON.stringify({ vehID: curVeh, vol: _0x1e744b.toFixed(1) }),
      );
    }, 500)));
});
let isLopped = false;
($(document).on("click", ".music-loop", function () {
  const _0x11e981 = {
      mTMEx: "3|0|1|4|2",
      lFgEs: function (_0x1ac72a, _0x46eca0) {
        return _0x1ac72a(_0x46eca0);
      },
      WvqXP: "green",
      ePUHB: function (_0x5ea785, _0xc4039f) {
        return _0x5ea785 + _0xc4039f;
      },
      gtbvl: function (_0x2e0d06, _0x25442) {
        return _0x2e0d06 + _0x25442;
      },
      hqfau: "https://",
      rXcDE: "/loopMusic",
      SWsBA: function (_0x27737a, _0x57c6ec) {
        return _0x27737a + _0x57c6ec;
      },
    },
    _0x56e2f7 = "3|0|1|4|2".split("|");
  let _0x4be002 = 0;
  while (true) {
    switch (_0x56e2f7[_0x4be002++]) {
      case "0":
        if (!isLopped) {
          ($(this).addClass("green"),
            $.post(
              `https://${GetParentResourceName()}/loopMusic`,
              JSON.stringify({ vehID: curVeh, loop: true }),
            ),
            (isLopped = true));
          return;
        }
        continue;
      case "1":
        $(this).removeClass("green");
        continue;
      case "2":
        $.post(
          `https://${GetParentResourceName()}/loopMusic`,
          JSON.stringify({ vehID: curVeh, loop: false }),
        );
        continue;
      case "3":
        if (!musicPlaying) return;
        continue;
      case "4":
        isLopped = false;
        continue;
    }
    break;
  }
}),
  $(document).on("click", ".music-stop, .menu-music-stop", function () {
    const _0x849434 = {
      VXmMi: function (_0x127557, _0x1396b2) {
        return _0x127557 + _0x1396b2;
      },
      cDvHg: function (_0x30bcd9) {
        return _0x30bcd9();
      },
    };
    $.post(
      "https://" + GetParentResourceName() + "/stopMusic",
      JSON.stringify({ vehID: curVeh }),
    );
  }),
  $(document).on("click", ".music-skip, .menu-music-skip", function () {
    const _0x4f8130 = {
      dVbDN: function (_0x4f1e55, _0x279edd) {
        return _0x4f1e55(_0x279edd);
      },
      yUnbm: ".music-app-middle",
      XUruH: "musicURL",
      WLGdv: "musicIndex",
      SVPVM: function (_0x24d69e, _0x46ee32) {
        return _0x24d69e(_0x46ee32);
      },
      ZrOMA: function (_0x39975a, _0x4b9a21) {
        return _0x39975a === _0x4b9a21;
      },
      trZfS: function (_0x587d3f, _0xcc3d41) {
        return _0x587d3f(_0xcc3d41);
      },
      OyLJv: function (_0x22ce42, _0x500563) {
        return _0x22ce42 !== _0x500563;
      },
      SWWNe: function (_0x56c639, _0xe170d5) {
        return _0x56c639(_0xe170d5);
      },
    };
    if (!musicPlaying) return;
    ($(".music-app-middle").attr("musicURL"),
      (_0xb09389 = $(".music-app-middle").attr("musicIndex")),
      (_0x42e8a2 = parseInt(_0xb09389) + 1));
    let _0x4703e5 = null;
    for (const _0x591f8c in savedMusic) {
      if (savedMusic[_0x591f8c].musicSrc === _0x337425) {
        _0x4703e5 = parseInt(_0x591f8c);
        break;
      }
    }
    if (_0x4703e5 !== null && savedMusic.hasOwnProperty(_0x42e8a2)) {
      const _0x1a3947 = savedMusic[_0x42e8a2];
      (playMusic(_0x1a3947.musicSrc),
        $(".music-app-middle").attr("musicIndex", _0x42e8a2));
    } else {
      const _0x269c1c = Object.values(savedMusic)[0];
      if (_0x269c1c && _0x269c1c.musicSrc)
        (playMusic(_0x269c1c.musicSrc),
          $(".music-app-middle").attr("musicIndex", "0"));
      else {
      }
    }
  }),
  $(document).on("click", ".music-back, .menu-music-back", function () {
    const _0x20aa20 = {
      VNtho: function (_0x1de525, _0x5ea6f2) {
        return _0x1de525(_0x5ea6f2);
      },
      SXKUj: ".music-app-middle",
      ewLdl: "musicURL",
      XGkhp: "musicIndex",
      ORPSA: function (_0x2f582a, _0x4bb18b) {
        return _0x2f582a !== _0x4bb18b;
      },
      INJPa: function (_0x1ef424, _0x3e9cf9) {
        return _0x1ef424(_0x3e9cf9);
      },
      TwqTy: function (_0x2e609c, _0xbbea1e) {
        return _0x2e609c(_0xbbea1e);
      },
      AJtOB: function (_0x40e67b, _0x3d604d) {
        return _0x40e67b >= _0x3d604d;
      },
      xzVAT: function (_0x4decc3, _0x43b1c2) {
        return _0x4decc3(_0x43b1c2);
      },
      FVcaG: function (_0x46b061, _0x336528) {
        return _0x46b061(_0x336528);
      },
    };
    if (!musicPlaying) return;
    ($(".music-app-middle").attr("musicURL"),
      (_0x5ad457 = $(".music-app-middle").attr("musicIndex")),
      (_0x306910 = parseInt(_0x5ad457) - 1));
    let _0x3b6008 = null;
    for (const _0x5844de in savedMusic) {
      if (savedMusic[_0x5844de].musicSrc === _0x2fde04) {
        _0x3b6008 = parseInt(_0x5844de);
        break;
      }
    }
    if (_0x3b6008 !== null && savedMusic.hasOwnProperty(_0x306910)) {
      const _0xf51057 = savedMusic[_0x306910];
      (playMusic(_0xf51057.musicSrc),
        $(".music-app-middle").attr("musicIndex", _0x306910));
    } else {
      const _0x115910 = Object.keys(savedMusic).length - 1;
      if (_0x115910 >= 0) {
        const _0x4bf921 = savedMusic[_0x115910];
        (_0x4bf921 && _0x4bf921.musicSrc && playMusic(_0x4bf921.musicSrc),
          $(".music-app-middle").attr("musicIndex", _0x115910));
      } else {
      }
    }
  }),
  $(document).on("click", ".like-music", function () {
    const _0x44f846 = {
      EvhwR: function (_0x1455a4, _0x4d4ff5) {
        return _0x1455a4 + _0x4d4ff5;
      },
      Lskcc: "https://",
      GQSCs: function (_0xd9b4ea) {
        return _0xd9b4ea();
      },
      kOTaH: function (_0x489f4b, _0x1ce3f0) {
        return _0x489f4b + _0x1ce3f0;
      },
      AmDmm: function (_0x3b0805, _0x2790fb) {
        return _0x3b0805 + _0x2790fb;
      },
      jMOQS: "/saveMusic",
      ZebBw: function (_0x51e023, _0x24fc60) {
        return _0x51e023(_0x24fc60);
      },
      HIRdU: function (_0x520123, _0x39a493) {
        return _0x520123 === _0x39a493;
      },
      MMlNg: function (_0x43a4e7, _0x174253, _0x1edf0b, _0x48ca12) {
        return _0x43a4e7(_0x174253, _0x1edf0b, _0x48ca12);
      },
      oeHil: "image/apps/settings.png",
      TpKRh: "red",
      wumrF: function (_0x200f13, _0x12fa1e) {
        return _0x200f13 + _0x12fa1e;
      },
      gXoqR: function (_0x178003, _0x2de043) {
        return _0x178003 + _0x2de043;
      },
    };
    if (!musicPlaying) return;
    ($(".music-app-middle").attr("musicURL"), (_0x325191 = false));
    for (const _0x2a52e0 of Object.values(savedMusic)) {
      if (_0x2a52e0.musicSrc === _0x583826 && !_0x2a52e0.saved) {
        _0x325191 = true;
        break;
      }
    }
    if (_0x325191) {
      _0x44f846.MMlNg(
        Notify,
        uiLanguage.settings_app,
        uiLanguage.default_music,
        "image/apps/settings.png",
      );
      return;
    }
    if (!loginID) {
      _0x44f846.MMlNg(
        Notify,
        uiLanguage.settings_app,
        uiLanguage.not_loggedin,
        "image/apps/settings.png",
      );
      return;
    }
    if (!$(this).hasClass("red")) {
      $.getJSON(
        "https://noembed.com/embed?url=" + encodeURIComponent(_0x583826),
        function (_0x5304bd) {
          let _0x336aa0 = {
            saved: true,
            musicSrc: _0x583826,
            title: _0x5304bd.title,
            authorName: _0x5304bd.author_name,
            thumbnailUrl: _0x5304bd.thumbnail_url,
          };
          $.post(
            `https://${GetParentResourceName()}/saveMusic`,
            JSON.stringify({
              like: true,
              login: loginID,
              data: _0x336aa0,
              vehID: curVeh,
            }),
          ).then((_0xc98a87) => {
            _0xc98a87 &&
              ((_0x336aa0.id = _0xc98a87),
              (savedMusic[_0xc98a87] = _0x336aa0),
              $.post(
                "https://" + GetParentResourceName() + "/likeData",
                JSON.stringify({ like: true, data: _0x336aa0, vehID: curVeh }),
              ));
          });
        },
      );
      return;
    }
    let _0x1c0f40 = null;
    for (const _0x5530cd of Object.keys(savedMusic)) {
      const _0x4882b8 = savedMusic[_0x5530cd];
      if (_0x4882b8.musicSrc === _0x583826 && _0x4882b8.saved) {
        ((_0x1c0f40 = _0x4882b8.id), delete savedMusic[_0x5530cd]);
        break;
      }
    }
    $.post(
      `https://${GetParentResourceName()}/saveMusic`,
      JSON.stringify({ like: false, musicID: _0x1c0f40, vehID: curVeh }),
    );
  }));
let defaultPlaylist = {};
($(".home-playlist-app").click(function () {
  const _0x28891e = {
    YnjXH: function (_0x430924, _0x57b3bc) {
      return _0x430924(_0x57b3bc);
    },
    djwwV: ".playlist-app",
    aFpKL: "flex",
    bcMWE: function (_0x193c79, _0x52af54) {
      return _0x193c79(_0x52af54);
    },
    qEpxo: "display",
    AovPJ: ".playlist-middle",
    EdpEZ: function (_0x5834c3) {
      return _0x5834c3();
    },
    tFygP: function (_0x135b52, _0x109fbc) {
      return _0x135b52(_0x109fbc);
    },
    Sqwrw: function (_0x45a538, _0x5b0173) {
      return _0x45a538(_0x5b0173);
    },
    CArah: ".main-slider-apps",
    orErT: "animate__zoomIn",
    YrMJF: function (_0x171a61, _0xd17b52) {
      return _0x171a61(_0xd17b52);
    },
    znMlI: "animate__zoomOut",
    EohrB: function (_0x5ab7c4, _0x5e2f9b) {
      return _0x5ab7c4(_0x5e2f9b);
    },
    Gtaxl: function (_0x3dfc9b, _0x4ee29d) {
      return _0x3dfc9b(_0x4ee29d);
    },
    SvFFh: function (_0x522deb, _0xcee80a) {
      return _0x522deb(_0xcee80a);
    },
    ypYKk: function (_0x5e2af5, _0x165e19) {
      return _0x5e2af5(_0x165e19);
    },
    vvAEo: function (_0x3c23ea, _0x233ea0) {
      return _0x3c23ea + _0x233ea0;
    },
    qvOeS: function (_0x1b62b3, _0x1110a0) {
      return _0x1b62b3 + _0x1110a0;
    },
    OqbqC: "https://",
  };
  if (!loginID) {
    (clearSavedMusic(),
      $(".playlist-middle").html(""),
      $(".main-slider-apps").removeClass("animate__zoomIn"),
      $(".main-slider-apps").addClass("animate__zoomOut"),
      $(".main-slider-apps").fadeOut(250, function () {
        $(".playlist-app").css("display", "flex").hide().fadeIn();
        for (const _0x3c7440 in savedMusic) {
          const _0x1b19a4 = savedMusic[_0x3c7440].saved
              ? '<i class="fa-solid fa-trash-can saved-icon-delete"></i>'
              : "",
            _0x47a270 =
              '\n                    <div class="playlist-song" musicID="' +
              _0x3c7440 +
              '">\n                        <div class="playlist-song-img">\n                            <div class="saved-song-img">\n                                <img src="' +
              savedMusic[_0x3c7440].thumbnailUrl +
              '">\n                            </div>\n                        </div>\n                        <div class="playlist-song-title">\n                            <h1 class="saved-music-title">' +
              savedMusic[_0x3c7440].title +
              '</h1>\n                            <h4 class="saved-sub-artist">' +
              savedMusic[_0x3c7440].authorName +
              '</h4>\n                        </div>\n                        <div class="playlist-song-btns">\n                            <i class="fa-solid fa-play saved-icon-play"></i>\n                            ' +
              _0x1b19a4 +
              "\n                        </div>\n                    </div>\n                ";
          $(".playlist-middle").append(_0x47a270);
        }
      }));
    return;
  }
  $.post(
    `https://${GetParentResourceName()}/fetchPlaylist`,
    JSON.stringify({ login: loginID }),
  ).then((_0xd7b80e) => {
    _0xd7b80e &&
      (clearSavedMusic(),
      _0xd7b80e.forEach((_0x59375f, _0x1575c4) => {
        const _0x4ade25 = JSON.parse(_0x59375f.musicData),
          _0x6b7efc = ++Object.keys(savedMusic).length;
        savedMusic[_0x6b7efc] = {
          saved: true,
          id: _0x59375f.id,
          musicSrc: _0x4ade25.musicSrc,
          title: _0x4ade25.title,
          authorName: _0x4ade25.authorName,
          thumbnailUrl: _0x4ade25.thumbnailUrl,
        };
      }),
      $(".playlist-middle").html(""),
      $(".main-slider-apps").removeClass("animate__zoomIn"),
      $(".main-slider-apps").addClass("animate__zoomOut"),
      $(".main-slider-apps").fadeOut(250, function () {
        $(".playlist-app").css("display", "flex").hide().fadeIn();
        for (const _0x53a4d2 in savedMusic) {
          const _0x2c86c2 = savedMusic[_0x53a4d2].saved
              ? '<i class="fa-solid fa-trash-can saved-icon-delete"></i>'
              : "",
            _0x11f760 =
              '\n                        <div class=\"playlist-song\" musicID=\"' +
              _0x53a4d2 +
              '">\n                            <div class="playlist-song-img">\n                                <div class="saved-song-img">\n                                    <img src="' +
              savedMusic[_0x53a4d2].thumbnailUrl +
              '">\n                                </div>\n                            </div>\n                            <div class="playlist-song-title">\n                                <h1 class="saved-music-title">' +
              savedMusic[_0x53a4d2].title +
              '</h1>\n                                <h4 class="saved-sub-artist">' +
              savedMusic[_0x53a4d2].authorName +
              '</h4>\n                            </div>\n                            <div class="playlist-song-btns">\n                                <i class="fa-solid fa-play saved-icon-play"></i>\n                                ' +
              _0x2c86c2 +
              "\n                            </div>\n                        </div>\n                    ";
          $(".playlist-middle").append(_0x11f760);
        }
      }));
  });
}),
  $(document).on("click", ".saved-icon-delete", function () {
    const _0x4e5a10 = {
        LzSsG: ".playlist-song",
        ltHpA: "musicID",
        vzXUn: "https://",
        lkosu: function (_0x3a726b) {
          return _0x3a726b();
        },
        UDaNI: function (_0x388496, _0x49b327, _0x39dd8a, _0x58755c) {
          return _0x388496(_0x49b327, _0x39dd8a, _0x58755c);
        },
        wWFGX: "image/apps/apple-music.png",
        RufNm: function (_0x90c139, _0x40202e) {
          return _0x90c139(_0x40202e);
        },
        NNmlS: "animate__animated animate__fadeOutRight",
        XfGPN: function (_0x2e5097, _0x232278, _0x3f7f02) {
          return _0x2e5097(_0x232278, _0x3f7f02);
        },
      },
      _0x1f0963 = $(this).closest(".playlist-song").attr("musicID");
    ($.post(
      "https://" + GetParentResourceName() + "/saveMusic",
      JSON.stringify({
        like: false,
        musicID: savedMusic[_0x1f0963].id,
        vehID: curVeh,
      }),
    ),
      _0x4e5a10.UDaNI(
        Notify,
        uiLanguage.music_app,
        uiLanguage.removed_playlist + " " + savedMusic[_0x1f0963].title,
        "image/apps/apple-music.png",
      ),
      delete savedMusic[_0x1f0963],
      $(this)
        .closest(".playlist-song")
        .addClass("animate__animated animate__fadeOutRight"),
      setTimeout(() => {
        $(this).closest(".playlist-song").remove();
      }, 500));
  }),
  $(document).on("click", ".saved-icon-play", function () {
    const _0x45b13f = {
        VZMuF: function (_0xa63c4d, _0x133209) {
          return _0xa63c4d(_0x133209);
        },
        adpTr: ".playlist-song",
        nkBVr: "musicID",
        mlmNc: function (_0x4ae096, _0x4c84ca, _0x4b2fc6, _0x59c5e2) {
          return _0x4ae096(_0x4c84ca, _0x4b2fc6, _0x59c5e2);
        },
        OkYlE: function (_0x2fe90b, _0xefb44d) {
          return _0x2fe90b + _0xefb44d;
        },
        jyZni: "image/apps/apple-music.png",
        cjLve: function (_0xa04e35, _0x2b1801) {
          return _0xa04e35(_0x2b1801);
        },
      },
      _0x55047d = $(this).closest(".playlist-song").attr("musicID");
    (_0x45b13f.mlmNc(
      Notify,
      uiLanguage.music_app,
      uiLanguage.music_play + " " + savedMusic[_0x55047d].title,
      "image/apps/apple-music.png",
    ),
      playMusic(savedMusic[_0x55047d].musicSrc));
  }),
  $(".playlist-back-music").click(function () {
    const _0x2ebdf6 = {
      jlAya: function (_0x1884cf, _0x5b967d) {
        return _0x1884cf(_0x5b967d);
      },
      QQVoF: ".main-slider-apps",
      ZrXRU: "animate__zoomOut",
      IPpCj: "display",
      whIHW: "grid",
      QQzjl: ".playlist-app",
    };
    $(".playlist-app").fadeOut(250, function () {
      ($(".main-slider-apps").removeClass("animate__zoomOut"),
        $(".main-slider-apps").css("display", "grid").hide().fadeIn());
    });
  }),
  $(".home-carinfo-app").click(function () {
    const _0x223a5b = {
      FnxzE: function (_0x2417ef, _0x5d8177) {
        return _0x2417ef(_0x5d8177);
      },
      dccPV: ".engine_health",
      zJwAA: ".temp_health",
      yweWq: ".body_health",
      WPVfo: function (_0x433eb4, _0x4a68bf) {
        return _0x433eb4(_0x4a68bf);
      },
      GMdoc: ".car-details-app",
      uYHyC: function (_0x15dfd6, _0x4e3818) {
        return _0x15dfd6(_0x4e3818);
      },
      ZRVKQ: ".main-slider-apps",
      jZtry: "animate__zoomOut",
      rGOCS: function (_0x5783a6, _0x36bcb5) {
        return _0x5783a6 + _0x36bcb5;
      },
      Rlkoo: function (_0x5db17a, _0x51d320) {
        return _0x5db17a + _0x51d320;
      },
      nBBaX: "https://",
      rcIzK: "/carInfo",
    };
    ($(".main-slider-apps").removeClass("animate__zoomIn"),
      $(".main-slider-apps").addClass("animate__zoomOut"),
      $.post(`https://${GetParentResourceName()}/carInfo`).then((_0x310ce3) => {
        if (_0x310ce3) {
          const _0x2496a8 = "4|3|2|0|1".split("|");
          let _0x30d795 = 0;
          while (true) {
            switch (_0x2496a8[_0x30d795++]) {
              case "0":
                $(".engine_health").text(_0x310ce3.vEngine);
                continue;
              case "1":
                $(".temp_health").text(_0x310ce3.vTemp);
                continue;
              case "2":
                $(".fuel_health").text(_0x310ce3.vFuel);
                continue;
              case "3":
                $(".body_health").text(_0x310ce3.vBody);
                continue;
              case "4":
                $(".car-name-cont").text(_0x310ce3.vName);
                continue;
            }
            break;
          }
        }
      }),
      $(".main-slider-apps").fadeOut(250, function () {
        $(".car-details-app").fadeIn();
      }));
  }));
function updateCarControl(_0xc5bfb6) {
  const _0x268ec0 = {
      UzKWf: "4|1|2|3|0",
      POFmT: function (_0xd952ff, _0x3662ff) {
        return _0xd952ff(_0x3662ff);
      },
      QHSBi: ".musicrgb_btn .icon-active-bar",
      QnjPk: "background-color",
      Zggra: "lightgreen",
      BDWOv: "#222121",
      gVsMQ: function (_0x5d3c26, _0x29be33) {
        return _0x5d3c26 == _0x29be33;
      },
      PsTxh: function (_0x59f9cb, _0x2dfac7) {
        return _0x59f9cb(_0x2dfac7);
      },
      OgJGa: ".headlight_btn .icon-active-bar",
      mgCnf: ".hazard_btn .icon-active-bar",
      XepKf: function (_0x14d4fc, _0x640552) {
        return _0x14d4fc(_0x640552);
      },
      Ncjrb: function (_0x49911a, _0x44d3c9) {
        return _0x49911a(_0x44d3c9);
      },
      VhBtx: ".alldoor_btn .icon-active-bar",
      muPuW: function (_0x30efa5, _0x3fa8f0) {
        return _0x30efa5(_0x3fa8f0);
      },
      LrJcS: ".engine_btn .icon-active-bar",
    },
    _0x3fd556 = "4|1|2|3|0".split("|");
  let _0x287d2b = 0;
  while (true) {
    switch (_0x3fd556[_0x287d2b++]) {
      case "0":
        _0xc5bfb6.vMusicRGB
          ? $(".musicrgb_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".musicrgb_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            );
        continue;
      case "1":
        _0xc5bfb6.vLight || _0xc5bfb6.vLight == 1
          ? $(".headlight_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".headlight_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            );
        continue;
      case "2":
        _0xc5bfb6.vHazard
          ? $(".hazard_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".hazard_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            );
        continue;
      case "3":
        _0xc5bfb6.vDoors
          ? $(".alldoor_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".alldoor_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            );
        continue;
      case "4":
        _0xc5bfb6.vEngine
          ? $(".engine_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".engine_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            );
        continue;
    }
    break;
  }
}
($(".car-control-button").click(function () {
  const _0x1ed541 = {
    eYPSn: function (_0x6635a0, _0x1591e6) {
      return _0x6635a0(_0x1591e6);
    },
    VxtfP: ".vehicle-control-app",
    UROoU: ".musicrgb_btn",
    WtNOL: function (_0x1ff5be, _0x5af0dc) {
      return _0x1ff5be + _0x5af0dc;
    },
    goxSC: function (_0x2d7f54) {
      return _0x2d7f54();
    },
    RWyRY: "/carControl",
    lOqhh: ".car-details-app",
  };
  (!musicRGB ? $(".musicrgb_btn").hide() : $(".musicrgb_btn").show(),
    $.post("https://" + GetParentResourceName() + "/carControl").then(
      (_0x3e1a10) => {
        _0x3e1a10 && updateCarControl(_0x3e1a10);
      },
    ),
    $(".car-details-app").fadeOut(250, function () {
      $(".vehicle-control-app").fadeIn();
    }));
}),
  $(".car-details-exit").click(function () {
    const _0x521ca9 = {
      lrFVx: function (_0xae333c, _0x5842d6) {
        return _0xae333c(_0x5842d6);
      },
      FQHde: ".main-slider-apps",
      rhoKg: "animate__zoomOut",
      AoLAS: "display",
      StPpl: function (_0x47260a, _0xbf2fd0) {
        return _0x47260a(_0xbf2fd0);
      },
      jaMOt: ".car-details-app",
    };
    $(".car-details-app").fadeOut(250, function () {
      ($(".main-slider-apps").removeClass("animate__zoomOut"),
        $(".main-slider-apps").css("display", "grid").hide().fadeIn());
    });
  }),
  $(".home-carcontrol-app").click(function () {
    const _0x472667 = {
      dDSvt: function (_0x350b7c, _0x5bc83b) {
        return _0x350b7c(_0x5bc83b);
      },
      EsHFM: function (_0x5687da, _0x40a359) {
        return _0x5687da(_0x40a359);
      },
      fCRjk: ".vehicle-control-app",
      JKhBr: ".musicrgb_btn",
      JPgFG: function (_0x479407, _0xacebb1) {
        return _0x479407(_0xacebb1);
      },
      baLhE: function (_0x4ca772, _0x4e8aec) {
        return _0x4ca772 + _0x4e8aec;
      },
      nhZPo: function (_0x2a533d) {
        return _0x2a533d();
      },
      pSvXj: "/carControl",
      lVGqt: ".main-slider-apps",
      YPNeF: "animate__zoomIn",
      Jqlxj: function (_0xcb143d, _0x3dcbcd) {
        return _0xcb143d(_0x3dcbcd);
      },
      YAzap: "animate__zoomOut",
      gFIxj: function (_0x9866c0, _0x2050e1) {
        return _0x9866c0(_0x2050e1);
      },
    };
    (!musicRGB ? $(".musicrgb_btn").hide() : $(".musicrgb_btn").show(),
      $.post(`https://${GetParentResourceName()}/carControl`).then(
        (_0x4f68c5) => {
          _0x4f68c5 && updateCarControl(_0x4f68c5);
        },
      ),
      $(".main-slider-apps").removeClass("animate__zoomIn"),
      $(".main-slider-apps").addClass("animate__zoomOut"),
      $(".main-slider-apps").fadeOut(250, function () {
        $(".vehicle-control-app").fadeIn();
      }));
  }),
  $(".car-control-exit").click(function () {
    const _0x154446 = {
      GYrzA: function (_0x551aaf, _0x1a1230) {
        return _0x551aaf(_0x1a1230);
      },
      YTqpz: ".main-slider-apps",
      WmSCg: "display",
      iMqUt: "grid",
      prrTg: ".vehicle-control-app",
    };
    $(".vehicle-control-app").fadeOut(250, function () {
      ($(".main-slider-apps").removeClass("animate__zoomOut"),
        $(".main-slider-apps").css("display", "grid").hide().fadeIn());
    });
  }),
  $(".engine_btn").click(function () {
    const _0x4ffc1f = {
      vgOal: function (_0x1ffac2, _0x5a6ea5) {
        return _0x1ffac2 === _0x5a6ea5;
      },
      gYzHv: function (_0x280e05, _0x2b590d) {
        return _0x280e05(_0x2b590d);
      },
      MDGxi: ".engine_btn .icon-active-bar",
      pgoLX: "background-color",
      EkshL: "lightgreen",
      sRDqq: "#222121",
      MPDLG: function (_0x67f348, _0x2c1edf) {
        return _0x67f348 + _0x2c1edf;
      },
      iljyH: function (_0x4e2dcd, _0x575685) {
        return _0x4e2dcd + _0x575685;
      },
      dwaSI: "https://",
      GeaXz: "/carAction",
      vrRTz: "engine",
    };
    $.post(
      "https://" + GetParentResourceName() + "/carAction",
      JSON.stringify({ type: "engine" }),
    ).then(function (_0x3ef36b) {
      _0x3ef36b &&
        (_0x3ef36b === "ON"
          ? $(".engine_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".engine_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            ));
    });
  }),
  $(".alldoor_btn").click(function () {
    const _0x78b9c = {
      ovAKe: function (_0x269b65, _0x5eae48) {
        return _0x269b65 === _0x5eae48;
      },
      dDnzz: "OPEN",
      SFgxl: function (_0x2b01fc, _0x182320) {
        return _0x2b01fc(_0x182320);
      },
      SBvfg: ".alldoor_btn .icon-active-bar",
      zhGNt: "background-color",
      cmCcG: "lightgreen",
      YVBRh: "#222121",
      pBGEZ: function (_0x261dba, _0x3fc304) {
        return _0x261dba + _0x3fc304;
      },
      LEEAA: "https://",
      hzsJQ: function (_0x413b4e) {
        return _0x413b4e();
      },
      bSUUE: "/carAction",
    };
    $.post(
      `https://${GetParentResourceName()}/carAction`,
      JSON.stringify({ type: "allDoor" }),
    ).then(function (_0x7f394d) {
      _0x7f394d &&
        (_0x7f394d === "OPEN"
          ? $(".alldoor_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".alldoor_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            ));
    });
  }),
  $(".headlight_btn").click(function () {
    const _0x34862e = {
      ygVaA: function (_0x35f10b, _0x2526ff) {
        return _0x35f10b(_0x2526ff);
      },
      ORNKW: "background-color",
      vcKmV: "lightgreen",
      Qkpln: "#222121",
      lFpvx: function (_0x1b3c9e, _0x408bc2) {
        return _0x1b3c9e + _0x408bc2;
      },
      uftTl: function (_0x152ca9) {
        return _0x152ca9();
      },
      KgCEP: "/carAction",
      BfTaq: "headlight",
    };
    $.post(
      `https://${GetParentResourceName()}/carAction`,
      JSON.stringify({ type: "headlight" }),
    ).then(function (_0x346601) {
      _0x346601 &&
        (_0x346601 === "ON"
          ? $(".headlight_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".headlight_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            ));
    });
  }),
  $(".hazard_btn").click(function () {
    const _0x9eba29 = {
      PGjIs: function (_0x139329, _0x25d87d) {
        return _0x139329 === _0x25d87d;
      },
      zLRqq: function (_0x45f724, _0x312279) {
        return _0x45f724(_0x312279);
      },
      HoojE: ".hazard_btn .icon-active-bar",
      ypiCq: "background-color",
      udBSR: "lightgreen",
      AFEjG: function (_0x5eb929, _0x85adcf) {
        return _0x5eb929(_0x85adcf);
      },
      sXMkr: function (_0x1d1867, _0x27fe98) {
        return _0x1d1867 + _0x27fe98;
      },
      xyqhh: "https://",
      bwfsz: function (_0x645478) {
        return _0x645478();
      },
      iVlOw: "/carAction",
      pAOqP: "hazard",
    };
    $.post(
      "https://" + GetParentResourceName() + "/carAction",
      JSON.stringify({ type: "hazard" }),
    ).then(function (_0x474a38) {
      _0x474a38 &&
        (_0x474a38 === "ON"
          ? $(".hazard_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".hazard_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            ));
    });
  }),
  $(".musicrgb_btn").click(function () {
    const _0x447c6a = {
      tmdev: function (_0x46c2a9, _0x512073) {
        return _0x46c2a9 === _0x512073;
      },
      rhOHn: function (_0x9470f6, _0x1f3c5e) {
        return _0x9470f6(_0x1f3c5e);
      },
      lKMfl: "background-color",
      UHSUn: "lightgreen",
      hiUmv: function (_0x1483df, _0x39cf08) {
        return _0x1483df + _0x39cf08;
      },
      zkKCQ: "https://",
      XnmpF: "rgb",
    };
    $.post(
      `https://${GetParentResourceName()}/carAction`,
      JSON.stringify({ type: "rgb" }),
    ).then(function (_0x4be777) {
      _0x4be777 &&
        (_0x4be777 === "ON"
          ? $(".musicrgb_btn .icon-active-bar").css(
              "background-color",
              "lightgreen",
            )
          : $(".musicrgb_btn .icon-active-bar").css(
              "background-color",
              "#222121",
            ));
    });
  }),
  $(".window0_btn, .window1_btn, .window2_btn, .window3_btn").click(
    function () {
      const _0x5b465a = {
        rvgMv: function (_0x177797, _0x4447ce) {
          return _0x177797(_0x4447ce);
        },
        LikIx: "class",
        gNcqA: function (_0xeeed96, _0x140406) {
          return _0xeeed96 + _0x140406;
        },
        EjZUq: function (_0x3c74c4, _0x4ac2ae) {
          return _0x3c74c4 + _0x4ac2ae;
        },
        TuGJc: function (_0x3adab5) {
          return _0x3adab5();
        },
        kqKfX: "/carAction",
      };
      ($(this).attr("class").split(" "),
        (_0x6f094d = _0x5f32a2[1].match(/\d+/)[0]));
      $.post(
        `https://${GetParentResourceName()}/carAction`,
        JSON.stringify({ type: "window", window: _0x6f094d }),
      );
    },
  ),
  $(
    ".door0_btn, .door1_btn, .door2_btn, .door3_btn, .door4_btn, .door5_btn",
  ).click(function () {
    const _0x2a576a = {
      QrkMy: function (_0x19c6ce, _0x11b959) {
        return _0x19c6ce(_0x11b959);
      },
      bQwKi: "class",
      eWxBY: function (_0x368354, _0x58cc1b) {
        return _0x368354 + _0x58cc1b;
      },
      DVgcq: "https://",
      SeVMR: function (_0x423231) {
        return _0x423231();
      },
      cZFxh: "/carAction",
      oQHbb: "door",
    };
    ($(this).attr("class").split(" "),
      (_0x4a3b9f = _0x5b4e7b[1].match(/\d+/)[0]));
    $.post(
      "https://" + GetParentResourceName() + "/carAction",
      JSON.stringify({ type: "door", door: _0x4a3b9f }),
    );
  }),
  $(".seat10_btn, .seat0_btn, .seat1_btn, .seat2_btn").click(function () {
    const _0x4d7a3d = {
      cTtxl: function (_0x20e1a9, _0x5e7593) {
        return _0x20e1a9 + _0x5e7593;
      },
      OgESw: "/carAction",
      vuuhi: "seat",
    };
    var _0xbe06f2 = $(this).attr("class").split(" "),
      _0x5db8bb = _0xbe06f2[1].match(/\d+/)[0];
    (_0x5db8bb === "10" && (_0x5db8bb = "-1"),
      $.post(
        "https://" + GetParentResourceName() + "/carAction",
        JSON.stringify({ type: "seat", seat: _0x5db8bb }),
      ));
  }),
  $(".left-camera-icon, .home-camera-app").click(function () {
    const _0x3bb656 = {
      csBwl: function (_0x5d5faa, _0x163389) {
        return _0x5d5faa + _0x163389;
      },
      HkonX: "https://",
      aFETu: function (_0x1df150) {
        return _0x1df150();
      },
      DCAGl: "/carCamera",
      CzQOO: "back",
      JzvoY: ".drag-container",
      fkxba: function (_0x51f087, _0x293f6c) {
        return _0x51f087(_0x293f6c);
      },
      fQdjE: ".camera-container",
      AXsqF: "display",
      UdgRD: "flex",
    };
    ($.post(
      `https://${GetParentResourceName()}/carCamera`,
      JSON.stringify("back"),
    ),
      $(".drag-container").hide(),
      $(".camera-container").css("display", "flex").hide().fadeIn());
  }),
  $(".front-cam").click(function () {
    const _0x135f3e = {
      eDbGT: function (_0x2a0aef, _0x1f4563) {
        return _0x2a0aef + _0x1f4563;
      },
      VwhDV: "https://",
      JbiwT: function (_0x312d34) {
        return _0x312d34();
      },
      CXGvZ: "/carCamera",
      CJDvW: "front",
    };
    $.post(
      `https://${GetParentResourceName()}/carCamera`,
      JSON.stringify("front"),
    );
  }),
  $(".exit-cam").click(function () {
    const _0x4fd67a = {
      DSzjo: function (_0xb92066, _0x2c970c) {
        return _0xb92066 + _0x2c970c;
      },
      mHQif: "exit",
    };
    ($.post(
      `https://${GetParentResourceName()}/carCamera`,
      JSON.stringify("exit"),
    ),
      $(".camera-container").fadeOut());
  }),
  $(".back-cam").click(function () {
    const _0x5385b8 = {
      ufCRr: function (_0x476345, _0x48a34d) {
        return _0x476345 + _0x48a34d;
      },
      nVwht: "https://",
      yLjiG: function (_0x3cc7c8) {
        return _0x3cc7c8();
      },
      sMKLz: "/carCamera",
    };
    $.post(
      "https://" + GetParentResourceName() + "/carCamera",
      JSON.stringify("back"),
    );
  }));
var camAlarm = false;
function parkSound() {
  const _0x1ba3cb = {
    SxLGm: "4|0|3|1|2",
    oIFKw: "ended",
    ZYjzd: "sound/autopilot_error.mp3",
  };
  if (!camAlarm) {
    "2|4|1|3|0".split("|");
    let _0x38d6f8 = 0;
    while (true) {
      switch (_0x456569[_0x38d6f8++]) {
        case "0":
          _0x527dfd.volume = 0.3;
          continue;
        case "1":
          camAlarm = true;
          continue;
        case "2":
          _0x527dfd.addEventListener("ended", function () {
            camAlarm = false;
          });
          continue;
        case "3":
          _0x527dfd.play();
          continue;
        case "4":
          var _0x527dfd = new Audio("sound/autopilot_error.mp3");
          continue;
      }
      break;
    }
  }
}
($(".home-video-app").click(function () {
  const _0x3f93c1 = {
    VKhrZ: function (_0x2bed23, _0x5c778f) {
      return _0x2bed23(_0x5c778f);
    },
    HjfGO: ".video-app",
    sQAPt: ".main-slider-apps",
    NVVpq: "animate__zoomIn",
    vznfN: "animate__zoomOut",
  };
  ($(".main-slider-apps").removeClass("animate__zoomIn"),
    $(".main-slider-apps").addClass("animate__zoomOut"),
    $(".main-slider-apps").fadeOut(250, function () {
      $(".video-app").fadeIn();
    }));
}),
  $(".video-back-btn").click(function () {
    const _0x200e28 = {
      CZsqo: function (_0xe9ba98, _0x28c28b) {
        return _0xe9ba98(_0x28c28b);
      },
      rmBcF: ".main-slider-apps",
      bbqsw: "animate__zoomOut",
      NnmaO: "display",
      ybwSV: function (_0x3942ca, _0x50d5bf) {
        return _0x3942ca(_0x50d5bf);
      },
    };
    $(".video-app").fadeOut(250, function () {
      ($(".main-slider-apps").removeClass("animate__zoomOut"),
        $(".main-slider-apps").css("display", "grid").hide().fadeIn());
    });
  }));
function showGame(_0x334cdf) {
  var snakeApp = $(".snake-game-app");
  var spinner = $('<div class="spinner"></div>');
  snakeApp.append(spinner);
  var iframe = document.createElement("iframe");
  iframe.src = "http://slither.io";
  iframe.scrolling = "no";
  iframe.allowfullscreen = "";
  iframe.style.borderRadius = "0 4vh 4vh 0";
  iframe.style.width = "43.5vw";
  iframe.style.height = "46vh";
  iframe.frameBorder = "0";
  snakeApp.append(iframe);
  iframe.addEventListener("load", function () {
    spinner.remove();
  });
}
($(".home-snake-game").click(function () {
  const _0xd33656 = {
    Kkqwl: function (_0x4fc000) {
      return _0x4fc000();
    },
    PgYeu: function (_0x56c189, _0x2c90c0) {
      return _0x56c189(_0x2c90c0);
    },
    EDdLD: ".snake-game-app",
    jqZJp: "display",
    vWhpv: "flex",
    POQMz: "animate__zoomIn",
    ysWFn: function (_0x44fe28, _0xf955f6) {
      return _0x44fe28(_0xf955f6);
    },
    PJPfR: ".main-slider-apps",
    Bkxgy: "animate__zoomOut",
    hbplo: function (_0x4f0917, _0x8647d4) {
      return _0x4f0917(_0x8647d4);
    },
  };
  ($(".main-slider-apps").removeClass("animate__zoomIn"),
    $(".main-slider-apps").addClass("animate__zoomOut"),
    $(".main-slider-apps").fadeOut(250, function () {
      const _0x7daf9e = {
        mncJt: function (_0x258122) {
          return _0x258122();
        },
      };
      $(".snake-game-app")
        .css("display", "flex")
        .hide()
        .fadeIn(250, function () {
          showGame();
        });
    }));
}),
  $(".home-dashboard-app").click(function () {
    const _0x190f60 = {
      BjMfM: function (_0x44f39c, _0x5a872e) {
        return _0x44f39c + _0x5a872e;
      },
      gxooo: "https://",
      ROiry: "/carDashboard",
      Ctiix: function (_0x2a515d, _0x380a22) {
        return _0x2a515d(_0x380a22);
      },
      CmpfA: ".dashboard-app",
      xKFjK: function (_0x336c0a, _0x8a5ba1) {
        return _0x336c0a(_0x8a5ba1);
      },
      SpUlH: function (_0x2f531b, _0x22a881) {
        return _0x2f531b(_0x22a881);
      },
      tPYnE: "animate__zoomOut",
      AulHL: ".main-slider-apps",
    };
    ($(".main-slider-apps").removeClass("animate__zoomIn"),
      $(".main-slider-apps").addClass("animate__zoomOut"),
      $(".main-slider-apps").fadeOut(250, function () {
        ($.post(
          "https://" + GetParentResourceName() + "/carDashboard",
          JSON.stringify(true),
        ),
          $(".dashboard-app").fadeIn());
      }));
  }),
  $(".dashboard-back-btn").click(function () {
    const _0x2402fc = {
      zkFzg: function (_0x14f407, _0xd86e40) {
        return _0x14f407 + _0xd86e40;
      },
      ezZNl: "https://",
      WHBhE: function (_0x5a24ae) {
        return _0x5a24ae();
      },
      qVkvf: "/carDashboard",
      kuGun: ".main-slider-apps",
      qDFQB: function (_0x1ceac4, _0x12dc3b) {
        return _0x1ceac4(_0x12dc3b);
      },
      Ulpfk: "display",
      UsPvE: "grid",
      KfvJn: function (_0x5e4597, _0x3b8353) {
        return _0x5e4597(_0x3b8353);
      },
      EZIux: ".dashboard-app",
    };
    $(".dashboard-app").fadeOut(250, function () {
      ($.post(
        "https://" + GetParentResourceName() + "/carDashboard",
        JSON.stringify(false),
      ),
        $(".main-slider-apps").removeClass("animate__zoomOut"),
        $(".main-slider-apps").css("display", "grid").hide().fadeIn());
    });
  }),
  $(".dashboard-start-container").click(function () {
    const _0x2fc05a = {
      TcBGD: function (_0x12d4ce, _0x2129c7) {
        return _0x12d4ce(_0x2129c7);
      },
      WRjfj: ".dashboard-content-box",
      JCldS: "flex",
      FeGDc: function (_0x28da9a, _0x227883) {
        return _0x28da9a == _0x227883;
      },
      VYMuu: "start",
      QUyYo: function (_0x346002, _0x29ac75) {
        return _0x346002(_0x29ac75);
      },
      RRxwE: function (_0x9f275d, _0x156695) {
        return _0x9f275d(_0x156695);
      },
      JWlyX: ".dashboard-location-title",
      fLLdD: ".dashboard-distance-title",
      cVxTi: function (_0x1c1381, _0x20c15c) {
        return _0x1c1381 + _0x20c15c;
      },
      UnVSr: ".dashboard-start-container",
      QRXcA: function (_0x5abe5f, _0x4ce0cd, _0x45f517, _0x1a0d61) {
        return _0x5abe5f(_0x4ce0cd, _0x45f517, _0x1a0d61);
      },
      sSkrb: "image/apps/my-shortcuts.png",
      QchZI: function (_0x1b1557, _0x5b033d) {
        return _0x1b1557 == _0x5b033d;
      },
      iUefh: "no_marker",
      UdpLu: function (_0x213955, _0x4c611f) {
        return _0x213955 == _0x4c611f;
      },
      fyFdd: "https://",
    };
    $.post(
      "https://" + GetParentResourceName() + "/autoPilot",
      JSON.stringify(true),
    ).then((_0x54f0d0) => {
      if (_0x54f0d0[0] == "start") {
        const _0x2aff3a = _0x54f0d0[2],
          _0x1cbb49 = parseFloat(_0x2aff3a),
          _0x40b371 = _0x1cbb49.toFixed(2),
          _0x58df31 = _0x2aff3a.split(" ")[1];
        ($(".dashboard-location-title").text(_0x54f0d0[1]),
          $(".dashboard-distance-title").text(_0x40b371 + " " + _0x58df31),
          $(".dashboard-start-container").fadeOut(200, function () {
            $(".dashboard-content-box").css("display", "flex");
          }),
          _0x2fc05a.QRXcA(
            Notify,
            uiLanguage.carautomation_app,
            uiLanguage.autopilot_on,
            "image/apps/my-shortcuts.png",
          ));
        var _0x4e3eec = new Audio("sound/autopilot_on.mp3");
        ((_0x4e3eec.volume = 0.3), _0x4e3eec.play());
      } else {
        if (_0x54f0d0 == "no_marker") {
          _0x2fc05a.QRXcA(
            Notify,
            uiLanguage.carautomation_app,
            uiLanguage.autopilot_error,
            "image/apps/my-shortcuts.png",
          );
          var _0x4e3eec = new Audio("sound/autopilot_error.mp3");
          ((_0x4e3eec.volume = 0.3), _0x4e3eec.play());
        } else {
          if (_0x54f0d0 == "no_driver") {
            _0x2fc05a.QRXcA(
              Notify,
              uiLanguage.carautomation_app,
              uiLanguage.autopilot_driver,
              "image/apps/my-shortcuts.png",
            );
            var _0x4e3eec = new Audio("sound/autopilot_error.mp3");
            ((_0x4e3eec.volume = 0.3), _0x4e3eec.play());
          }
        }
      }
    });
  }),
  $(".dashboard-stop-btn").click(function () {
    const _0x133a17 = {
      ysgIW: function (_0xac0be8, _0x409e82) {
        return _0xac0be8(_0x409e82);
      },
      eBhOc: ".dashboard-start-container",
      Mysku: "display",
      EEXNs: "flex",
      uSwHi: function (_0xe5109b, _0x6d639d) {
        return _0xe5109b + _0x6d639d;
      },
      kdjlW: function (_0x98e9b2, _0x427dac, _0x4ea39c, _0x4a2935) {
        return _0x98e9b2(_0x427dac, _0x4ea39c, _0x4a2935);
      },
      neARV: ".dashboard-content-box",
    };
    ($.post(
      "https://" + GetParentResourceName() + "/autoPilot",
      JSON.stringify(false),
    ),
      _0x133a17.kdjlW(
        Notify,
        uiLanguage.carautomation_app,
        uiLanguage.autopilot_off,
        "image/apps/my-shortcuts.png",
      ));
    var _0x459de5 = new Audio("sound/autopilot_off.mp3");
    ((_0x459de5.volume = 0.3),
      _0x459de5.play(),
      $(".dashboard-content-box").fadeOut(200, function () {
        $(".dashboard-start-container").css("display", "flex");
      }));
  }));
function updateSpeed(_0x5f4e9c) {
  const _0x49a927 = {
    OxTHS: function (_0x43f471, _0x503b6d) {
      return _0x43f471(_0x503b6d);
    },
    xntck: ".dashboard-speed-box h2",
  };
  ($(".dashboard-speed-box h2").text(_0x5f4e9c.speed),
    $(".dashboard-rpm-box h2").text(_0x5f4e9c.rpm));
}
($(".home-timer-app").click(function () {
  const _0x1ded43 = {
    qpMSB: function (_0x101c12, _0x5c745a) {
      return _0x101c12(_0x5c745a);
    },
    OoDyC: ".stop-watch-app",
    TuggW: ".main-slider-apps",
    Nixcn: "animate__zoomIn",
    nWbop: function (_0x57038c, _0x4c2222) {
      return _0x57038c(_0x4c2222);
    },
    PhTUI: "animate__zoomOut",
  };
  ($(".main-slider-apps").removeClass("animate__zoomIn"),
    $(".main-slider-apps").addClass("animate__zoomOut"),
    $(".main-slider-apps").fadeOut(250, function () {
      $(".stop-watch-app").fadeIn();
    }));
}),
  $(".timer-back-btn").click(function () {
    const _0x4f24fa = {
      YxzxN: function (_0x5b898a, _0x1e73d2) {
        return _0x5b898a(_0x1e73d2);
      },
      vnnOT: "animate__zoomOut",
      DkWMT: function (_0x943b87, _0x16a241) {
        return _0x943b87(_0x16a241);
      },
      ajFMU: "display",
      Eksnm: "grid",
      AbGQf: ".stop-watch-app",
    };
    $(".stop-watch-app").fadeOut(250, function () {
      ($(".main-slider-apps").removeClass("animate__zoomOut"),
        $(".main-slider-apps").css("display", "grid").hide().fadeIn());
    });
  }));
function doubleDigits(_0x52c0be) {
  const _0x179fbf = {
    PKjdN: function (_0x18bde5, _0x105d63) {
      return _0x18bde5 + _0x105d63;
    },
  };
  return ("0" + _0x52c0be).slice(-2);
}
const timer = $(".timer-stopwatch"),
  tracker = $(".tracker"),
  startBtn = $(".start-btn"),
  pauseBtn = $(".pause-btn"),
  resetBtn = $(".reset-btn"),
  lapBtn = $(".lap-btn");
class Counter {
  constructor(_0x290444 = 0, _0xc94acb = 0, _0xdf32b3 = 0) {
    ((this.minutes = _0x290444),
      (this.seconds = _0xc94acb),
      (this.milliseconds = _0xdf32b3),
      (this.startTimer = function () {
        (this.milliseconds++,
          this.milliseconds > 99 && (this.seconds++, (this.milliseconds = 0)),
          this.seconds > 59 && (this.minutes++, (this.seconds = 0)));
      }));
  }
}
let isCounting = false,
  laps = [],
  currentCounter,
  mainCounter = new Counter(),
  animationFrameId;
function updateHTML() {
  const _0x22ffaa = {
    psqmp: function (_0x25c901, _0x4fd77a) {
      return _0x25c901(_0x4fd77a);
    },
    RVXAh: function (_0x4b05de, _0x18729b) {
      return _0x4b05de(_0x18729b);
    },
  };
  (startBtn.toggle(!isCounting),
    pauseBtn.toggle(isCounting),
    resetBtn.toggle(!isCounting),
    lapBtn.toggle(isCounting));
  (doubleDigits(mainCounter.minutes),
    (_0x14d984 = doubleDigits(mainCounter.seconds)),
    (_0x5b07 = doubleDigits(mainCounter.milliseconds)),
    (_0x40841c = _0x558ec2 + ":" + _0x14d984 + "." + _0x5b07));
  timer.text(_0x40841c);
}
function updateLapHTML() {
  const _0x3e9b55 = {
    ZvjNK: function (_0x5294b9, _0x556f62) {
      return _0x5294b9(_0x556f62);
    },
    JZFOR: function (_0x16ba9d, _0x4b5b62) {
      return _0x16ba9d(_0x4b5b62);
    },
    MIPej: function (_0x150de9, _0x35dde7) {
      return _0x150de9(_0x35dde7);
    },
  };
  let _0x113aa2 = "";
  (laps.reverse().forEach((_0x2cf446, _0x25398e) => {
    _0x113aa2 +=
      '\n        <div class="lap-data">\n            <span>Lap ' +
      (_0x25398e + 1) +
      "</span><span>" +
      doubleDigits(_0x2cf446.minutes) +
      ":" +
      doubleDigits(_0x2cf446.seconds) +
      ":" +
      doubleDigits(_0x2cf446.milliseconds) +
      "</span>\n        </div>";
  }),
    tracker.html(_0x113aa2));
}
function addLap() {
  ((currentCounter = new Counter()), (laps = [...laps, currentCounter]));
}
(lapBtn.on("click", addLap),
  startBtn.on("click", () => {
    const _0x1768a7 = {
      FEErG: function (_0x4dd596) {
        return _0x4dd596();
      },
      LICPP: function (_0x36ee0a) {
        return _0x36ee0a();
      },
    };
    if (!isCounting) {
      isCounting = true;
      if (!laps.length) addLap();
      animateTimer();
    }
  }));
function animateTimer() {
  const _0x2e5793 = {
      mhFmQ: "4|0|1|2|3",
      TdwWZ: function (_0x1fa8fe) {
        return _0x1fa8fe();
      },
      oyDBk: function (_0x334769, _0x5be74e) {
        return _0x334769(_0x5be74e);
      },
    },
    _0x5d05b0 = "4|0|1|2|3".split("|");
  let _0x174b74 = 0;
  while (true) {
    switch (_0x5d05b0[_0x174b74++]) {
      case "0":
        currentCounter.startTimer();
        continue;
      case "1":
        updateHTML();
        continue;
      case "2":
        updateLapHTML();
        continue;
      case "3":
        animationFrameId = requestAnimationFrame(animateTimer);
        continue;
      case "4":
        mainCounter.startTimer();
        continue;
    }
    break;
  }
}
(pauseBtn.on("click", () => {
  const _0x4478ec = {
    PImyW: function (_0x260ba1, _0x5597a2) {
      return _0x260ba1(_0x5597a2);
    },
    mjYoF: function (_0x23634a) {
      return _0x23634a();
    },
  };
  ((isCounting = false), cancelAnimationFrame(animationFrameId), updateHTML());
}),
  resetBtn.on("click", () => {
    const _0x1868d1 = {
        CUSdQ: "1|7|4|6|8|2|5|3|0",
        cKQRh: function (_0xa6afcb) {
          return _0xa6afcb();
        },
        SmHNS: function (_0x49efc8) {
          return _0x49efc8();
        },
      },
      _0xb9e634 = "1|7|4|6|8|2|5|3|0".split("|");
    let _0x4c8cac = 0;
    while (true) {
      switch (_0xb9e634[_0x4c8cac++]) {
        case "0":
          lapBtn.show();
          continue;
        case "1":
          isCounting = false;
          continue;
        case "2":
          updateLapHTML();
          continue;
        case "3":
          resetBtn.hide();
          continue;
        case "4":
          mainCounter.seconds = 0;
          continue;
        case "5":
          updateHTML();
          continue;
        case "6":
          mainCounter.milliseconds = 0;
          continue;
        case "7":
          mainCounter.minutes = 0;
          continue;
        case "8":
          laps = [];
          continue;
      }
      break;
    }
  }));
function clearStopwatch() {
  const _0xc74c85 = {
      OmUER: "9|3|0|6|8|5|7|2|4|1",
      IQAmE: function (_0x117c96) {
        return _0x117c96();
      },
      whGgH: function (_0x485ff8, _0x59091a) {
        return _0x485ff8(_0x59091a);
      },
    },
    _0x276bd2 = "9|3|0|6|8|5|7|2|4|1".split("|");
  let _0x193647 = 0;
  while (true) {
    switch (_0x276bd2[_0x193647++]) {
      case "0":
        mainCounter.minutes = 0;
        continue;
      case "1":
        lapBtn.show();
        continue;
      case "2":
        updateHTML();
        continue;
      case "3":
        isCounting = false;
        continue;
      case "4":
        resetBtn.hide();
        continue;
      case "5":
        laps = [];
        continue;
      case "6":
        mainCounter.seconds = 0;
        continue;
      case "7":
        tracker.empty();
        continue;
      case "8":
        mainCounter.milliseconds = 0;
        continue;
      case "9":
        cancelAnimationFrame(animationFrameId);
        continue;
    }
    break;
  }
}
($(".home-settings-app").click(function () {
  const _0x379278 = {
    oxEKI: ".settings-app",
    tDDPJ: function (_0x560330, _0x1661c9) {
      return _0x560330(_0x1661c9);
    },
    UHAgp: "animate__zoomIn",
    yfaOk: function (_0x5881d4, _0x158e4b) {
      return _0x5881d4(_0x158e4b);
    },
    ihXLA: ".main-slider-apps",
    yyXqP: function (_0x48271b, _0x542976) {
      return _0x48271b(_0x542976);
    },
  };
  ($(".main-slider-apps").removeClass("animate__zoomIn"),
    $(".main-slider-apps").addClass("animate__zoomOut"),
    $(".main-slider-apps").fadeOut(250, function () {
      $(".settings-app").fadeIn();
    }));
}),
  $(".settings-back-btn").click(function () {
    const _0x37cc9d = {
      zIWeY: function (_0x41cde3, _0x36fb1b) {
        return _0x41cde3(_0x36fb1b);
      },
      jObdc: ".main-slider-apps",
      TZRAl: "animate__zoomOut",
      PgBWl: function (_0xac8fd1, _0x3b89c1) {
        return _0xac8fd1(_0x3b89c1);
      },
      gKJdd: "display",
      cEakE: "grid",
      jQHxW: ".settings-app",
    };
    $(".settings-app").fadeOut(250, function () {
      ($(".main-slider-apps").removeClass("animate__zoomOut"),
        $(".main-slider-apps").css("display", "grid").hide().fadeIn());
    });
  }));
let darkMode = true;
function applyTheme() {
  const _0x34a70b = {
    egigK: function (_0x45f0ef, _0x740827) {
      return _0x45f0ef(_0x740827);
    },
    FjOVY: "light-mode",
    xzbFD: "dark-mode",
    YMdlh: ".mini-ui-draggable",
    yHXME: ".dark-mode-btn .settings-arrow",
    PPMaP: function (_0xda5af5, _0x2b8654) {
      return _0xda5af5(_0x2b8654);
    },
    DzbIC: "fa-check",
    kzAmg: function (_0x1f0874, _0x521623) {
      return _0x1f0874(_0x521623);
    },
    igsQI: function (_0xb8a0fc, _0x27081f) {
      return _0xb8a0fc(_0x27081f);
    },
    mCzUY: ".light-mode-btn .settings-arrow",
  };
  darkMode
    ? ($(".wrapper").removeClass("light-mode").addClass("dark-mode"),
      $(".mini-ui-draggable").removeClass("light-mode").addClass("dark-mode"),
      $(".dark-mode-btn .settings-arrow").addClass("fa-check"),
      $(".light-mode-btn .settings-arrow").removeClass("fa-check"))
    : ($(".wrapper").removeClass("dark-mode").addClass("light-mode"),
      $(".mini-ui-draggable").removeClass("dark-mode").addClass("light-mode"),
      $(".light-mode-btn .settings-arrow").addClass("fa-check"),
      $(".dark-mode-btn .settings-arrow").removeClass("fa-check"));
}
($(".dark-mode-btn, .light-mode-btn").click(function () {
  const _0x13c391 = {
    gMJWT: function (_0x68682a, _0x1e34ab) {
      return _0x68682a(_0x1e34ab);
    },
    ZVVCz: "dark-mode-btn",
    PiteT: "carPlayTheme",
    HXhxm: "dark",
    BSuNJ: "light",
  };
  ((darkMode = $(this).hasClass("dark-mode-btn")),
    localStorage.setItem("carPlayTheme", darkMode ? "dark" : "light"),
    applyTheme());
}),
  $(".apperance-box").click(function () {
    const _0x578f22 = {
      ZqAcO: function (_0x343b24, _0x225e3c) {
        return _0x343b24(_0x225e3c);
      },
      UkJHl: ".appearance-setting",
      EvwzC: "fa-check",
      OwbBb: function (_0x4a4aca, _0x5dabff) {
        return _0x4a4aca(_0x5dabff);
      },
      VBSjO: ".dark-mode-btn .settings-arrow",
      WMIXI: function (_0x22fde4, _0x468355) {
        return _0x22fde4(_0x468355);
      },
      MORZQ: ".settings-app",
    };
    (darkMode
      ? ($(".dark-mode-btn .settings-arrow").addClass("fa-check"),
        $(".light-mode-btn .settings-arrow").removeClass("fa-check"))
      : ($(".light-mode-btn .settings-arrow").addClass("fa-check"),
        $(".dark-mode-btn .settings-arrow").removeClass("fa-check")),
      $(".settings-app").fadeOut(250, function () {
        $(".appearance-setting").fadeIn();
      }));
  }),
  $(".appearance-exit").click(function () {
    const _0x135a25 = {
      pnuQG: ".settings-app",
      QLaUe: function (_0x5e0b5c, _0x514bae) {
        return _0x5e0b5c(_0x514bae);
      },
      RyvAY: ".appearance-setting",
    };
    $(".appearance-setting").fadeOut(250, function () {
      $(".settings-app").fadeIn();
    });
  }));
var wallpaperURL = "image/wallpaper/6.jpeg";
($(".wallpaper-set-box").click(function () {
  const _0x15260f = {
    kMoeF: function (_0xd67f85, _0x1f3c5f) {
      return _0xd67f85(_0x1f3c5f);
    },
    NTKqy: ".wallpaper-settings",
    cRQMb: ".settings-app",
  };
  $(".settings-app").fadeOut(250, function () {
    $(".wallpaper-settings").fadeIn();
  });
}),
  $(".wallpaper-exit").click(function () {
    const _0x33cd43 = {
      pvUir: function (_0x8ac205, _0x44db5c) {
        return _0x8ac205(_0x44db5c);
      },
      Zbhop: ".wallpaper-middle",
      vvBAA: ".wallpaper-insert-url",
      zsJbT: ".wallpaper-settings",
    };
    ($(".wallpaper-middle").removeClass("add-blur"),
      $(".wallpaper-insert-url").hide(),
      $(".wallpaper-settings").fadeOut(250, function () {
        $(".settings-app").fadeIn();
      }));
  }),
  $(".wallpaper-box").click(function () {
    const _0x3fcdc6 = {
        CZHLt: function (_0xca37a6, _0x3ec6a7) {
          return _0xca37a6(_0x3ec6a7);
        },
        VsKdo: ".wallpaper-image",
        XOEBK: "src",
        PEPYB: ".wallpaper-check",
        EHkbP: function (_0x1f3898, _0x502f56) {
          return _0x1f3898(_0x502f56);
        },
        GXPNa: '<i class=\"fa-solid fa-circle-check wallpaper-check\"></i>',
      },
      _0x51a321 = "0|2|1|4|3|5".split("|");
    let _0x5c3e51 = 0;
    while (true) {
      switch (_0x51a321[_0x5c3e51++]) {
        case "0":
          var _0x447afe = $(this).find(".wallpaper-image").attr("src");
          continue;
        case "1":
          $(".wallpaper-check").remove();
          continue;
        case "2":
          $(".home-background").attr("src", _0x447afe);
          continue;
        case "3":
          wallpaperURL = _0x447afe;
          continue;
        case "4":
          $(this).prepend(
            '<i class=\"fa-solid fa-circle-check wallpaper-check\"></i>',
          );
          continue;
        case "5":
          localStorage.setItem("carPlayWallpaperURL", wallpaperURL);
          continue;
      }
      break;
    }
  }),
  $(".wallpaper-upload-btn").click(function () {
    const _0x43ec3f = {
      cZbiV: ".wallpaper-middle",
      zRNBd: function (_0x5d308b, _0x14a4d3) {
        return _0x5d308b(_0x14a4d3);
      },
      JEyvA: "flex",
    };
    ($(".wallpaper-middle").addClass("add-blur"),
      $(".wallpaper-insert-url").css("display", "flex").hide().fadeIn());
  }),
  $(".close-url-btn").click(function () {
    const _0x29854c = {
      PPUcZ: function (_0x1ab4a8, _0x473b55) {
        return _0x1ab4a8(_0x473b55);
      },
      UzlZU: ".wallpaper-middle",
      WbTeQ: function (_0x26f7e9, _0x217bd4) {
        return _0x26f7e9(_0x217bd4);
      },
      rIcSV: ".wallpaper-insert-url",
    };
    ($(".wallpaper-middle").removeClass("add-blur"),
      $(".wallpaper-insert-url").fadeOut());
  }),
  $(".save-url-btn").click(function () {
    const _0xb31784 = {
      rDLSt: ".wallpaper-check",
      oHxlu: function (_0x2d1640, _0x2355e2) {
        return _0x2d1640(_0x2355e2);
      },
      iHqSU: ".wallpaper-middle",
      dudFs: "add-blur",
      mMBqs: function (_0x4c66d5, _0x4014ea) {
        return _0x4c66d5(_0x4014ea);
      },
      fEppa: ".insert-url-wallpaper",
      lVZXY: function (_0x4768dd, _0x5967eb) {
        return _0x4768dd(_0x5967eb);
      },
      ScTis: ".home-background",
      FggbR: "carPlayWallpaperURL",
    };
    ($(".wallpaper-check").remove(),
      $(".wallpaper-middle").removeClass("add-blur"),
      $(".wallpaper-insert-url").fadeOut(),
      (wallpaperURL = $(".insert-url-wallpaper").val()),
      $(".home-background").attr("src", wallpaperURL),
      localStorage.setItem("carPlayWallpaperURL", wallpaperURL),
      $(".insert-url-wallpaper").val(""));
  }));
function resetUI(_0x40f9d4) {
  const _0x509af4 = {
    hlvSx: function (_0x4b1c37, _0x1648a3) {
      return _0x4b1c37(_0x1648a3);
    },
    bteKa: ".wallpaper-image",
    sxfny: "src",
    ELxhw: function (_0x19389d, _0x485ccd) {
      return _0x19389d === _0x485ccd;
    },
    WUNMP: '<i class="fa-solid fa-circle-check wallpaper-check"></i>',
    EHhOJ: function (_0xae6308, _0x380fc5) {
      return _0xae6308 + _0x380fc5;
    },
    TOHCo: "/logoutAccount",
    jbEaX: function (_0x25f9cc, _0x1a58e5) {
      return _0x25f9cc == _0x1a58e5;
    },
    EtIBi: "playlist",
    AHXZD: "all",
    GahWy: function (_0x2fc013) {
      return _0x2fc013();
    },
    SaXFX: ".like-music",
    uKTPm: "red",
    mDKJC: "https://",
    OVjAb: function (_0x334a66, _0x2b38ca) {
      return _0x334a66 == _0x2b38ca;
    },
    JdZbc: ".playlist-middle",
    oxyCa: function (_0x5d7fd8, _0x55eada) {
      return _0x5d7fd8(_0x55eada);
    },
    jmNyz: "carPlayTheme",
    TtOoG: "carPlayWallpaperURL",
    YSUXE: "carPlaySound",
    WXcJm: "carPlaySiri",
    FcVRg: "carPlayRGB",
    rPdjB: "carPlayOverlay",
    lOkwG: "carPlayPositions",
    NIVDe: "carPlayBrightness",
    CJqwS: "image/wallpaper/6.jpeg",
    attag: function (_0x15fe2f, _0x119a0c) {
      return _0x15fe2f(_0x119a0c);
    },
    EskZC: ".draggable",
    uTYSm: function (_0x2ba1af, _0x2365d0) {
      return _0x2ba1af(_0x2365d0);
    },
    ghSoz: ".mini-ui-draggable",
    jGlDI: "5vh",
    yUOfw: ".wrapper",
    dUQfj: "light-mode",
    PLpsR: "dark-mode",
    UHUXP: ".dark-mode-btn .settings-arrow",
    HbwIm: "fa-check",
    pGQsU: ".light-mode-btn .settings-arrow",
    ToFcq: function (_0x6c0af7, _0x3531ab) {
      return _0x6c0af7(_0x3531ab);
    },
    tAJOe: "#checkbox-sound",
    RhUSi: "checked",
    BrHYw: "#checkbox-rgb",
    loXGo: ".home-background",
    yOkLo: function (_0x5b4d73, _0x2f4476) {
      return _0x5b4d73(_0x2f4476);
    },
    dkgaH: ".wallpaper-box",
    AZIFd: function (_0x4a2faf, _0x184f47) {
      return _0x4a2faf(_0x184f47);
    },
    LyHGj: "#checkbox-minimized",
    nGiUl: function (_0x13eafb, _0x462d33) {
      return _0x13eafb(_0x462d33);
    },
    WnoIh: "#brightslider",
    mFEzX: "filter",
    fLFVx: ".siri-qa-box",
    oVvqW: function (_0x3d3975, _0x4fa77f) {
      return _0x3d3975(_0x4fa77f);
    },
    iLaDv: function (_0x2a35e2, _0x3e0dc3) {
      return _0x2a35e2(_0x3e0dc3);
    },
  };
  ($.post(
    "https://" + GetParentResourceName() + "/logoutAccount",
    JSON.stringify({ vehID: curVeh }),
  ),
    Notify(
      uiLanguage.settings_app,
      uiLanguage.reset_success,
      "image/apps/settings.png",
    ));
  if (_0x40f9d4 == "playlist" || _0x40f9d4 == "all") {
    if (_0x40f9d4 == "playlist") {
      const _0x5c0da7 = "4|0|2|1|3".split("|");
      let _0xacd4ec = 0;
      while (true) {
        switch (_0x5c0da7[_0xacd4ec++]) {
          case "0":
            $(".playlist-middle").html("");
            continue;
          case "1":
            clearSavedMusic();
            continue;
          case "2":
            $(".like-music").removeClass("red");
            continue;
          case "3":
            return;
          case "4":
            $.post(
              "https://" + GetParentResourceName() + "/clearPlaylist",
              JSON.stringify({ vehID: curVeh, login: loginID }),
            );
            continue;
        }
        break;
      }
    }
    _0x40f9d4 == "all" &&
      ($.post(
        `https://${GetParentResourceName()}/clearPlaylist`,
        JSON.stringify({ vehID: curVeh, login: loginID }),
      ),
      $(".playlist-middle").html(""),
      $(".like-music").removeClass("red"),
      clearSavedMusic());
  }
  (localStorage.removeItem("carPlayTheme"),
    localStorage.removeItem("carPlayWallpaperURL"),
    localStorage.removeItem("carPlaySound"),
    localStorage.removeItem("carPlaySiri"),
    localStorage.removeItem("carPlayRGB"),
    localStorage.removeItem("carPlayOverlay"),
    localStorage.removeItem("carPlayPositions"),
    localStorage.removeItem("carPlayBrightness"),
    (darkMode = true),
    (wallpaperURL = "image/wallpaper/6.jpeg"),
    (useSound = false),
    (musicOverlay = false),
    $(".draggable").css({ top: "", left: "" }),
    $(".mini-ui-draggable").css({ top: "5vh", left: "" }),
    $(".wrapper").removeClass("light-mode").addClass("dark-mode"),
    $(".mini-ui-draggable").removeClass("light-mode").addClass("dark-mode"),
    $(".dark-mode-btn .settings-arrow").addClass("fa-check"),
    $(".light-mode-btn .settings-arrow").removeClass("fa-check"),
    $("#checkbox-sound").prop("checked", false),
    $("#checkbox-rgb").prop("checked", false),
    $(".home-background").attr("src", wallpaperURL),
    $(".wallpaper-box").each(function () {
      const _0x4be138 = $(this).find(".wallpaper-image").attr("src");
      _0x4be138 === wallpaperURL &&
        $(this).prepend(
          '<i class="fa-solid fa-circle-check wallpaper-check"></i>',
        );
    }),
    $(".mini-ui-draggable").fadeOut(),
    $("#checkbox-minimized").prop("checked", false),
    $("#brightslider").val(100),
    $(".wrapper").css("filter", "brightness(100%)"),
    $(".siri-qa-box").html(""),
    $("#checkbox-siri").prop("checked", false),
    $(".siri-icon").fadeOut());
}
($(".factory-reset").click(function () {
  const _0x215eda = {
    GhXtm: function (_0x26dd8a, _0x32cb43) {
      return _0x26dd8a(_0x32cb43);
    },
    LndPV: ".factory-settings",
    jpUuC: ".settings-app",
  };
  $(".settings-app").fadeOut(250, function () {
    $(".factory-settings").fadeIn();
  });
}),
  $(".reset-exit").click(function () {
    const _0x4c1792 = {
      OAAuI: ".settings-app",
      IjMAp: function (_0x3511e2, _0x1a6ba0) {
        return _0x3511e2(_0x1a6ba0);
      },
      LFyJs: ".factory-settings",
    };
    $(".factory-settings").fadeOut(250, function () {
      $(".settings-app").fadeIn();
    });
  }),
  $(".reset-playlist, .reset-settings, .reset-all").click(function () {
    const _0x4876ae = {
      SarrL: function (_0x166fa9, _0x975aa9) {
        return _0x166fa9 == _0x975aa9;
      },
      DMNxm: function (_0xbb7111, _0x5078b1) {
        return _0xbb7111(_0x5078b1);
      },
      LfWVd: "settings",
      Gednl: "reset-playlist",
      AgfPz: "playlist",
      JcKnF: function (_0x4e6e5c, _0xad2743) {
        return _0x4e6e5c == _0xad2743;
      },
      tTDbi: function (_0x237c47, _0x4ccadc) {
        return _0x237c47(_0x4ccadc);
      },
      DvjQX: "all",
      DNzlb: function (_0x1f49f1, _0xa16d46) {
        return _0x1f49f1(_0xa16d46);
      },
      SEPHw: ".factory-confirmation-box",
      QviRU: ".left-slider",
      zXlQi: "add-blur",
      MeEdh: "flex",
      uzbki: ".yes-button",
      tOhSi: "click",
      UWEUw: ".no-button",
    };
    $(".left-slider").addClass("add-blur");
    var _0x3af16c = this.classList.item(1);
    ($(".factory-confirmation-box").css("display", "flex").hide().fadeIn(),
      $(".yes-button")
        .off("click")
        .click(function () {
          if (_0x3af16c == "reset-settings") resetUI("settings");
          else {
            if (_0x3af16c == "reset-playlist") resetUI("playlist");
            else _0x3af16c == "reset-all" && resetUI("all");
          }
          ($(".factory-confirmation-box").fadeOut(),
            $(".left-slider").removeClass("add-blur"));
        }),
      $(".no-button")
        .off("click")
        .click(function () {
          ($(".factory-confirmation-box").fadeOut(),
            $(".left-slider").removeClass("add-blur"));
        }));
  }),
  $(".login-box").click(function () {
    const _0x13eb58 = {
      wKVbI: function (_0x36555c, _0x2a9704) {
        return _0x36555c == _0x2a9704;
      },
      vmUPG: function (_0x49573f, _0x4ab4c8) {
        return _0x49573f(_0x4ab4c8);
      },
      KoRnE: "login",
      uEoGk: "true",
      hmlQK: function (_0x5c4a7d, _0x239e8b, _0x44e648, _0x329788) {
        return _0x5c4a7d(_0x239e8b, _0x44e648, _0x329788);
      },
      wpvsv: "Settings",
      HgfTH: "Logged Out",
      abHKp: "image/apps/settings.png",
      QPGjw: function (_0x5dbc77, _0x30981b) {
        return _0x5dbc77 + _0x30981b;
      },
      NJnvj: function (_0x429137, _0x69b1eb) {
        return _0x429137 + _0x69b1eb;
      },
      goPhi: "https://",
      etgcR: "/logoutAccount",
      NFVNy: ".sign-in-confirmation-box",
      AlgjJ: "display",
      kfOGq: "flex",
    };
    if ($(this).attr("login") == "true") {
      (_0x13eb58.hmlQK(
        Notify,
        "Settings",
        "Logged Out",
        "image/apps/settings.png",
      ),
        $.post(
          "https://" + GetParentResourceName() + "/logoutAccount",
          JSON.stringify({ vehID: curVeh }),
        ));
      return;
    }
    ($(".left-slider").addClass("add-blur"),
      $(".sign-in-confirmation-box").css("display", "flex"));
  }),
  $(".sign-in-close").click(function () {
    const _0x1b49f3 = {
      VxJRn: function (_0x296f09, _0x3e0223) {
        return _0x296f09(_0x3e0223);
      },
      SARTt: ".left-slider",
      fLByB: "add-blur",
      rifLr: ".sign-in-confirmation-box",
    };
    ($(".left-slider").removeClass("add-blur"),
      $(".sign-in-confirmation-box").fadeOut());
  }),
  $(".sign-in-button").click(function () {
    const _0x16e1e9 = {
      oDIMe: "image/apps/settings.png",
      xujhC: ".left-slider",
      iQnjh: "add-blur",
      EcZsy: ".sign-in-confirmation-box",
      tpKOc: function (_0x1e537e, _0x313819) {
        return _0x1e537e + _0x313819;
      },
      AVmjW: function (_0x25188b, _0xdf2b85) {
        return _0x25188b + _0xdf2b85;
      },
      FvcZJ: "https://",
      HAHYc: function (_0xe96f98) {
        return _0xe96f98();
      },
      XkxCd: "/loginAccount",
    };
    ($(".left-slider").removeClass("add-blur"),
      $(".sign-in-confirmation-box").fadeOut(),
      $.post(
        `https://${GetParentResourceName()}/loginAccount`,
        JSON.stringify({ vehID: curVeh }),
      ).then((_0xd0a6a2) => {
        _0xd0a6a2 &&
          ((loginID = _0xd0a6a2.identifier),
          Notify(
            uiLanguage.settings_app,
            uiLanguage.logged_text,
            "image/apps/settings.png",
          ));
      }));
  }),
  $("#checkbox-siri").change(function () {
    const _0x422627 = {
      OFIZr: "carPlaySiri",
      ztUhe: ".siri-icon",
      xPjcc: function (_0x295a8c, _0x56d5a6) {
        return _0x295a8c(_0x56d5a6);
      },
    };
    this.checked
      ? (localStorage.setItem("carPlaySiri", true), $(".siri-icon").fadeIn())
      : (localStorage.setItem("carPlaySiri", false), $(".siri-icon").fadeOut());
  }),
  $("#checkbox-sound").change(function () {
    const _0x31ed88 = { EMUQK: "carPlaySound" };
    (this.checked ? (useSound = true) : (useSound = false),
      localStorage.setItem("carPlaySound", useSound));
  }));
let musicRGB = false;
($("#checkbox-rgb").change(function () {
  const _0x10968a = { fobhU: "carPlayRGB" };
  (this.checked ? (musicRGB = true) : (musicRGB = false),
    localStorage.setItem("carPlayRGB", musicRGB));
}),
  $("#checkbox-minimized").change(function () {
    const _0x4b8696 = {
      PsLSS: function (_0x53f0ed, _0xdd1362) {
        return _0x53f0ed(_0xdd1362);
      },
      PljFZ: ".mini-ui-draggable",
      ZEyeX: "display",
      ceJkX: "flex",
      egPWa: function (_0x1a1280, _0x2486e3) {
        return _0x1a1280(_0x2486e3);
      },
      Kvosc: "carPlayOverlay",
    };
    (this.checked
      ? ((musicOverlay = true),
        musicPlaying &&
          $(".mini-ui-draggable").css("display", "flex").hide().fadeIn())
      : ((musicOverlay = false), $(".mini-ui-draggable").fadeOut()),
      localStorage.setItem("carPlayOverlay", musicOverlay));
  }));
function vhToPixels(_0x53f136) {
  const _0x34f0cc = {
    wkTfp: function (_0x5363dd, _0x2da594) {
      return _0x5363dd * _0x2da594;
    },
    Ghkav: function (_0x172aa1, _0x496814) {
      return _0x172aa1 / _0x496814;
    },
  };
  return _0x34f0cc.Ghkav(_0x53f136, 100) * $(window).height();
}
function pixelsToVh(_0x3f30b5) {
  const _0x24233b = {
    RpZgd: function (_0xdbbef4, _0x5c07a1) {
      return _0xdbbef4 * _0x5c07a1;
    },
    viMCQ: function (_0x379f88, _0x22fb3d) {
      return _0x379f88 / _0x22fb3d;
    },
    axKOX: function (_0x335457, _0x36b46b) {
      return _0x335457(_0x36b46b);
    },
  };
  return _0x24233b.viMCQ(_0x3f30b5, $(window).height()) * 100;
}
function savePositions() {
  const _0x217fc6 = {
    sMicP: function (_0x200b78, _0x4790cd) {
      return _0x200b78(_0x4790cd);
    },
    xjzsz: ".draggable",
    AgUOv: function (_0x1d0125, _0x6f683d) {
      return _0x1d0125(_0x6f683d);
    },
    hfpuB: ".mini-ui-draggable",
    IpErZ: function (_0x3b8284, _0x1ae553) {
      return _0x3b8284(_0x1ae553);
    },
    sWexH: "carPlayPositions",
  };
  const _0x2cba97 = $(".draggable").position(),
    _0x1c4007 = $(".mini-ui-draggable").position(),
    _0xd8d5aa = {
      draggable: {
        top: pixelsToVh(_0x2cba97.top),
        left: pixelsToVh(_0x2cba97.left),
      },
      miniUi: {
        top: pixelsToVh(_0x1c4007.top),
        left: pixelsToVh(_0x1c4007.left),
      },
    };
  localStorage.setItem("carPlayPositions", JSON.stringify(_0xd8d5aa));
}
($("#checkbox-position").change(function () {
  const _0x569d5f = {
    inGFW: ".drag-container",
    vAzaD: ".mini-ui-draggable",
    XgLwy: ".drag-message",
    ohxir: "display",
    WtvUQ: "flex",
    PRyQG: function (_0x151dcd, _0x43ebae) {
      return _0x151dcd(_0x43ebae);
    },
    TEJtm: ".reset-ui-position-btn",
    eTViP: "1|3|2|4|0",
    ymSfE: "destroy",
    snYNf: function (_0x2636c4, _0x340491) {
      return _0x2636c4(_0x340491);
    },
    CMAPd: function (_0x471209, _0x47f745) {
      return _0x471209(_0x47f745);
    },
    PcArK: function (_0x53d9f0, _0x5e8766) {
      return _0x53d9f0(_0x5e8766);
    },
    mdiNf: ".draggable",
  };
  if (this.checked) {
    const _0x549904 = "3|4|2|0|1".split("|");
    let _0x2fd75b = 0;
    while (true) {
      switch (_0x549904[_0x2fd75b++]) {
        case "0":
          $(".draggable").draggable({
            containment: ".drag-container",
            scroll: false,
            stop: savePositions,
          });
          continue;
        case "1":
          $(".mini-ui-draggable").draggable({
            containment: ".drag-container",
            scroll: false,
            stop: savePositions,
          });
          continue;
        case "2":
          $(".drag-message").css("display", "flex").hide().fadeIn();
          continue;
        case "3":
          $(".mini-ui-draggable").css("display", "flex").hide().fadeIn();
          continue;
        case "4":
          $(".reset-ui-position-btn").css("display", "flex");
          continue;
      }
      break;
    }
  } else {
    const _0x5ed5a0 = "1|3|2|4|0".split("|");
    let _0x2f04cc = 0;
    while (true) {
      switch (_0x5ed5a0[_0x2f04cc++]) {
        case "0":
          $(".mini-ui-draggable").draggable("destroy");
          continue;
        case "1":
          $(".mini-ui-draggable").hide();
          continue;
        case "2":
          $(".drag-message").hide();
          continue;
        case "3":
          $(".reset-ui-position-btn").hide();
          continue;
        case "4":
          $(".draggable").draggable("destroy");
          continue;
      }
      break;
    }
  }
}),
  $(".reset-ui-position-btn").click(function () {
    const _0x487696 = {
      lyqlb: function (_0x5a3c2e, _0x2bbe68) {
        return _0x5a3c2e(_0x2bbe68);
      },
      KNIbk: ".draggable",
      TQGFa: function (_0x219c16, _0x454e4f) {
        return _0x219c16(_0x454e4f);
      },
      tQVAu: ".mini-ui-draggable",
      ULtMc: function (_0xfd0e76) {
        return _0xfd0e76();
      },
    };
    ($(".draggable").css({ top: "", left: "" }),
      $(".mini-ui-draggable").css({ top: "5vh", left: "" }),
      savePositions());
  }));
function updateUI() {
  const _0x381f5f = {
      OmQRR: function (_0x32b80f, _0x31a21f) {
        return _0x32b80f(_0x31a21f);
      },
      jQhiI: ".wallpaper-image",
      wqlzN: "src",
      KMuIZ: function (_0x853084, _0xeb1b4) {
        return _0x853084 === _0xeb1b4;
      },
      rUVJA: '<i class="fa-solid fa-circle-check wallpaper-check"></i>',
      hfMFI: "true",
      NAZCK: function (_0x321f02, _0x3d37d6) {
        return _0x321f02(_0x3d37d6);
      },
      tZpxg: "checked",
      aOiFK: "disabled",
      rQgqe: function (_0x2f8682, _0x21053b) {
        return _0x2f8682 && _0x21053b;
      },
      KRJXZ: "carPlayBrightness",
      QWJhQ: "100",
      rKiaB: function (_0x1d3ce5, _0x273ebe) {
        return _0x1d3ce5(_0x273ebe);
      },
      pfIJP: "#brightslider",
      ItMuM: ".wrapper",
      llaqQ: "carPlayTheme",
      AdCqy: function (_0x19b69d, _0x223354) {
        return _0x19b69d === _0x223354;
      },
      ZbmOd: "dark",
      KYHou: function (_0x587080) {
        return _0x587080();
      },
      BLGcp: "carPlayWallpaperURL",
      LBpjA: "image/wallpaper/6.jpeg",
      uKhPI: function (_0x1ee2e5, _0x5297cf) {
        return _0x1ee2e5(_0x5297cf);
      },
      BOAgQ: ".home-background",
      roirR: "Sound",
      wQntH: "#checkbox-sound",
      IKwBU: function (_0x158d5f, _0xafc194, _0x211cb4, _0xcc93d) {
        return _0x158d5f(_0xafc194, _0x211cb4, _0xcc93d);
      },
      LtoUc: "Siri",
      cbueh: "#checkbox-siri",
      hryou: ".siri-icon",
      xXmPs: "RGB",
      yDLrv: "#checkbox-rgb",
      DKFPQ: "Overlay",
      fzIsP: "#checkbox-minimized",
      elvur: ".draggable",
      Dulnq: ".mini-ui-draggable",
      xShIM: function (_0x5a389b, _0x7005db) {
        return _0x5a389b(_0x7005db);
      },
    },
    _0x21c428 = localStorage.getItem("carPlayBrightness") || "100";
  ($("#brightslider").val(_0x21c428),
    $(".wrapper").css("filter", "brightness(" + _0x21c428 + "%)"));
  !localStorage.getItem("carPlayBrightness") &&
    localStorage.setItem("carPlayBrightness", "100");
  const _0x4c3994 = localStorage.getItem("carPlayTheme") || "light";
  ((darkMode = _0x4c3994 === "dark"), applyTheme());
  const _0x4bd036 =
    localStorage.getItem("carPlayWallpaperURL") || "image/wallpaper/6.jpeg";
  ($(".home-background").attr("src", _0x4bd036),
    $(".wallpaper-box").each(function () {
      const _0x44dda2 = $(this).find(".wallpaper-image").attr("src");
      _0x44dda2 === _0x4bd036 &&
        $(this).prepend(
          '<i class="fa-solid fa-circle-check wallpaper-check"></i>',
        );
    }));
  const _0x4fb1ac = (_0x2a0fd1, _0x40032e, _0x2d7eae) => {
    const _0x511e7a = localStorage.getItem("carPlay" + _0x2a0fd1),
      _0x5e315a = _0x511e7a === "true";
    ($(_0x40032e).prop("checked", _0x5e315a),
      $(_0x40032e).prop("disabled", false),
      _0x381f5f.rQgqe(_0x2d7eae, _0x5e315a) && $(_0x2d7eae).fadeIn(),
      _0x511e7a === null && localStorage.setItem("carPlay" + _0x2a0fd1, false));
  };
  (_0x4fb1ac("Sound", "#checkbox-sound", "#checkbox-sound"),
    _0x381f5f.IKwBU(_0x4fb1ac, "Siri", "#checkbox-siri", ".siri-icon"),
    _0x4fb1ac("RGB", "#checkbox-rgb", null),
    _0x381f5f.IKwBU(_0x4fb1ac, "Overlay", "#checkbox-minimized", null));
  const _0x566de4 = JSON.parse(localStorage.getItem("carPlayPositions"));
  _0x566de4 &&
    ($(".draggable").css({
      top: vhToPixels(_0x566de4.draggable.top),
      left: vhToPixels(_0x566de4.draggable.left),
    }),
    $(".mini-ui-draggable").css({
      top: vhToPixels(_0x566de4.miniUi.top),
      left: vhToPixels(_0x566de4.miniUi.left),
    }));
}
function resetDisplay() {
  const _0x4eee19 = {
      yyikP:
        "4|10|25|17|0|9|5|6|1|13|8|24|31|11|22|18|26|2|32|20|27|19|23|28|14|3|30|7|33|21|15|12|16|34|29",
      QjLiR: function (_0x5ddb5b, _0x2beb8f) {
        return _0x5ddb5b(_0x2beb8f);
      },
      KiVZZ: ".music-card",
      VsIZq: "src",
      GnnGB: "image/music-note.png",
      leZUB: function (_0x224e57, _0x36465c) {
        return _0x224e57(_0x36465c);
      },
      kSNDX: ".music-song-title p",
      oFOYU: function (_0x50db3b, _0x368b95) {
        return _0x50db3b(_0x368b95);
      },
      XRAew: ".playlist-middle",
      wPjOS: function (_0x311ffb, _0x43a8e5) {
        return _0x311ffb(_0x43a8e5);
      },
      fCWYK: ".mini-ui-draggable",
      CEbnt: function (_0x295746, _0x159ada) {
        return _0x295746(_0x159ada);
      },
      pYVHY: ".music-card-title",
      wRkOT: ".bg-music-app",
      NpXbd: ".music-stop",
      VSpOz: "fa-pause",
      eYeQR: "fa-play",
      mQsWG: "image/fm.jpeg",
      tJWtK: ".music-loop",
      lVjHa: "green",
      bMbyt: function (_0x231017, _0x4e525b) {
        return _0x231017(_0x4e525b);
      },
      ApgvM: ".music-song-subtitle p",
      IXDRh: function (_0x2225f0) {
        return _0x2225f0();
      },
      FNRFv: function (_0x5226a4, _0x107991) {
        return _0x5226a4(_0x107991);
      },
      yACfg: ".video-player-input-box input",
      GIKSw: ".music-thumbnail",
      ybRzv: ".music-app",
      FBMja: "active",
      NKPAq: "true",
      VbxeG: function (_0x139f33, _0x77f40e) {
        return _0x139f33(_0x77f40e);
      },
      Tbxmr: ".login-box .settings-apps-option-cont",
      tqMuQ: function (_0x5ee5b2, _0x2f94fd) {
        return _0x5ee5b2(_0x2f94fd);
      },
      FaaYH: function (_0x37943c, _0x19c4b9) {
        return _0x37943c + _0x19c4b9;
      },
      bcAdm: function (_0xe75e38, _0xd306b3) {
        return _0xe75e38(_0xd306b3);
      },
      SkEPi: function (_0x39336c, _0x233a46) {
        return _0x39336c(_0x233a46);
      },
      LfAGC: ".menu-music-stop",
      ZeliJ: function (_0x569eb9, _0x1b1e9a) {
        return _0x569eb9(_0x1b1e9a);
      },
      wIlhp: ".sign-text, .touch-sub-text",
      UnsLp: function (_0x2f2bdc) {
        return _0x2f2bdc();
      },
      FQyXu: ".no-media-text",
      MzVZN: function (_0x419371, _0x31b34a) {
        return _0x419371(_0x31b34a);
      },
      yxniW: ".like-music",
      Ywzun: "red",
      lqXai: function (_0x403a30, _0x3fce3b) {
        return _0x403a30(_0x3fce3b);
      },
      YgCib: "login",
      XuBfU: "false",
      dfZez: function (_0x39d27c, _0x1b32d5) {
        return _0x39d27c(_0x1b32d5);
      },
      vqXFE: function (_0x1dcb0a, _0x343178) {
        return _0x1dcb0a(_0x343178);
      },
      MqQxt: ".video-player",
    },
    _0xf73fd3 =
      "4|10|25|17|0|9|5|6|1|13|8|24|31|11|22|18|26|2|32|20|27|19|23|28|14|3|30|7|33|21|15|12|16|34|29".split(
        "|",
      );
  let _0x254c97 = 0;
  while (true) {
    switch (_0xf73fd3[_0x254c97++]) {
      case "0":
        $(".music-card").attr("src", "image/music-note.png");
        continue;
      case "1":
        $(".music-song-title p").text(uiLanguage.music_track);
        continue;
      case "2":
        musicPlaying = false;
        continue;
      case "3":
        $(".playlist-middle").html("");
        continue;
      case "4":
        $(".mini-ui-draggable").fadeOut();
        continue;
      case "5":
        $(".music-card-title").text(uiLanguage.music_track);
        continue;
      case "6":
        $(".bg-music-app").attr("src", "image/fm.jpeg");
        continue;
      case "7":
        loginID = null;
        continue;
      case "8":
        $(".music-stop").removeClass("fa-pause").addClass("fa-play");
        continue;
      case "9":
        $(".music-card-sub-artistname").text(uiLanguage.music_artist);
        continue;
      case "10":
        $(".mini-ui-image-rotate").attr("src", "image/fm.jpeg");
        continue;
      case "11":
        $(".music-loop").removeClass("green");
        continue;
      case "12":
        $("#frame").attr("src", "");
        continue;
      case "13":
        $(".music-song-subtitle p").text(uiLanguage.music_artist);
        continue;
      case "14":
        loginID = null;
        continue;
      case "15":
        clearStopwatch();
        continue;
      case "16":
        $(".video-player-input-box input").val("");
        continue;
      case "17":
        $(".music-thumbnail").attr("src", "image/fm.jpeg");
        continue;
      case "18":
        $(".music-app").attr("active", "true");
        continue;
      case "19":
        $(".login-box .settings-apps-option-cont").remove();
        continue;
      case "20":
        $(".login-user-title").text(uiLanguage.welcome_text + ", User!");
        continue;
      case "21":
        clearAllChats();
        continue;
      case "22":
        $(".music-app").hide();
        continue;
      case "23":
        $(".playlist-middle").html("");
        continue;
      case "24":
        $(".menu-music-stop").removeClass("fa-pause").addClass("fa-play");
        continue;
      case "25":
        stopProgressUpdateTimer();
        continue;
      case "26":
        $(".short-music-card").show();
        continue;
      case "27":
        $(".sign-text, .touch-sub-text").text(uiLanguage.signin_text);
        continue;
      case "28":
        clearSavedMusic();
        continue;
      case "29":
        $(".no-media-text").show();
        continue;
      case "30":
        clearSavedMusic();
        continue;
      case "31":
        $(".like-music").removeClass("red");
        continue;
      case "32":
        $(".login-box").attr("login", "false");
        continue;
      case "33":
        $(".music-search-field input").val("");
        continue;
      case "34":
        $(".video-player").hide();
        continue;
    }
    break;
  }
}
async function setApps(_0x5742d6) {
  const _0x3a6946 = {
    mnKML: function (_0x5801a1) {
      return _0x5801a1();
    },
    EYHjB: "4|5|1|0|3|2",
    NsSVi: function (_0x30fd5b, _0x989d0) {
      return _0x30fd5b(_0x989d0);
    },
    bQGwW: "width",
    yfkas: function (_0x4a1daa, _0x105805) {
      return _0x4a1daa(_0x105805);
    },
    capTo: ".like-music",
    CbWov: ".reset-all",
    eLBNo: function (_0xb60912, _0x1f50f5) {
      return _0xb60912(_0x1f50f5);
    },
    jLwah: ".reset-playlist",
    AGPSR: ".home-playlist-app",
    MTgCF: function (_0x4df4db, _0x53331a) {
      return _0x4df4db(_0x53331a);
    },
    wTyZW: ".login-box",
    jFMPX: function (_0x34215c, _0x2679dc) {
      return _0x34215c(_0x2679dc);
    },
    apcpL: "#checkbox-siri",
    LdYnj: "checked",
    XGanQ: ".siri-icon",
    KYhcE: ".siri-setting",
    Offpx: "#checkbox-minimized",
    SAeKY: ".mini-ui-draggable",
    arYKQ: "carPlayRGB",
    iAjXM: function (_0x814b27, _0x12adf2) {
      return _0x814b27(_0x12adf2);
    },
    NmvAd: "#checkbox-rgb",
    VzVLd: ".musicrgb_btn",
    xpUSm: function (_0x4ffe9c, _0x216d8) {
      return _0x4ffe9c(_0x216d8);
    },
    GHZhU: function (_0x3cdc48, _0x297d14) {
      return _0x3cdc48(_0x297d14);
    },
    hosmt: ".home-carinfo-app",
    rQeGX: ".home-carcontrol-app",
    IFlkr: function (_0x4fcf15, _0x5459ec) {
      return _0x4fcf15(_0x5459ec);
    },
    MqFYb: ".car-control-button",
    XDgkZ: ".home-dashboard-app",
    MwXho: ".home-video-app",
    gZutC: ".home-snake-game",
  };
  let _0x17da20 = _0x5742d6.enableApps;
  uiLanguage = _0x5742d6.Language;
  if (!_0x17da20.Music_Playlist) {
    const _0x2bfa69 = "2|4|1|3|0".split("|");
    let _0x1c861f = 0;
    while (true) {
      switch (_0x2bfa69[_0x1c861f++]) {
        case "0":
          $(".volume-bar-cont").css("width", "27vh");
          continue;
        case "1":
          $(".like-music").hide();
          continue;
        case "2":
          $(".reset-all").hide();
          continue;
        case "3":
          $(".reset-playlist").hide();
          continue;
        case "4":
          $(".home-playlist-app").hide();
          continue;
        case "5":
          $(".login-box").hide();
          continue;
      }
      break;
    }
  }
  !_0x17da20.AI_Assistant &&
    (localStorage.removeItem("carPlaySiri"),
    $("#checkbox-siri").prop("checked", false),
    $(".siri-icon").hide(),
    $(".siri-setting").hide());
  !_0x17da20.Music_Overlay &&
    (localStorage.removeItem("carPlayOverlay"),
    $("#checkbox-minimized").prop("checked", false),
    $(".mini-ui-draggable").hide(),
    $(".minimized-setting").hide(),
    (musicOverlay = false));
  !_0x17da20.Music_Neon_RGB &&
    (localStorage.removeItem("carPlayRGB"),
    $("#checkbox-rgb").prop("checked", false),
    $(".musicrgb_btn").hide(),
    $(".rgb-setting").hide());
  !_0x17da20.Car_Info && $(".home-carinfo-app").hide();
  !_0x17da20.Car_Control &&
    ($(".home-carcontrol-app").hide(), $(".car-control-button").hide());
  !_0x17da20.Car_Automation && $(".home-dashboard-app").hide();
  !_0x17da20.Video_Player && $(".home-video-app").hide();
  !_0x17da20.Game && $(".home-snake-game").hide();
  for (const _0x1189e1 in _0x5742d6.DefaultPlaylist) {
    defaultPlaylist[_0x1189e1] = _0x5742d6.DefaultPlaylist[_0x1189e1];
  }
  const _0x183f3b = Object.keys(defaultPlaylist).map((_0x1b7f64) => {
    const _0xb01f7f = {
      fseeg: function (_0x12a1dd) {
        return _0x12a1dd();
      },
    };
    return new Promise((_0x3b427f) => {
      $.getJSON(
        "https://noembed.com/embed?url=" +
          encodeURIComponent(defaultPlaylist[_0x1b7f64]),
        function (_0x45d145) {
          const _0x454c6b = _0x45d145.title,
            _0x19fa20 = _0x45d145.author_name,
            _0x21e9ec = _0x45d145.thumbnail_url,
            _0x4ada08 = {
              saved: false,
              id: _0x1b7f64,
              musicSrc: defaultPlaylist[_0x1b7f64],
              title: _0x454c6b,
              authorName: _0x19fa20,
              thumbnailUrl: _0x21e9ec,
            };
          ((savedMusic[_0x1b7f64] = _0x4ada08), _0x3b427f());
        },
      );
    });
  });
  await Promise.all(_0x183f3b);
}
function UpdatePlayList(_0x232437) {
  const _0x24179d = {
    Gqfko: function (_0x5c954f) {
      return _0x5c954f();
    },
    ayBCe: function (_0x236fc0, _0x29ac72) {
      return _0x236fc0(_0x29ac72);
    },
    ShBhn: ".login-box .settings-apps-option-cont",
    sYEfz: function (_0x2257a6, _0x34479f) {
      return _0x2257a6(_0x34479f);
    },
    ZcsFg: ".login-box",
    GwOkN: "login",
    DGWtb: "true",
    QCUVu: ".login-user-title",
    JcSKz: function (_0x2e0d58, _0x55ba3d) {
      return _0x2e0d58 + _0x55ba3d;
    },
    uRBWb: ".sign-text, .touch-sub-text",
    yQrGv: function (_0x4b8731, _0x5c243d) {
      return _0x4b8731 + _0x5c243d;
    },
    NrOOv: function (_0xbf9224, _0x78ea55) {
      return _0xbf9224 + _0x78ea55;
    },
    xswkL: function (_0x1b0ef5) {
      return _0x1b0ef5();
    },
    RVENw: "/fetchPlaylist",
  };
  ((loginID = _0x232437.login),
    $(".login-box .settings-apps-option-cont").remove(),
    $(".login-box").attr("login", "true"),
    $(".login-user-title").text(
      uiLanguage.welcome_text + ", " + _0x232437.username,
    ),
    $(".sign-text, .touch-sub-text").text(uiLanguage.logout_text),
    $(".login-box").append(
      '<div class="settings-apps-option-cont">\n        <i class="fa-solid fa-right-from-bracket settings-arrow"></i>\n    </div>',
    ),
    $.post(
      `https://${GetParentResourceName()}/fetchPlaylist`,
      JSON.stringify({ login: _0x232437.login }),
    ).then((_0x1e4001) => {
      _0x1e4001 &&
        (clearSavedMusic(),
        _0x1e4001.forEach((_0x43a797, _0x275409) => {
          const _0x59d5e8 = JSON.parse(_0x43a797.musicData),
            _0xd04840 = ++Object.keys(savedMusic).length;
          savedMusic[_0xd04840] = {
            saved: true,
            id: _0x43a797.id,
            musicSrc: _0x59d5e8.musicSrc,
            title: _0x59d5e8.title,
            authorName: _0x59d5e8.authorName,
            thumbnailUrl: _0x59d5e8.thumbnailUrl,
          };
        }));
    }));
}
function UpdateMusic(_0x3a6f32) {
  const _0x57a812 = {
    IcPiY: ".music-thumbnail",
    ibazl: function (_0xd0abec, _0x8ce00d) {
      return _0xd0abec(_0x8ce00d);
    },
    rRQiT: ".music-card",
    bpQbL: "src",
    Sxviv: ".music-card-sub-artistname",
    fUvxv: function (_0x3a7201, _0xa20c7) {
      return _0x3a7201(_0xa20c7);
    },
    vLhnj: ".music-song-title p",
    wALCI: ".music-app-middle",
    zMmRa: "musicURL",
    GPkWE: function (_0xd87a1b, _0x538482) {
      return _0xd87a1b(_0x538482);
    },
    OntLx: function (_0x145c68, _0x545d4f) {
      return _0x145c68(_0x545d4f);
    },
    AvNyJ: ".mini-ui-image-rotate",
    IYSiv: "true",
    JSGqW: ".music-stop",
    sZLcN: "fa-play",
    JHJPz: "fa-pause",
    jRPpR: ".menu-music-stop",
    IeKZx: ".music-app-slider",
    EWtAu: "disabled",
    TOMuI: function (_0x131110, _0x551aac) {
      return _0x131110(_0x551aac);
    },
    vKGQJ: ".mini-ui-draggable",
    kpzfi: "display",
    XfNOi: "flex",
    ifRvc: "#end-time",
    kWdAR: function (_0x3f15bf, _0x2cd8d) {
      return _0x3f15bf(_0x2cd8d);
    },
    dedOL: ".volume-slider",
    tCjVF: function (_0x41cdaa, _0x503a4e) {
      return _0x41cdaa * _0x503a4e;
    },
    BzSaD: function (_0x194b38) {
      return _0x194b38();
    },
    zmxlD: ".like-music",
    vMFWU: "red",
    QGAaz: function (_0x4adde5, _0x3f2fd7) {
      return _0x4adde5(_0x3f2fd7);
    },
    rbCtg: function (_0x33059b, _0x438dea) {
      return _0x33059b(_0x438dea);
    },
    EmUfV: function (_0x4af11c, _0x4dc34f) {
      return _0x4af11c(_0x4dc34f);
    },
    loDHw: ".music-loop",
    HfAYw: "green",
  };
  $.getJSON(
    "https://noembed.com/embed?url=" + encodeURIComponent(_0x3a6f32.musicURL),
    function (_0x395476) {
      musicPlaying = true;
      const _0x5b7431 = _0x395476.title,
        _0x493c42 = _0x395476.author_name,
        _0x3d54dc = _0x395476.thumbnail_url;
      ($(".music-thumbnail").attr("src", _0x3d54dc),
        $(".music-card").attr("src", _0x3d54dc),
        $(".music-card-sub-artistname").text(uiLanguage.music_artist),
        $(".music-card-title").text(_0x5b7431),
        $(".bg-music-app").attr("src", _0x3d54dc),
        $(".music-song-title p").text(_0x5b7431),
        $(".music-song-subtitle p").text(_0x493c42),
        $(".music-app-middle").attr("musicURL", _0x3a6f32.musicURL),
        $(".mini-song-title span").text(_0x5b7431),
        $(".mini-ui-image-rotate").attr("src", _0x3d54dc),
        $(".music-app").attr("active", "true"),
        $(".music-stop").removeClass("fa-play").addClass("fa-pause"),
        $(".menu-music-stop").removeClass("fa-play").addClass("fa-pause"),
        $(".music-app-slider").prop("disabled", false));
      musicOverlay &&
        $(".mini-ui-draggable").css("display", "flex").hide().fadeIn();
      ($("#end-time").text(formatTime(_0x3a6f32.musicDuration)),
        $(".volume-slider").val(_0x3a6f32.volume * 100),
        (maxDurationInSeconds = _0x3a6f32.musicDuration),
        startProgressUpdateTimer());
      if (_0x3a6f32.like) $(".like-music").addClass("red");
      else {
        const _0x105392 = Object.values(savedMusic).find(
          (_0x457e24) => _0x457e24.musicSrc === _0x3a6f32.musicURL,
        );
        _0x105392
          ? $(".like-music").addClass("red")
          : $(".like-music").removeClass("red");
      }
      _0x3a6f32.loop
        ? $(".music-loop").addClass("green")
        : $(".music-loop").removeClass("green");
    },
  );
}
function clearSavedMusic() {
  const _0xb9e707 = {
    MxTKT: function (_0x1ca4b0, _0x610247) {
      return _0x1ca4b0 === _0x610247;
    },
  };
  for (const _0x520b02 in savedMusic) {
    savedMusic[_0x520b02].saved === true && delete savedMusic[_0x520b02];
  }
}
function Notify(_0x3123e7, _0x41e16c, _0x5bb555) {
  const _0xd3ab31 = {
    ccxDc: function (_0x2c8042, _0x57446d) {
      return _0x2c8042(_0x57446d);
    },
    zoJQl: ".notification-container",
    bCsPl: "animate__fadeIn",
    AJRto: "animate__fadeOut",
    bfFIR: function (_0x63e297, _0x552734, _0x5496f8) {
      return _0x63e297(_0x552734, _0x5496f8);
    },
    PGzWK: ".notify-msg",
    hXNTv: function (_0x22078a, _0x171d0c) {
      return _0x22078a(_0x171d0c);
    },
    QtDGT: ".car-play-notification-icon",
    MHZsG: "src",
    UuRCX: function (_0x392d17, _0x1bee27) {
      return _0x392d17(_0x1bee27);
    },
    KCxON: "display",
    UPRqB: function (_0x31eff5, _0x1ebdf9, _0x3a6027) {
      return _0x31eff5(_0x1ebdf9, _0x3a6027);
    },
  };
  ($(".notify-title").text(_0x3123e7),
    $(".notify-msg").text(_0x41e16c),
    $(".car-play-notification-icon").attr("src", _0x5bb555),
    $(".notification-container").css("display", "flex"),
    $(".notification-container").addClass("animate__fadeIn"),
    setTimeout(() => {
      const _0x29cb28 = {
        VByvK: function (_0x3bb0a6, _0x2b948e) {
          return _0x3bb0a6(_0x2b948e);
        },
        tHuTM: ".notification-container",
        KrCJK: "animate__fadeOut",
      };
      ($(".notification-container").removeClass("animate__fadeIn"),
        $(".notification-container").addClass("animate__fadeOut"),
        setTimeout(() => {
          ($(".notification-container").hide(),
            $(".notification-container").removeClass("animate__fadeOut"));
        }, 600));
    }, 2000));
}
$(document).on("keydown", function (_0x572d6b) {
  const _0x4d40e2 = {
    kXtuy: function (_0x5c3d08) {
      return _0x5c3d08();
    },
  };
  switch (_0x572d6b.keyCode) {
    case 27:
      Close();
      break;
    case 9:
      Close();
      break;
  }
});
const debouncedUpdateUI = debounce(updateUI, 300);
window.addEventListener("load", async () => {
  const _0x23227d = {
    nBDGB: function (_0x1370b8, _0x2701ab) {
      return _0x1370b8 + _0x2701ab;
    },
    bLlBP: function (_0xafacd0) {
      return _0xafacd0();
    },
    mQaPU: "POST",
    iHEAg: function (_0x5110b4, _0x4153ff) {
      return _0x5110b4(_0x4153ff);
    },
    mUohD: "Error fetching app info:",
  };
  try {
    const _0x592b22 = await $.ajax({
      url: "https://" + GetParentResourceName() + "/fetchAppInfo",
      method: "POST",
      dataType: "json",
    });
    (setApps(_0x592b22),
      !isUpdateUIExecuted &&
        (debouncedUpdateUI(), (isUpdateUIExecuted = true)));
  } catch (_0x312f67) {
    console.error("Error fetching app info:", _0x312f67);
  }
});
function debounce(_0x207f81, _0x2552ca) {
  const _0x144732 = {
    ZpZvr: function (_0x112ce6, _0x2646b5) {
      return _0x112ce6(_0x2646b5);
    },
    YIVCr: function (_0x7dcbd0, _0x44989, _0x18f520) {
      return _0x7dcbd0(_0x44989, _0x18f520);
    },
  };
  let _0x18a0f2;
  return function () {
    (clearTimeout(_0x18a0f2),
      (_0x18a0f2 = setTimeout(() => {
        _0x207f81.apply(this, arguments);
      }, _0x2552ca)));
  };
}
$(document).ready(function () {
  const _0x4adde4 = {
    YoOeD: function (_0x38833c, _0x827feb) {
      return _0x38833c(_0x827feb);
    },
    NLjzj: function (_0x396237, _0x4afddf) {
      return _0x396237 + _0x4afddf;
    },
    SUNdw: "https://",
    fFSKJ: function (_0x22060f) {
      return _0x22060f();
    },
    dPQPK: function (_0x4df862, _0x5a1f7e) {
      return _0x4df862(_0x5a1f7e);
    },
    lJHUW: ".dashboard-start-container",
    gtTlk: "flex",
    aPdpv: "openUI",
    Lryfl: ".drag-container",
    WUGtq: "display",
    LzVWe: ".location-title-text",
    rFOUe: function (_0x448c4e, _0x34b164) {
      return _0x448c4e(_0x34b164);
    },
    yttwg: ".maps-distance",
    pUhLL: function (_0x13064a, _0x5f1dbb) {
      return _0x13064a(_0x5f1dbb);
    },
    LQfIw: "updateMusicTime",
    ubTJe: "syncUI",
    jpkiA: function (_0x306869, _0x2e0b8b) {
      return _0x306869 == _0x2e0b8b;
    },
    Szlrd: "resume",
    dnEBR: function (_0x4377b, _0x3f515b) {
      return _0x4377b(_0x3f515b);
    },
    CLACA: ".music-stop",
    iACNJ: "fa-play",
    fytTl: "fa-pause",
    oFBZm: function (_0x555180, _0x1aed7d) {
      return _0x555180(_0x1aed7d);
    },
    rCahZ: ".menu-music-stop",
    PBxVm: "pause",
    dvVDs: function (_0xb28d56, _0x3d3296) {
      return _0xb28d56(_0x3d3296);
    },
    Lsshn: "volume",
    rkwLp: function (_0x12357b, _0x9a97a4) {
      return _0x12357b * _0x9a97a4;
    },
    PnJHN: "skip",
    LFyFh: function (_0x23b4ab, _0x4cda81) {
      return _0x23b4ab == _0x4cda81;
    },
    dcvYp: "end",
    fHRSE: function (_0x33fafb, _0x2e531a) {
      return _0x33fafb(_0x2e531a);
    },
    wRSNr: ".login-box .settings-apps-option-cont",
    FXsoz: function (_0x34cf3d, _0x1b774e) {
      return _0x34cf3d(_0x1b774e);
    },
    EiGAy: ".sign-text, .touch-sub-text",
    KfGYy: ".login-user-title",
    eetuY: function (_0x448146, _0x2ca925) {
      return _0x448146 + _0x2ca925;
    },
    uQReL: ".login-box",
    IcbNv: "true",
    ggzAF: "logout",
    koZnU: "3|4|0|1|5|6|2",
    sYkxO: function (_0x407fc1, _0x2db6af) {
      return _0x407fc1(_0x2db6af);
    },
    RiUKp: function (_0x5574f2, _0x35b6f5) {
      return _0x5574f2(_0x35b6f5);
    },
    Auipm: "login",
    qTMDm: function (_0x1ddb44, _0x26c876) {
      return _0x1ddb44(_0x26c876);
    },
    DusNc: function (_0x1e0807, _0x5b34f3) {
      return _0x1e0807 + _0x5b34f3;
    },
    fCfKl: ", User!",
    pNwyB: ".playlist-middle",
    StNrm: function (_0x5084cb) {
      return _0x5084cb();
    },
    DnaDz: function (_0x43a55e, _0x4569bf) {
      return _0x43a55e == _0x4569bf;
    },
    nwSjM: "clearPlaylist",
    sNvYY: function (_0x3cd309) {
      return _0x3cd309();
    },
    vFZEC: "likeData",
    nEkvd: function (_0xc4d910, _0x516152) {
      return _0xc4d910(_0x516152);
    },
    XLKJf: function (_0x513336, _0x401da0) {
      return _0x513336(_0x401da0);
    },
    SYUJj: ".like-music",
    mUCGC: "red",
    dqziB: "resetDisplay",
    NZAFg: "installRadio",
    VlQod: ".install-radio-button",
    QsAqc: ".assemble-card",
    SfVzr: function (_0x312da3, _0xe4af17) {
      return _0x312da3(_0xe4af17);
    },
    lWoXw: "click",
    zXSfL: "updateSpeed",
    soUWi: "stopAutoDrive",
    BoJMc: ".dashboard-content-box",
    lcJgU: "parkAlarm",
    RJMBn: "closeUI",
    DIfSD: function (_0x46abd5) {
      return _0x46abd5();
    },
  };
  window.addEventListener("message", function (_0x5ae324) {
    switch (_0x5ae324.data.action) {
      case "openUI":
        var _0xbff02b = _0x5ae324.data.data;
        ((curVeh = _0xbff02b.curVeh),
          (musicPlaying = _0xbff02b.songData.musicPlaying),
          $(".drag-container").css("display", "flex").hide().fadeIn(),
          $(".location-title-text").text(_0xbff02b.vData.curLoc),
          $(".location-title-text").text(_0xbff02b.vData.curLoc));
        const _0x12e0d3 = _0xbff02b.vData.locDist,
          _0x588469 = parseFloat(_0x12e0d3),
          _0x527d5b = _0x588469.toFixed(2),
          _0x3ef184 = _0x12e0d3.split(" ")[1];
        ($(".maps-distance").html("</span> " + _0x527d5b + " " + _0x3ef184),
          UpdateTime(_0xbff02b.vData.curTime),
          UpdateWeather(_0xbff02b.vData.weatherType));
        musicPlaying && UpdateMusic(_0xbff02b.songData);
        _0xbff02b.songData.musicEnd && stopProgressUpdateTimer();
        _0xbff02b.loginData &&
          _0xbff02b.loginData.login &&
          UpdatePlayList(_0xbff02b.loginData);
        break;
      case "updateMusicTime":
        currentTimeInSeconds = _0x5ae324.data.timer;
        break;
      case "syncUI":
        const _0x5561fa = _0x5ae324.data.data;
        _0x5561fa.action == "resume" &&
          ($(".music-stop").removeClass("fa-play").addClass("fa-pause"),
          $(".menu-music-stop").removeClass("fa-play").addClass("fa-pause"));
        _0x5561fa.action == "pause" &&
          ($(".music-stop").removeClass("fa-pause").addClass("fa-play"),
          $(".menu-music-stop").removeClass("fa-pause").addClass("fa-play"));
        _0x5561fa.action == "volume" &&
          $(".volume-slider").val(_0x5561fa.data.volume * 100);
        _0x5561fa.action == "skip" &&
          (currentTimeInSeconds = _0x5561fa.data.time);
        _0x5561fa.action == "end" &&
          ((musicPlaying = false), stopProgressUpdateTimer());
        if (_0x5561fa.action == "login") {
          const _0x1ac2d5 = "4|1|5|3|2|0".split("|");
          let _0x43fa9b = 0;
          while (true) {
            switch (_0x1ac2d5[_0x43fa9b++]) {
              case "0":
                $(".login-box").append(
                  '<div class="settings-apps-option-cont">\n                        <i class="fa-solid fa-right-from-bracket settings-arrow"></i>\n                    </div>',
                );
                continue;
              case "1":
                $(".login-box .settings-apps-option-cont").remove();
                continue;
              case "2":
                $(".sign-text, .touch-sub-text").text(uiLanguage.logout_text);
                continue;
              case "3":
                $(".login-user-title").text(
                  uiLanguage.welcome_text + ", " + _0x5561fa.data.username,
                );
                continue;
              case "4":
                loginID = _0x5561fa.data.login;
                continue;
              case "5":
                $(".login-box").attr("login", "true");
                continue;
            }
            break;
          }
        }
        if (_0x5561fa.action == "logout") {
          const _0x500d87 = "3|4|0|1|5|6|2".split("|");
          let _0x5eeeb7 = 0;
          while (true) {
            switch (_0x500d87[_0x5eeeb7++]) {
              case "0":
                $(".sign-text, .touch-sub-text").text(uiLanguage.signin_text);
                continue;
              case "1":
                $(".login-box .settings-apps-option-cont").remove();
                continue;
              case "2":
                loginID = null;
                continue;
              case "3":
                $(".login-box").attr("login", "false");
                continue;
              case "4":
                $(".login-user-title").text(
                  uiLanguage.welcome_text + ", User!",
                );
                continue;
              case "5":
                $(".playlist-middle").html("");
                continue;
              case "6":
                clearSavedMusic();
                continue;
            }
            break;
          }
        }
        _0x5561fa.action == "clearPlaylist" &&
          ($(".playlist-middle").html(""), clearSavedMusic(), (loginID = null));
        _0x5561fa.action == "musicEntry" && UpdateMusic(_0x5561fa.data);
        if (_0x5561fa.action == "likeData") {
          const _0x19627c = _0x5561fa.data.data;
          if (_0x19627c.like) {
            $(".like-music").addClass("red");
            const _0x524891 = Math.max(...Object.keys(savedMusic)) + 1;
            savedMusic[_0x524891] = _0x19627c.data;
          } else
            ($(".like-music").removeClass("red"),
              delete savedMusic[_0x19627c.musicID]);
        }
        break;
      case "resetDisplay":
        resetDisplay();
        break;
      case "installRadio":
        _0x5ae324.data.text &&
          $(".install-radio-button").text(_0x5ae324.data.text);
        ($(".assemble-card").fadeIn(),
          $(".install-radio-button")
            .off("click")
            .on("click", function () {
              ($(".assemble-card").fadeOut(),
                $.post(
                  `https://${GetParentResourceName()}/installRadio`,
                  JSON.stringify(_0x5ae324.data.data),
                ));
            }));
        break;
      case "updateSpeed":
        updateSpeed(_0x5ae324.data);
        break;
      case "stopAutoDrive":
        $(".dashboard-content-box").fadeOut(200, function () {
          $(".dashboard-start-container").css("display", "flex");
        });
        var _0x34abce = new Audio("sound/autopilot_off.mp3");
        ((_0x34abce.volume = 0.3), _0x34abce.play());
        break;
      case "parkAlarm":
        parkSound();
        break;
      case "closeUI":
        Close();
        break;
    }
  });
});
const draggable = document.querySelector(".draggable"),
  zoomLevelDisplay = document.getElementById("zoomLevel");
let currentZoomLevel = 1;
function updateZoomLevel() {
  const _0x4b4a23 = { kZVgw: "watchZoom" };
  ((zoomLevelDisplay.textContent = currentZoomLevel.toFixed(1)),
    localStorage.setItem("watchZoom", currentZoomLevel.toFixed(1)));
}
$(".zoomInBtn, .zoomOutBtn").click(function () {
  const _0xea14f1 = {
      nTNGc: function (_0x1ae6cb, _0xd059c9) {
        return _0x1ae6cb(_0xd059c9);
      },
      DCWRn: function (_0x5547e8, _0x23c994) {
        return _0x5547e8 + _0x23c994;
      },
    },
    _0x1ae6b4 = $(this).hasClass("zoomInBtn") ? 0.1 : -0.1;
  ((currentZoomLevel = Math.min(
    Math.max(currentZoomLevel + _0x1ae6b4, 0.7),
    1.6,
  )),
    updateZoom());
});
function updateZoom() {
  const _0x515a7c = {
    krsyK: function (_0x44c1be, _0x594030) {
      return _0x44c1be(_0x594030);
    },
    qnJxi: function (_0x425bff) {
      return _0x425bff();
    },
  };
  ((currentZoomLevel = parseFloat(currentZoomLevel)),
    (draggable.style.transform = "scale(" + currentZoomLevel + ")"),
    updateZoomLevel());
}
