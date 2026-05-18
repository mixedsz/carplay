-- ============================================================
--  cs_carplay  |  main/client.lua
--  Full client-side logic matching the deobfuscated UI contracts.
--
--  Data contract (openUI message to UI):
--    {curVeh, songData:{musicPlaying,musicURL,...},
--     vData:{curLoc,locDist,curTime,weatherType},
--     loginData:{login,username} | nil}
--
--  NUI callbacks implemented here (matching ui/main.js):
--    /fetchAppInfo  /loginAccount  /logoutAccount
--    /fetchPlaylist /saveMusic     /likeData
--    /musicPlay     /clearPlaylist /stopMusic
--    /adjustVolume  /loopMusic     /carInfo
--    /carAction     /carControl    /carCamera
--    /autoPilot     /chatGPTAction /installRadio
--    /closeUI       /openMap
-- ============================================================

-- ── State ────────────────────────────────────────────────────
local isUIOpen        = false
local currentVehicle  = 0
local curVehNetId     = 0
local musicPlaying    = false
local musicLoop       = false
local musicVolume     = CodeStudio.Default_Music_Volume
local autoPilotActive = false
local autoPilotBlip   = nil
local hazardActive    = false
local hazardThread    = nil
local rgbActive       = false
local rgbThread       = nil
local parkThread      = nil
local frontCam        = nil
local backCam         = nil
local currentSong     = {}

-- ── Helpers ──────────────────────────────────────────────────

local function GetVeh()
    local ped = PlayerPedId()
    return IsPedInAnyVehicle(ped, false) and GetVehiclePedIsIn(ped, false) or 0
end

local function IsDriver()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    return veh ~= 0 and GetPedInVehicleSeat(veh, -1) == ped
end

local function GetPlate(veh)
    return string.upper(string.gsub(GetVehicleNumberPlateText(veh), '%s+', ''))
end

local function NUI(action, data)
    SendNUIMessage({ action = action, data = data })
end

-- ── Waypoint distance ─────────────────────────────────────────
local function GetWaypointDistance(pos)
    if not IsWaypointActive() then return '0.0 ' .. CodeStudio.MarkedLocation_Unit end
    local wp  = GetBlipCoords(GetFirstBlipInfoId(8))
    local raw = #(vector2(pos.x, pos.y) - vector2(wp.x, wp.y))
    local val
    if CodeStudio.MarkedLocation_Unit == 'Mi' then
        val = string.format('%.2f', raw * 0.000621371)
    else
        val = string.format('%.2f', raw * 0.001)
    end
    return val .. ' ' .. CodeStudio.MarkedLocation_Unit
end

-- ── Weather ──────────────────────────────────────────────────
local function GetWeatherType()
    local hash = GetPrevWeatherTypeHashName()
    for _, w in ipairs(WEATHER_TYPES) do
        if w.hash == hash then return w.name end
    end
    return 'CLEAR'
end

-- ── Parking sensor ────────────────────────────────────────────
local function StartParkingSensor()
    if not CodeStudio.ParkingSensor.Enable or parkThread then return end
    parkThread = CreateThread(function()
        while isUIOpen do
            local ped = PlayerPedId()
            local veh = GetVehiclePedIsIn(ped, false)
            if veh ~= 0 and GetPedInVehicleSeat(veh, -1) == ped then
                local fwd  = GetEntityForwardVector(veh)
                local pos  = GetEntityCoords(veh)
                local d    = CodeStudio.ParkingSensor.SensorDistance

                local _, fHit = GetShapeTestResult(StartShapeTestRay(
                    pos.x, pos.y, pos.z,
                    pos.x + fwd.x*d, pos.y + fwd.y*d, pos.z,
                    10, veh, 0))
                local _, bHit = GetShapeTestResult(StartShapeTestRay(
                    pos.x, pos.y, pos.z,
                    pos.x - fwd.x*d, pos.y - fwd.y*d, pos.z,
                    10, veh, 0))

                if fHit or bHit then
                    NUI('syncUI', { action = 'parkAlarm' })
                end
            end
            Wait(250)
        end
        parkThread = nil
    end)
end

