--[[
                           _   _     __    ___    _____ 
                          (_) | |   /_ |  / _ \  | ____|
   ___   ___   _ __ ___    _  | |_   | | | (_) | | |__
  / __| / __| | '_ ` _ \  | | | __|  | |  \__, | |___ \
 | (__  \__ \ | | | | | | | | | |_   | |    / /   ___) |
  \___| |___/ |_| |_| |_| |_|  \__|  |_|   /_/   |____/
   
    This is a Lua & Config loader
    -------------------------------------------------

    Luas Loading:
    {{#each luas}}
    # {{this}}.lua
    {{/each}}

    Config Loading:
    {{#if isEmbedded}}
    [Embedded Config Code]
    {{else}}
    {{config}}
    {{/if}}
]]
local resetConfig = ui.reference("CONFIG", "Presets", "Reset")

local function Cleanup()
    ui.set(resetConfig, 1)
end

local function Initiate()
    local luas = {
        {{#each luas}}
        "{{this}}",
        {{/each}}
    }
    for index, lua in ipairs(luas) do
        -- Wrapping in a pcall to future proof against idiots.
        pcall(function()
            require(lua)
        end)
    end

    {{#if isEmbedded}}
    config.import([[{{config}}]])
    {{else}}
    config.load("{{config}}")
    {{/if}}

    client.set_event_callback("shutdown", Cleanup)
end

Initiate()