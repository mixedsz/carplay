-- ============================================================
--  cs_carplay  |  main/server.lua
--  Full server-side logic matching the deobfuscated UI contracts.
--
--  NUI endpoints implemented (RegisterNUICallback in client.lua):
--    /fetchAppInfo        → {enableApps, Language, DefaultPlaylist}
--    /loginAccount        → {identifier, username}
--    /logoutAccount       ← {vehID, login}
--    /fetchPlaylist       ← {login}  →  [{id, musicData}]
--    /saveMusic           ← {like, login, data, vehID} | {like:false, musicID}
--    /likeData            ← {like, data, vehID}  (nearby sync broadcast)
--    /clearPlaylist       ← {vehID, login}
--    /musicPlay           ← {vehID, url, liked}  → volume (number)
--    /adjustVolume        ← {volume}
--    /loopMusic           ← {}
--    /carInfo             → {vName, vBody, vFuel, vEngine, vTemp}
--    /carAction           ← {action, index}
--    /carControl          ← {type}
--    /carCamera           ← {type}
--    /autoPilot           ← {action, coords?}
--    /chatGPTAction       ← {msg}
--    /installRadio        ← install data
--    /closeUI             ← {}
--    /openMap             ← {}
--
--  Server events:
--    cs:carplay:addInstall  (plate, install)  ← cl_function.lua
--    cs:carplay:checkInstall (plate)
--    cs:carplay:syncMusic   / cs:carplay:stopSyncMusic
-- ============================================================

local ESX, QBCore

-- ── Framework bootstrap ─────────────────────────────────────
if CodeStudio.ServerType == 'ESX' then
    TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
elseif CodeStudio.ServerType == 'QB' then
    QBCore = exports['qb-core']:GetCoreObject()
end