-- ── Hazard lights ────────────────────────────────────────────
local function StartHazards(veh)
    if hazardThread then return end
    hazardActive = true
    hazardThread = CreateThread(function()
        while hazardActive do
            SetVehicleIndicatorLights(veh, 0, true)
            SetVehicleIndicatorLights(veh, 1, true)
            Wait(600)
            SetVehicleIndicatorLights(veh, 0, false)
            SetVehicleIndicatorLights(veh, 1, false)
            Wait(600)
        end
        SetVehicleIndicatorLights(veh, 0, false)
        SetVehicleIndicatorLights(veh, 1, false)
        hazardThread = nil
    end)
end

local function StopHazards(veh)
    hazardActive = false
    SetVehicleIndicatorLights(veh, 0, false)
    SetVehicleIndicatorLights(veh, 1, false)
end

-- ── RGB neon ─────────────────────────────────────────────────
local rgbColors = {
    {255,0,0},{255,127,0},{255,255,0},{0,255,0},
    {0,0,255},{75,0,130},{148,0,211}
}
local rgbIdx = 0

local function StartRGB(veh)
    if rgbThread then return end
    rgbActive = true
    rgbThread = CreateThread(function()
        for i = 0, 3 do SetVehicleNeonLightEnabled(veh, i, true) end
        while rgbActive do
            local c = rgbColors[(rgbIdx % #rgbColors) + 1]
            SetVehicleNeonLightsColour(veh, c[1], c[2], c[3])
            rgbIdx = rgbIdx + 1
            Wait(150)
        end
        for i = 0, 3 do SetVehicleNeonLightEnabled(veh, i, false) end
        rgbThread = nil
    end)
end

local function StopRGB()
    rgbActive = false
end

-- ── Autopilot ────────────────────────────────────────────────
local function StopAutoPilot()
    autoPilotActive = false
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh ~= 0 then ClearPedTasks(ped) end
    if autoPilotBlip then RemoveBlip(autoPilotBlip); autoPilotBlip = nil end
    NUI('syncUI', { action = 'stopAutoDrive' })
    Notification(CodeStudio.Language.autopilot_off, 'inform')
end

local function StartAutoPilot(coords)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh == 0 then return false end

    autoPilotActive = true

    autoPilotBlip = AddBlipForCoord(coords.x, coords.y, coords.z)
    SetBlipSprite(autoPilotBlip, 1)
    SetBlipColour(autoPilotBlip, 2)
    SetBlipScale(autoPilotBlip, 1.0)
    BeginTextCommandSetBlipName('STRING')
    AddTextComponentSubstringPlayerName('Auto Pilot Destination')
    EndTextCommandSetBlipName(autoPilotBlip)

    TaskVehicleDriveToCoordLongrange(
        ped, veh,
        coords.x, coords.y, coords.z,
        CodeStudio.AutoPilot.MaxSpeed,
        CodeStudio.AutoPilot.DriveStyle,
        5.0
    )

    Notification(CodeStudio.Language.autopilot_on, 'inform')

    CreateThread(function()
        while autoPilotActive do
            local pos   = GetEntityCoords(veh)
            local dist  = #(vector3(pos.x,pos.y,pos.z) - vector3(coords.x,coords.y,coords.z))
            local speed = GetEntitySpeed(veh) * 3.6
            local gear  = GetVehicleCurrentGear(veh)
            local rpm   = GetVehicleCurrentRpm(veh)

            NUI('syncUI', { action = 'updateSpeed', data = {
                speed = math.floor(speed), rpm = math.floor(rpm*100)/100,
                gear  = gear, distance = math.floor(dist),
            }})

            if dist < 8.0 then StopAutoPilot(); return end
            Wait(500)
        end
    end)

    return true
end

-- ── Open / Close UI ──────────────────────────────────────────

local function BuildOpenUIData(veh)
    local ped  = PlayerPedId()
    local pos  = GetEntityCoords(veh)

    local streetHash, _ = GetStreetNameAtCoord(pos.x, pos.y, pos.z)
    local curLoc  = GetStreetNameFromHashKey(streetHash)
    local locDist = GetWaypointDistance(pos)
    local h, m    = GetClockHours(), GetClockMinutes()
    local curTime = string.format('%02d:%02d', h, m)

    return {
        curVeh   = NetworkGetNetworkIdFromEntity(veh),
        songData = {
            musicPlaying = musicPlaying,
            musicURL     = currentSong.url or '',
            musicSrc     = currentSong.url or '',
            title        = currentSong.title or '',
            authorName   = currentSong.artist or '',
            thumbnailUrl = currentSong.thumbnail or '',
            musicEnd     = false,
        },
        vData = {
            curLoc      = curLoc,
            locDist     = locDist,
            curTime     = curTime,
            weatherType = GetWeatherType(),
        },
        loginData = nil, -- populated after login
    }
end

local function OpenUI()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)

    if veh == 0 then
        Notification(CodeStudio.Language.not_in_veh, 'error')
        return
    end
    if CodeStudio.OnlyDriver and not IsDriver() then
        Notification(CodeStudio.Language.only_driver, 'error')
        return
    end
    if IsVehicleRestricted(GetEntityModel(veh)) then
        Notification(CodeStudio.Language.restricted_veh, 'error')
        return
    end

    -- Radio install gate
    if CodeStudio.Main.RadioInstall.Enable then
        TriggerServerEvent('cs:carplay:checkInstall', GetPlate(veh))
        return
    end

    isUIOpen       = true
    currentVehicle = veh
    curVehNetId    = NetworkGetNetworkIdFromEntity(veh)

    if CodeStudio.Disable_GTA_Radio then
        SetVehicleRadioEnabled(veh, false)
        SetVehRadioStation(veh, 'OFF')
    end

    SetNuiFocus(true, true)
    NUI('openUI', BuildOpenUIData(veh))
    StartParkingSensor()
end

-- RawCloseUI: cleans up Lua state only, does NOT message the JS
-- (used by /closeUI NUI callback to avoid a send↔receive loop)
local function RawCloseUI()
    isUIOpen       = false
    currentVehicle = 0
    SetNuiFocus(false, false)
    if autoPilotActive then StopAutoPilot() end
    if hazardActive then
        local veh = GetVeh()
        if veh ~= 0 then StopHazards(veh) end
        hazardActive = false
    end
    if rgbActive then StopRGB() end
    if frontCam  then DestroyCam(frontCam, false); frontCam = nil; RenderScriptCams(false,false,0,true,true) end
    if backCam   then DestroyCam(backCam,  false); backCam  = nil; RenderScriptCams(false,false,0,true,true) end
end

-- CloseUI: tells JS to hide itself, then cleans up Lua state
-- (used when close is initiated from the Lua side)
local function CloseUI()
    NUI('closeUI', {})
    RawCloseUI()
end

-- ── Events: open / close ─────────────────────────────────────

-- Single handler for both local (TriggerEvent) and network (TriggerClientEvent) events.
-- Two handlers for the same event would fire twice on each trigger, causing
-- OpenUI() to run immediately followed by CloseUI().
RegisterNetEvent('cs:carPlay:openUI')
AddEventHandler('cs:carPlay:openUI', function()
    if isUIOpen then CloseUI() else OpenUI() end
end)

-- ── Event: radio install gate result ─────────────────────────

RegisterNetEvent('cs:carplay:installStatus', function(installed)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    if veh == 0 then return end

    if not installed then
        -- Show the assemble card so player can install
        NUI('installRadio', {
            text = CodeStudio.Language.install_radio_txt,
            data = { plate = GetPlate(veh), install = true },
        })
        return
    end

    isUIOpen       = true
    currentVehicle = veh
    curVehNetId    = NetworkGetNetworkIdFromEntity(veh)

    if CodeStudio.Disable_GTA_Radio then
        SetVehicleRadioEnabled(veh, false)
        SetVehRadioStation(veh, 'OFF')
    end

    SetNuiFocus(true, true)
    NUI('openUI', BuildOpenUIData(veh))
    StartParkingSensor()
end)

-- ── Event: radio installed confirmation ──────────────────────

RegisterNetEvent('cs:carplay:radioInstalled', function(plate, installed)
    NUI('syncUI', {
        action = 'installRadio',
        text   = installed and CodeStudio.Language.install_radio_txt or CodeStudio.Language.uninstall_radio_txt,
        data   = { plate = plate, install = not installed },
    })
    if installed then
        Notification('Radio installed in ' .. plate, 'success')
    else
        Notification('Radio removed from ' .. plate, 'inform')
    end
end)

-- ── Events: server callback results → UI ─────────────────────

RegisterNetEvent('cs:carplay:appInfoResult', function(data)
    -- Forwarded to UI via NUI callback response (handled in RegisterNUICallback below)
    -- Store for use in NUI callback
end)

RegisterNetEvent('cs:carplay:loginResult', function(data)
    NUI('syncUI', { action = 'login', data = data })
end)

RegisterNetEvent('cs:carplay:logoutResult', function()
    NUI('syncUI', { action = 'logout' })
end)

RegisterNetEvent('cs:carplay:playlistResult', function(data)
    NUI('syncUI', { action = 'playlistData', data = data })
end)

RegisterNetEvent('cs:carplay:saveMusicResult', function(id)
    -- id is the DB insert id or nil on remove; handled inside saveMusic NUI callback
    NUI('syncUI', { action = 'saveMusicResult', data = { id = id } })
end)

RegisterNetEvent('cs:carplay:clearPlaylistResult', function()
    NUI('syncUI', { action = 'clearPlaylist' })
end)

RegisterNetEvent('cs:carplay:stopMusicResult', function()
    exports.xsound:Destroy('cs_carplay_music')
    musicPlaying = false
    currentSong  = {}
end)

RegisterNetEvent('cs:carplay:musicPlayResult', function(volume)
    musicVolume = math.floor(volume * 100)
end)

RegisterNetEvent('cs:carplay:likeSync', function(fromSrc, data)
    -- Only update if we are not the source (handled in UI already for self)
end)

-- ── Nearby music ─────────────────────────────────────────────

RegisterNetEvent('cs:carplay:nearbyMusicStart', function(fromSrc, data)
    if fromSrc == GetPlayerServerId(PlayerId()) then return end
    local tPed = GetPlayerPed(GetPlayerFromServerId(fromSrc))
    if not tPed or tPed == 0 then return end
    local tVeh = GetVehiclePedIsIn(tPed, false)
    local pos  = tVeh ~= 0 and GetEntityCoords(tVeh) or GetEntityCoords(tPed)
    local key  = 'cs_near_' .. fromSrc

    exports.xsound:PlayUrlPos(key, data.url, data.volume or 0.3, pos, true)
    exports.xsound:Distance(key, CodeStudio.Outside_Music_Distance)
    if tVeh ~= 0 then exports.xsound:attachSound(key, tVeh) end
end)

RegisterNetEvent('cs:carplay:nearbyMusicStop', function(fromSrc)
    exports.xsound:Destroy('cs_near_' .. fromSrc)
end)

-- ── GTA radio suppressor ─────────────────────────────────────

CreateThread(function()
    while true do
        Wait(2000)
        if isUIOpen and CodeStudio.Disable_GTA_Radio then
            local veh = GetVeh()
            if veh ~= 0 then
                SetVehicleRadioEnabled(veh, false)
                SetVehRadioStation(veh, 'OFF')
            end
        end
    end
end)

-- ══════════════════════════════════════════════════════════════
--  NUI CALLBACKS
-- ══════════════════════════════════════════════════════════════

-- /fetchAppInfo  ← called on window.load (before UI is shown)
RegisterNUICallback('fetchAppInfo', function(data, cb)
    cb({
        enableApps      = CodeStudio.Apps,
        Language        = CodeStudio.Language,
        DefaultPlaylist = CodeStudio.Default_Playlist,
    })
end)

-- /loginAccount  ← {vehID}  →  {identifier, username}
RegisterNUICallback('loginAccount', function(data, cb)
    TriggerServerEvent('cs:carplay:loginAccount', data)
    -- Response arrives via cs:carplay:loginResult → NUI syncUI/login
    -- Also return immediately so the UI doesn't hang:
    cb({ status = 'ok' })
end)

-- /logoutAccount  ← {vehID, login}
RegisterNUICallback('logoutAccount', function(data, cb)
    TriggerServerEvent('cs:carplay:logoutAccount', data)
    cb({ status = 'ok' })
end)

-- /fetchPlaylist  ← {login}  →  [{id, musicData}]
RegisterNUICallback('fetchPlaylist', function(data, cb)
    TriggerServerEvent('cs:carplay:fetchPlaylist', data)
    cb({ status = 'ok' })
end)

-- /saveMusic  ← {like, login, data, vehID} | {like:false, musicID, vehID}
--              →  insertId (number) on save, nil on remove
RegisterNUICallback('saveMusic', function(data, cb)
    TriggerServerEvent('cs:carplay:saveMusic', data)
    cb({ status = 'ok' })
end)

-- /likeData  ← {like, data, vehID}  (nearby broadcast)
RegisterNUICallback('likeData', function(data, cb)
    TriggerServerEvent('cs:carplay:likeData', data)
    cb({ status = 'ok' })
end)

-- /musicPlay  ← {vehID, url, liked}  →  volume (0–1)
RegisterNUICallback('musicPlay', function(data, cb)
    if not data or not data.url then cb(0); return end

    exports.xsound:Destroy('cs_carplay_music')

    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)
    local pos = veh ~= 0 and GetEntityCoords(veh) or GetEntityCoords(ped)

    if CodeStudio.Music_Outside_Veh then
        exports.xsound:PlayUrlPos('cs_carplay_music', data.url, musicVolume / 100, pos, true)
        exports.xsound:Distance('cs_carplay_music', CodeStudio.Outside_Music_Distance)
    else
        exports.xsound:PlayUrl('cs_carplay_music', data.url, musicVolume / 100, true)
    end

    musicPlaying = true
    currentSong  = { url = data.url }

    -- Sync to nearby players
    if CodeStudio.Music_Outside_Veh then
        TriggerServerEvent('cs:carplay:syncMusicServer', { url = data.url, volume = musicVolume / 100 })
    end

    -- Discord log when playing
    if CodeStudio.DiscordLog.Enable then
        TriggerServerEvent('cs:carplay:logMusic', { url = data.url })
    end

    -- Return volume (0-1 scale) so UI sets the slider correctly
    cb(musicVolume / 100)
end)

