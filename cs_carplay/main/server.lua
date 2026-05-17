-- ============================================================
--  cs_carplay  |  main/server.lua
--  Full server-side logic: database, framework, webhooks,
--  radio installation, playlist & settings persistence.
-- ============================================================

local ESX, QBCore

-- ── Framework bootstrap ────────────────────────────────────
if CodeStudio.ServerType == 'ESX' then
    TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
elseif CodeStudio.ServerType == 'QB' then
    QBCore = exports['qb-core']:GetCoreObject()
end

-- ── Auto SQL ───────────────────────────────────────────────
if CodeStudio.AutoSQL then
    MySQL.query([[
        CREATE TABLE IF NOT EXISTS `cs_carplay_users` (
            `id`         int(11)       NOT NULL AUTO_INCREMENT,
            `identifier` varchar(100)  NOT NULL,
            `settings`   longtext      DEFAULT NULL,
            PRIMARY KEY (`id`),
            UNIQUE KEY `identifier` (`identifier`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ]])

    MySQL.query([[
        CREATE TABLE IF NOT EXISTS `cs_carplay_playlist` (
            `id`         int(11)       NOT NULL AUTO_INCREMENT,
            `identifier` varchar(100)  NOT NULL,
            `url`        varchar(1000) NOT NULL,
            `title`      varchar(255)  DEFAULT NULL,
            `artist`     varchar(255)  DEFAULT NULL,
            `thumbnail`  varchar(1000) DEFAULT NULL,
            PRIMARY KEY (`id`),
            KEY `idx_identifier` (`identifier`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ]])

    if CodeStudio.Main.RadioInstall.Enable then
        MySQL.query([[
            CREATE TABLE IF NOT EXISTS `cs_carplay_radio` (
                `plate` varchar(20) NOT NULL,
                PRIMARY KEY (`plate`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ]])
    end
end

-- ── Helpers ────────────────────────────────────────────────

local function GetIdentifier(src)
    for _, v in ipairs(GetPlayerIdentifiers(src)) do
        if string.sub(v, 1, 8) == 'license:' then return v end
    end
    return tostring(src)
end

local function GetPlayerData(src)
    if CodeStudio.ServerType == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            return {
                identifier = xPlayer.identifier,
                name       = xPlayer.getName(),
                job        = xPlayer.getJob().name,
                group      = xPlayer.getGroup(),
            }
        end
    elseif CodeStudio.ServerType == 'QB' then
        local player = QBCore.Functions.GetPlayer(src)
        if player then
            local ci = player.PlayerData.charinfo
            return {
                identifier = player.PlayerData.citizenid,
                name       = ci.firstname .. ' ' .. ci.lastname,
                job        = player.PlayerData.job.name,
                group      = player.PlayerData.group,
            }
        end
    else
        return {
            identifier = GetIdentifier(src),
            name       = GetPlayerName(src),
            job        = '',
            group      = 'user',
        }
    end
    return nil
end

local function HasAccess(src)
    local restrictList = CodeStudio.Main.Restrict_Radio
    if not restrictList or #restrictList == 0 then return true end

    local identifier  = GetIdentifier(src)
    local playerData  = GetPlayerData(src)

    for _, rule in ipairs(restrictList) do
        -- ace permission
        if IsPlayerAceAllowed(src, rule) then return true end
        -- direct identifier match
        if identifier == rule then return true end
        -- any identifier (e.g. discord:)
        for _, id in ipairs(GetPlayerIdentifiers(src)) do
            if id == rule then return true end
        end
        -- job match (framework)
        if playerData and playerData.job == rule then return true end
    end
    return false
end

-- ── Discord Webhook ────────────────────────────────────────

local function DiscordLog(data)
    if not CodeStudio.DiscordLog.Enable then return end
    if not CodeStudio.DiscordLog.Play_Webhook or CodeStudio.DiscordLog.Play_Webhook == '' then return end

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

-- ── Access gate ────────────────────────────────────────────

RegisterNetEvent('cs:carPlay:requestOpen', function()
    local src = source
    if not HasAccess(src) then
        TriggerClientEvent('cs:carPlay:notification', src, CodeStudio.Language.not_allowed, 'error')
        return
    end
    TriggerClientEvent('cs:carPlay:canOpen', src, true)
end)

-- ── Fetch all user data for UI init ───────────────────────

RegisterNetEvent('cs:carplay:fetchData', function()
    local src        = source
    local identifier = GetIdentifier(src)

    MySQL.query(
        'SELECT settings FROM cs_carplay_users WHERE identifier = ? LIMIT 1',
        { identifier },
        function(settingsResult)
            local settings = nil
            if settingsResult and settingsResult[1] then
                settings = json.decode(settingsResult[1].settings or 'null')
            end

            MySQL.query(
                'SELECT url, title, artist, thumbnail FROM cs_carplay_playlist WHERE identifier = ? ORDER BY id ASC',
                { identifier },
                function(playlist)
                    TriggerClientEvent('cs:carplay:receiveData', src, {
                        settings        = settings,
                        playlist        = playlist or {},
                        defaultPlaylist = CodeStudio.Default_Playlist,
                        config          = {
                            defaultVolume = CodeStudio.Default_Music_Volume,
                            apps          = CodeStudio.Apps,
                            language      = CodeStudio.Language,
                            autoPilot     = CodeStudio.AutoPilot,
                            distanceUnit  = CodeStudio.MarkedLocation_Unit,
                            onlyDriver    = CodeStudio.OnlyDriver,
                        },
                    })
                end
            )
        end
    )
end)

-- ── Save / reset settings ──────────────────────────────────

RegisterNetEvent('cs:carplay:saveSettings', function(settings)
    local src        = source
    local identifier = GetIdentifier(src)
    if not identifier then return end

    MySQL.query(
        'INSERT INTO cs_carplay_users (identifier, settings) VALUES (?, ?) ON DUPLICATE KEY UPDATE settings = VALUES(settings)',
        { identifier, json.encode(settings) }
    )
end)

RegisterNetEvent('cs:carplay:resetSettings', function()
    local src        = source
    local identifier = GetIdentifier(src)
    if not identifier then return end

    MySQL.query(
        'UPDATE cs_carplay_users SET settings = NULL WHERE identifier = ?',
        { identifier },
        function()
            TriggerClientEvent('cs:carplay:settingsReset', src)
        end
    )
end)

-- ── Playlist management ────────────────────────────────────

RegisterNetEvent('cs:carplay:saveToPlaylist', function(data)
    local src        = source
    local identifier = GetIdentifier(src)
    if not identifier or not data or not data.url then return end

    -- Prevent duplicates
    MySQL.query(
        'SELECT id FROM cs_carplay_playlist WHERE identifier = ? AND url = ? LIMIT 1',
        { identifier, data.url },
        function(existing)
            if existing and existing[1] then
                TriggerClientEvent('cs:carplay:playlistSaved', src, false, 'duplicate')
                return
            end
            MySQL.query(
                'INSERT INTO cs_carplay_playlist (identifier, url, title, artist, thumbnail) VALUES (?, ?, ?, ?, ?)',
                {
                    identifier,
                    data.url       or '',
                    data.title     or 'Unknown',
                    data.artist    or 'Unknown',
                    data.thumbnail or '',
                },
                function(result)
                    TriggerClientEvent('cs:carplay:playlistSaved', src, result ~= nil, 'ok')
                end
            )
        end
    )
end)

RegisterNetEvent('cs:carplay:removeFromPlaylist', function(url)
    local src        = source
    local identifier = GetIdentifier(src)
    if not identifier or not url then return end

    MySQL.query(
        'DELETE FROM cs_carplay_playlist WHERE identifier = ? AND url = ?',
        { identifier, url },
        function()
            TriggerClientEvent('cs:carplay:songRemoved', src, url)
        end
    )
end)

RegisterNetEvent('cs:carplay:clearPlaylist', function()
    local src        = source
    local identifier = GetIdentifier(src)
    if not identifier then return end

    MySQL.query(
        'DELETE FROM cs_carplay_playlist WHERE identifier = ?',
        { identifier },
        function()
            TriggerClientEvent('cs:carplay:playlistCleared', src)
        end
    )
end)

-- ── Full factory reset ─────────────────────────────────────

RegisterNetEvent('cs:carplay:resetAll', function()
    local src        = source
    local identifier = GetIdentifier(src)
    if not identifier then return end

    MySQL.query('DELETE FROM cs_carplay_playlist WHERE identifier = ?', { identifier })
    MySQL.query(
        'UPDATE cs_carplay_users SET settings = NULL WHERE identifier = ?',
        { identifier },
        function()
            TriggerClientEvent('cs:carplay:allReset', src)
        end
    )
end)

-- ── Music logging ──────────────────────────────────────────

RegisterNetEvent('cs:carplay:logMusic', function(data)
    local src        = source
    local playerData = GetPlayerData(src)
    if playerData then
        data.playerName = playerData.name
        data.identifier = playerData.identifier
    end
    DiscordLog(data)
end)

-- ── Radio Installation ─────────────────────────────────────

local function HasRadioItem(src)
    local item = CodeStudio.Main.RadioInstall.Options.RadioItem
    if not item then return true end

    if CodeStudio.ServerType == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then
            local inv = xPlayer.getInventoryItem(item)
            return inv and inv.count > 0
        end
    elseif CodeStudio.ServerType == 'QB' then
        local player = QBCore.Functions.GetPlayer(src)
        if player then
            return player.Functions.GetItemByName(item) ~= nil
        end
    else
        return true
    end
    return false
end

local function RemoveRadioItem(src)
    local item = CodeStudio.Main.RadioInstall.Options.RadioItem
    if not item then return end

    if CodeStudio.ServerType == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then xPlayer.removeInventoryItem(item, 1) end
    elseif CodeStudio.ServerType == 'QB' then
        local player = QBCore.Functions.GetPlayer(src)
        if player then player.Functions.RemoveItem(item, 1) end
    end
end

local function GiveRadioItem(src)
    local item = CodeStudio.Main.RadioInstall.Options.RadioItem
    if not item then return end

    if CodeStudio.ServerType == 'ESX' then
        local xPlayer = ESX.GetPlayerFromId(src)
        if xPlayer then xPlayer.addInventoryItem(item, 1) end
    elseif CodeStudio.ServerType == 'QB' then
        local player = QBCore.Functions.GetPlayer(src)
        if player then player.Functions.AddItem(item, 1) end
    end
end

RegisterNetEvent('cs:carplay:addInstall', function(plate, install)
    local src = source
    if not CodeStudio.Main.RadioInstall.Enable then return end
    if not plate then return end

    plate = string.upper(string.gsub(plate, '%s+', ''))

    if install then
        -- Require radio item
        if CodeStudio.Main.RadioInstall.Options.RadioItem then
            if not HasRadioItem(src) then
                TriggerClientEvent('cs:carplay:notification', src, CodeStudio.Language.no_radio_item, 'error')
                return
            end
        end

        -- Optional: only owned vehicles
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
                    MySQL.query(
                        'INSERT IGNORE INTO cs_carplay_radio (plate) VALUES (?)',
                        { plate },
                        function()
                            RemoveRadioItem(src)
                            TriggerClientEvent('cs:carplay:radioInstalled', src, plate, true)
                        end
                    )
                end
            )
        else
            MySQL.query(
                'INSERT IGNORE INTO cs_carplay_radio (plate) VALUES (?)',
                { plate },
                function()
                    RemoveRadioItem(src)
                    TriggerClientEvent('cs:carplay:radioInstalled', src, plate, true)
                end
            )
        end
    else
        -- Uninstall
        MySQL.query(
            'DELETE FROM cs_carplay_radio WHERE plate = ?',
            { plate },
            function()
                GiveRadioItem(src)
                TriggerClientEvent('cs:carplay:radioInstalled', src, plate, false)
            end
        )
    end
end)

RegisterNetEvent('cs:carplay:checkInstall', function(plate)
    local src = source
    if not CodeStudio.Main.RadioInstall.Enable then
        TriggerClientEvent('cs:carplay:installStatus', src, true)
        return
    end
    if not plate then
        TriggerClientEvent('cs:carplay:installStatus', src, false)
        return
    end
    plate = string.upper(string.gsub(plate, '%s+', ''))
    MySQL.query(
        'SELECT plate FROM cs_carplay_radio WHERE plate = ? LIMIT 1',
        { plate },
        function(result)
            TriggerClientEvent('cs:carplay:installStatus', src, result ~= nil and result[1] ~= nil)
        end
    )
end)

-- ── Item-based open (ESX / QB) ─────────────────────────────

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

-- ── Sync music to nearby players (outside-vehicle audio) ──

RegisterNetEvent('cs:carplay:syncMusic', function(data)
    local src = source

    -- Broadcast to all other players so they can hear the music
    -- from outside the vehicle (handled client-side via xSound distance check)
    TriggerClientEvent('cs:carplay:nearbyMusic', -1, src, data)
end)

RegisterNetEvent('cs:carplay:stopSyncMusic', function()
    local src = source
    TriggerClientEvent('cs:carplay:stopNearbyMusic', -1, src)
end)