-- ── Auto SQL ────────────────────────────────────────────────
if CodeStudio.AutoSQL then
    -- Users table: stores identifier → username mapping (populated on first login)
    MySQL.query([[
        CREATE TABLE IF NOT EXISTS `cs_carplay_users` (
            `id`         int(11)      NOT NULL AUTO_INCREMENT,
            `identifier` varchar(100) NOT NULL,
            `username`   varchar(100) DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `identifier` (`identifier`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ]])

    -- Playlist table: musicData stored as JSON string
    -- (matches JS structure: {musicSrc, title, authorName, thumbnailUrl, saved:true})
    MySQL.query([[
        CREATE TABLE IF NOT EXISTS `cs_carplay_playlist` (
            `id`         int(11)      NOT NULL AUTO_INCREMENT,
            `identifier` varchar(100) NOT NULL,
            `musicData`  longtext     NOT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_identifier` (`identifier`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ]])

    -- Radio installation table
    if CodeStudio.Main.RadioInstall.Enable then
        MySQL.query([[
            CREATE TABLE IF NOT EXISTS `cs_carplay_radio` (
                `plate` varchar(20) NOT NULL,
                PRIMARY KEY (`plate`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ]])
    end
end

-- ── Helpers ─────────────────────────────────────────────────

local function GetIdentifier(src)
    for _, v in ipairs(GetPlayerIdentifiers(src)) do
        if string.sub(v, 1, 8) == 'license:' then return v end
    end
    return 'license:' .. tostring(src)
end

local function GetPlayerName(src)
    return GetPlayerName(src) or 'Player'
end

local function GetFrameworkPlayer(src)
    if CodeStudio.ServerType == 'ESX' then
        return ESX.GetPlayerFromId(src)
    elseif CodeStudio.ServerType == 'QB' then
        return QBCore.Functions.GetPlayer(src)
    end
    return nil
end

local function GetPlayerJob(src)
    if CodeStudio.ServerType == 'ESX' then
        local xP = ESX.GetPlayerFromId(src)
        if xP then return xP.getJob().name end
    elseif CodeStudio.ServerType == 'QB' then
        local p = QBCore.Functions.GetPlayer(src)
        if p then return p.PlayerData.job.name end
    end
    return ''
end

local function HasAccess(src)
    local restrictList = CodeStudio.Main.Restrict_Radio
    if not restrictList or #restrictList == 0 then return true end

    local identifier = GetIdentifier(src)
    local job        = GetPlayerJob(src)

    for _, rule in ipairs(restrictList) do
        if IsPlayerAceAllowed(src, rule)                          then return true end
        if identifier == rule                                     then return true end
        if job        == rule                                     then return true end
        for _, id in ipairs(GetPlayerIdentifiers(src)) do
            if id == rule                                         then return true end
        end
    end
    return false
end

-- ── Discord Webhook ─────────────────────────────────────────

local function DiscordLog(data)
    if not CodeStudio.DiscordLog.Enable                           then return end
    if not CodeStudio.DiscordLog.Play_Webhook
    or CodeStudio.DiscordLog.Play_Webhook == ''                   then return end

    local payload = json.encode({
        username = 'CarPlay Music Logger',
        embeds   = {{
            title  = '🎵 Now Playing',
            color  = 5814783,
            fields = {
                { name = 'Player',     value = tostring(data.playerName  or 'Unknown'), inline = true  },
                { name = 'Identifier', value = tostring(data.identifier  or 'Unknown'), inline = true  },
                { name = 'Song',       value = tostring(data.title       or 'Unknown'), inline = true  },
                { name = 'Artist',     value = tostring(data.artist      or 'Unknown'), inline = true  },
                { name = 'URL',        value = tostring(data.url         or 'Unknown'), inline = false },
            },
            footer = { text = 'CodeStudio CarPlay • ' .. os.date('%Y-%m-%d %H:%M:%S') },
        }},
    })

    PerformHttpRequest(
        CodeStudio.DiscordLog.Play_Webhook,
        function() end,
        'POST',
        payload,
        { ['Content-Type'] = 'application/json' }
    )
end

-- ══════════════════════════════════════════════════════════════
--  NUI CALLBACK HANDLERS
--  (registered from client.lua via RegisterNUICallback)
--  The client triggers server events for DB ops; results come
--  back via TriggerClientEvent → SendNUIMessage.
-- ══════════════════════════════════════════════════════════════

-- ── /fetchAppInfo ────────────────────────────────────────────
--  Called once on window.load. Returns config for setApps().
RegisterNetEvent('cs:carplay:fetchAppInfo', function()
    local src = source
    TriggerClientEvent('cs:carplay:appInfoResult', src, {
        enableApps      = CodeStudio.Apps,
        Language        = CodeStudio.Language,
        DefaultPlaylist = CodeStudio.Default_Playlist,
    })
end)

-- ── /loginAccount ────────────────────────────────────────────
--  body: {vehID}
--  Returns: {identifier, username} — loginID used in all playlist ops.
RegisterNetEvent('cs:carplay:loginAccount', function(data)
    local src        = source
    local identifier = GetIdentifier(src)
    local name       = GetPlayerName(src)

    -- Upsert user record
    MySQL.query(
        'INSERT INTO cs_carplay_users (identifier, username) VALUES (?, ?) ON DUPLICATE KEY UPDATE username = VALUES(username)',
        { identifier, name }
    )

    TriggerClientEvent('cs:carplay:loginResult', src, {
        identifier = identifier,
        username   = name,
    })
end)

-- ── /logoutAccount ───────────────────────────────────────────
--  body: {vehID, login}
RegisterNetEvent('cs:carplay:logoutAccount', function(data)
    -- Nothing persisted for logout; just broadcast syncUI logout to nearby
    local src = source
    TriggerClientEvent('cs:carplay:logoutResult', src, true)
end)

-- ── /fetchPlaylist ───────────────────────────────────────────
--  body: {login}  (login = identifier string)
--  Returns: [{id, musicData}] where musicData is a JSON string
RegisterNetEvent('cs:carplay:fetchPlaylist', function(data)
    local src        = source
    local identifier = GetIdentifier(src)

    MySQL.query(
        'SELECT id, musicData FROM cs_carplay_playlist WHERE identifier = ? ORDER BY id ASC',
        { identifier },
        function(result)
            TriggerClientEvent('cs:carplay:playlistResult', src, result or {})
        end
    )
end)

-- ── /saveMusic ───────────────────────────────────────────────
--  body (save):   {like:true,  login, data:{musicSrc,title,authorName,thumbnailUrl}, vehID}
--  body (remove): {like:false, musicID, vehID}
--  Returns: on save → DB insert id (number); on remove → nothing
RegisterNetEvent('cs:carplay:saveMusic', function(data)
    local src        = source
    local identifier = GetIdentifier(src)

    if data.like then
        -- Save to DB
        local musicData = json.encode(data.data)
        MySQL.insert(
            'INSERT INTO cs_carplay_playlist (identifier, musicData) VALUES (?, ?)',
            { identifier, musicData },
            function(insertId)
                TriggerClientEvent('cs:carplay:saveMusicResult', src, insertId)

                -- Discord log
                if data.data then
                    DiscordLog({
                        playerName  = GetPlayerName(src),
                        identifier  = identifier,
                        title       = data.data.title       or 'Unknown',
                        artist      = data.data.authorName  or 'Unknown',
                        url         = data.data.musicSrc    or '',
                    })
                end
            end
        )
    else
        -- Remove from DB
        if data.musicID then
            MySQL.query(
                'DELETE FROM cs_carplay_playlist WHERE id = ? AND identifier = ?',
                { tonumber(data.musicID), identifier }
            )
        end
        TriggerClientEvent('cs:carplay:saveMusicResult', src, nil)
    end
end)

-- ── /likeData ────────────────────────────────────────────────
--  body: {like, data, vehID}
--  Syncs the like state to nearby players (so their UI updates in real-time)
RegisterNetEvent('cs:carplay:likeData', function(data)
    local src = source
    -- Broadcast to all clients so nearby players can see the liked song in overlay
    TriggerClientEvent('cs:carplay:likeSync', -1, src, data)
end)

-- ── /musicPlay ───────────────────────────────────────────────
--  body: {vehID, url, liked}
--  Returns: volume (number, 0-1)  ← JS does: $(".volume-slider").val(result * 100)
RegisterNetEvent('cs:carplay:musicPlay', function(data)
    local src    = source
    local volume = (CodeStudio.Default_Music_Volume or 20) / 100

    -- Start xSound music on client (done in client.lua NUI callback)
    -- Just return the volume so the slider is set correctly
    TriggerClientEvent('cs:carplay:musicPlayResult', src, volume)

    -- Broadcast nearby music sync
    if CodeStudio.Music_Outside_Veh then
        TriggerClientEvent('cs:carplay:nearbyMusicStart', -1, src, {
            url    = data.url,
            volume = volume,
        })
    end
end)

-- ── /clearPlaylist ───────────────────────────────────────────
--  body: {vehID, login}
RegisterNetEvent('cs:carplay:clearPlaylist', function(data)
    local src        = source
    local identifier = GetIdentifier(src)

    MySQL.query(
        'DELETE FROM cs_carplay_playlist WHERE identifier = ?',
        { identifier },
        function()
            TriggerClientEvent('cs:carplay:clearPlaylistResult', src)
        end
    )
end)

-- ── /stopMusic ───────────────────────────────────────────────
RegisterNetEvent('cs:carplay:stopMusic', function()
    local src = source
    if CodeStudio.Music_Outside_Veh then
        TriggerClientEvent('cs:carplay:nearbyMusicStop', -1, src)
    end
    TriggerClientEvent('cs:carplay:stopMusicResult', src)
end)

-- ── /adjustVolume ────────────────────────────────────────────
RegisterNetEvent('cs:carplay:adjustVolume', function(data)
    -- handled entirely client-side via xSound; server just ACKs
    local src = source
    TriggerClientEvent('cs:carplay:adjustVolumeResult', src, data.volume)
end)

-- ── /carInfo ─────────────────────────────────────────────────
--  Returns: {vName, vBody, vFuel, vEngine, vTemp}
RegisterNetEvent('cs:carplay:carInfo', function()
    local src = source
    -- The actual vehicle data is computed client-side in the NUI callback;
    -- this event is fired as fallback if needed
    TriggerClientEvent('cs:carplay:carInfoResult', src, nil)
end)

-- ══════════════════════════════════════════════════════════════
--  SERVER EVENTS (from client game-code, not NUI)
-- ══════════════════════════════════════════════════════════════

-- ── Radio Installation ───────────────────────────────────────

local function HasRadioItem(src)
    local item = CodeStudio.Main.RadioInstall.Options.RadioItem
    if not item then return true end
    if CodeStudio.ServerType == 'ESX' then
        local xP = ESX.GetPlayerFromId(src)
        if xP then local inv = xP.getInventoryItem(item); return inv and inv.count > 0 end
    elseif CodeStudio.ServerType == 'QB' then
        local p = QBCore.Functions.GetPlayer(src)
        if p then return p.Functions.GetItemByName(item) ~= nil end
    else
        return true
    end
    return false
end

local function RemoveRadioItem(src)
    local item = CodeStudio.Main.RadioInstall.Options.RadioItem
    if not item then return end
    if CodeStudio.ServerType == 'ESX' then
        local xP = ESX.GetPlayerFromId(src); if xP then xP.removeInventoryItem(item, 1) end
    elseif CodeStudio.ServerType == 'QB' then
        local p = QBCore.Functions.GetPlayer(src); if p then p.Functions.RemoveItem(item, 1) end
    end
end

local function GiveRadioItem(src)
    local item = CodeStudio.Main.RadioInstall.Options.RadioItem
    if not item then return end
    if CodeStudio.ServerType == 'ESX' then
        local xP = ESX.GetPlayerFromId(src); if xP then xP.addInventoryItem(item, 1) end
    elseif CodeStudio.ServerType == 'QB' then
        local p = QBCore.Functions.GetPlayer(src); if p then p.Functions.AddItem(item, 1) end
    end
end

RegisterNetEvent('cs:carplay:addInstall', function(plate, install)
    local src = source
    if not CodeStudio.Main.RadioInstall.Enable then return end
    plate = string.upper(string.gsub(tostring(plate), '%s+', ''))

    if install then
        if CodeStudio.Main.RadioInstall.Options.RadioItem and not HasRadioItem(src) then
            TriggerClientEvent('cs:carplay:notification', src, CodeStudio.Language.no_radio_item, 'error')
            return
        end
        if CodeStudio.Main.RadioInstall.Options.OnlyOwned then
            local identifier = GetIdentifier(src)
            MySQL.query(
                'SELECT plate FROM `' .. CodeStudio.Main.RadioInstall.Options.Vehicles_Table .. '` WHERE plate = ? AND owner = ? LIMIT 1',
                { plate, identifier },
                function(result)
                    if not result or not result[1] then
                        TriggerClientEvent('cs:carplay:notification', src, CodeStudio.Language.veh_not_owned, 'error')
                        return
                    end
                    MySQL.query('INSERT IGNORE INTO cs_carplay_radio (plate) VALUES (?)', { plate }, function()
                        RemoveRadioItem(src)
                        TriggerClientEvent('cs:carplay:radioInstalled', src, plate, true)
                    end)
                end
            )
        else
            MySQL.query('INSERT IGNORE INTO cs_carplay_radio (plate) VALUES (?)', { plate }, function()
                RemoveRadioItem(src)
                TriggerClientEvent('cs:carplay:radioInstalled', src, plate, true)
            end)
        end
    else
        MySQL.query('DELETE FROM cs_carplay_radio WHERE plate = ?', { plate }, function()
            GiveRadioItem(src)
            TriggerClientEvent('cs:carplay:radioInstalled', src, plate, false)
        end)
    end
end)

RegisterNetEvent('cs:carplay:checkInstall', function(plate)
    local src = source
    if not CodeStudio.Main.RadioInstall.Enable then
        TriggerClientEvent('cs:carplay:installStatus', src, true)
        return
    end
    plate = string.upper(string.gsub(tostring(plate), '%s+', ''))
    MySQL.query('SELECT plate FROM cs_carplay_radio WHERE plate = ? LIMIT 1', { plate }, function(result)
        TriggerClientEvent('cs:carplay:installStatus', src, result ~= nil and result[1] ~= nil)
    end)
end)

-- ── Nearby music sync ────────────────────────────────────────

RegisterNetEvent('cs:carplay:syncMusicServer', function(data)
    local src = source
    if CodeStudio.Music_Outside_Veh then
        TriggerClientEvent('cs:carplay:nearbyMusicStart', -1, src, data)
    end
end)

RegisterNetEvent('cs:carplay:stopSyncMusicServer', function()
    local src = source
    TriggerClientEvent('cs:carplay:nearbyMusicStop', -1, src)
end)

-- ── Item-based open ──────────────────────────────────────────

if CodeStudio.Main.UseWithItem.Enable and CodeStudio.ServerType ~= false then
    if CodeStudio.ServerType == 'ESX' then
        ESX.RegisterUsableItem(CodeStudio.Main.UseWithItem.Item, function(src)
            TriggerClientEvent('cs:carPlay:openUI', src)
        end)
    elseif CodeStudio.ServerType == 'QB' then
        QBCore.Functions.CreateUseableItem(CodeStudio.Main.UseWithItem.Item, function(src)
            TriggerClientEvent('cs:carPlay:openUI', src)
        end)
    end
end