-- /stopMusic
RegisterNUICallback('stopMusic', function(data, cb)
    exports.xsound:Destroy('cs_carplay_music')
    musicPlaying = false
    currentSong  = {}
    TriggerServerEvent('cs:carplay:stopSyncMusicServer')
    cb({ status = 'ok' })
end)

-- /adjustVolume  ← {volume}  (0–100 from slider)
RegisterNUICallback('adjustVolume', function(data, cb)
    if not data or data.volume == nil then cb({ status = 'error' }); return end
    musicVolume = tonumber(data.volume)
    exports.xsound:setVolume('cs_carplay_music', musicVolume / 100)
    cb({ status = 'ok' })
end)

-- /loopMusic
RegisterNUICallback('loopMusic', function(data, cb)
    musicLoop = not musicLoop
    exports.xsound:setLoop('cs_carplay_music', musicLoop)
    cb({ status = 'ok', loop = musicLoop })
end)

-- /clearPlaylist  ← {vehID, login}
RegisterNUICallback('clearPlaylist', function(data, cb)
    TriggerServerEvent('cs:carplay:clearPlaylist', data)
    cb({ status = 'ok' })
end)

-- /carInfo  → {vName, vBody, vFuel, vEngine, vTemp}
RegisterNUICallback('carInfo', function(data, cb)
    local ped  = PlayerPedId()
    local veh  = GetVehiclePedIsIn(ped, false)
    if veh == 0 then cb(false); return end

    cb({
        vName   = GetDisplayNameFromVehicleModel(GetEntityModel(veh)),
        vBody   = math.floor(GetVehicleBodyHealth(veh) / 10) .. '%',
        vFuel   = math.floor(GetVehicleFuel(veh)) .. '%',
        vEngine = math.floor(GetVehicleEngineHealth(veh) / 10) .. '%',
        vTemp   = math.floor(GetVehicleEngineHealth(veh) / 10) .. '°C',
    })
end)

-- /carAction  ← {action, index}
RegisterNUICallback('carAction', function(data, cb)
    local veh = GetVeh()
    if veh == 0 then cb({ status = 'error' }); return end

    local act   = data.action
    local index = tonumber(data.index)

    if act == 'door' then
        local open = GetVehicleDoorAngleRatio(veh, index) > 0.1
        if open then
            SetVehicleDoorShut(veh, index, false)
        elseif not IsVehicleDoorDamaged(veh, index) then
            SetVehicleDoorOpen(veh, index, false, false)
        end
        cb({ status = 'ok', open = not open, index = index })

    elseif act == 'alldoors' then
        local anyOpen = false
        for i = 0, 5 do if GetVehicleDoorAngleRatio(veh, i) > 0.1 then anyOpen = true; break end end
        for i = 0, 5 do
            if not IsVehicleDoorDamaged(veh, i) then
                if anyOpen then SetVehicleDoorShut(veh, i, false)
                else SetVehicleDoorOpen(veh, i, false, false) end
            end
        end
        cb({ status = 'ok', open = not anyOpen })

    elseif act == 'window' then
        if IsVehicleWindowIntact(veh, index) then
            RollDownWindow(veh, index)
            cb({ status = 'ok', open = true, index = index })
        else
            RollUpWindow(veh, index)
            cb({ status = 'ok', open = false, index = index })
        end

    elseif act == 'seat' then
        local seatIdx = index == 10 and -1 or (index)
        local occupant = GetPedInVehicleSeat(veh, seatIdx)
        if occupant ~= 0 and occupant ~= PlayerPedId() then
            TaskLeaveVehicle(occupant, veh, 16)
        end
        cb({ status = 'ok' })
    else
        cb({ status = 'error' })
    end
end)

-- /carControl  ← no body = state query; {type=...} = toggle action
RegisterNUICallback('carControl', function(data, cb)
    local veh = GetVeh()
    if veh == 0 then cb({ status = 'error' }); return end

    -- Called with no body to fetch initial state for the control panel UI
    if not data or not data.type then
        local _, lights, _ = GetVehicleLightsState(veh)
        cb({
            vEngine  = GetIsVehicleEngineRunning(veh),
            vLight   = lights ~= 0,
            vHazard  = hazardActive,
            vDoors   = GetVehicleDoorAngleRatio(veh, 0) > 0.0,
            vMusicRGB = rgbActive,
        })
        return
    end
    local t = data.type

    if t == 'engine' then
        local on = GetIsVehicleEngineRunning(veh)
        SetVehicleEngineOn(veh, not on, false, true)
        cb({ status = 'ok', on = not on })

    elseif t == 'headlight' then
        local _, lights, _ = GetVehicleLightsState(veh)
        local newState = (lights == 0) and 2 or 0
        SetVehicleLights(veh, newState)
        cb({ status = 'ok', on = newState ~= 0 })

    elseif t == 'hazard' then
        if hazardActive then
            StopHazards(veh)
            hazardActive = false
            cb({ status = 'ok', on = false })
        else
            StartHazards(veh)
            cb({ status = 'ok', on = true })
        end

    elseif t == 'musicrgb' then
        if rgbActive then
            StopRGB()
            cb({ status = 'ok', on = false })
        else
            StartRGB(veh)
            cb({ status = 'ok', on = true })
        end
    else
        cb({ status = 'error' })
    end
end)

-- /carCamera  ← JS sends JSON.stringify("front"|"back"|"exit") or no body
RegisterNUICallback('carCamera', function(data, cb)
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)

    -- data arrives as a plain string (or nil when $.post sends no body)
    local camType = (type(data) == 'string' and data) or (type(data) == 'table' and data.type) or 'exit'

    if camType == 'exit' then
        if frontCam then DestroyCam(frontCam, false); frontCam = nil end
        if backCam  then DestroyCam(backCam,  false); backCam  = nil end
        RenderScriptCams(false, false, 0, true, true)
        cb({ status = 'ok' }); return
    end

    if veh == 0 then cb({ status = 'error', msg = 'not_in_vehicle' }); return end

    if camType == 'front' then
        local bi = GetEntityBoneIndexByName(veh, 'bonnet')
        if bi == -1 then
            Notification(CodeStudio.Language.no_camera_front, 'error')
            cb({ status = 'error', msg = 'no_front_cam' }); return
        end
        if frontCam then DestroyCam(frontCam, false) end
        frontCam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', 0,0,0, -5,0, GetEntityHeading(veh), 90, false, 0)
        AttachCamToEntity(frontCam, veh, 0.0, 1.8, 0.6, true)
        SetCamActive(frontCam, true)
        RenderScriptCams(true, false, 0, true, true)
        cb({ status = 'ok' })

    elseif camType == 'back' then
        local bi = GetEntityBoneIndexByName(veh, 'boot')
        if bi == -1 then
            Notification(CodeStudio.Language.no_camera_back, 'error')
            cb({ status = 'error', msg = 'no_back_cam' }); return
        end
        if backCam then DestroyCam(backCam, false) end
        backCam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', 0,0,0, -8,0, GetEntityHeading(veh)+180, 100, false, 0)
        AttachCamToEntity(backCam, veh, 0.0, -2.0, 0.5, true)
        SetCamActive(backCam, true)
        RenderScriptCams(true, false, 0, true, true)
        cb({ status = 'ok' })
    else
        cb({ status = 'error' })
    end
end)

-- /autoPilot  ← {action:'start'|'stop'|'getWaypoint', coords?}
RegisterNUICallback('autoPilot', function(data, cb)
    if data.action == 'getWaypoint' then
        if IsWaypointActive() then
            local wp = GetBlipCoords(GetFirstBlipInfoId(8))
            cb({ status = 'ok', coords = { x = wp.x, y = wp.y, z = wp.z } })
        else
            Notification(CodeStudio.Language.autopilot_error, 'error')
            exports.xsound:PlayUrlPos('cs_ap_err', 'nui://cs_carplay/ui/sound/autopilot_error.mp3', 0.5, vector3(0,0,0), false)
            cb({ status = 'error', msg = 'no_waypoint' })
        end
    elseif data.action == 'start' then
        if not IsDriver() then
            Notification(CodeStudio.Language.autopilot_driver, 'error')
            cb({ status = 'error', msg = 'not_driver' }); return
        end
        if data.coords then
            StartAutoPilot(data.coords)
            cb({ status = 'ok', active = true })
        else
            Notification(CodeStudio.Language.autopilot_error, 'error')
            cb({ status = 'error', msg = 'no_coords' })
        end
    elseif data.action == 'stop' then
        StopAutoPilot()
        cb({ status = 'ok', active = false })
    else
        cb({ status = 'error' })
    end
end)

-- /chatGPTAction  ← {msg}  →  {answer, actions[]}
RegisterNUICallback('chatGPTAction', function(data, cb)
    if not data or not data.msg then cb({ status = 'error' }); return end
    local msg    = string.lower(data.msg)
    local answer = nil

    for _, entry in ipairs(CodeStudio.AI_Chat) do
        for _, q in ipairs(entry.Questions) do
            if string.find(msg, string.lower(q), 1, true) then
                answer = entry.Answer
                if entry.action then pcall(entry.action, GetVeh()) end
                if entry.CloseUI then CloseUI() end
                if entry.MusicURL then
                    local url = string.match(data.msg, 'https?://[%S]+')
                    if url then
                        -- Trigger play inside UI via message
                        NUI('syncUI', { action = 'musicEntry', data = { musicSrc = url } })
                    end
                end
                break
            end
        end
        if answer then break end
    end

    cb({ status = 'ok', answer = answer or "I'm sorry, I don't understand that." })
end)

-- /installRadio  ← {plate, install}
RegisterNUICallback('installRadio', function(data, cb)
    local veh = GetVeh()
    if veh == 0 then
        Notification(CodeStudio.Language.not_in_veh_install, 'error')
        cb({ status = 'error' }); return
    end
    InstallRadio(GetPlate(veh), data.install)
    cb({ status = 'ok' })
end)

-- /closeUI  (JS-initiated close — use RawCloseUI to avoid send↔receive loop)
RegisterNUICallback('closeUI', function(data, cb)
    RawCloseUI()
    cb({ status = 'ok' })
end)

-- /openMap
RegisterNUICallback('openMap', function(data, cb)
    openMap()
    cb({ status = 'ok' })
end)
