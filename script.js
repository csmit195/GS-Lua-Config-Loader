const TemplateCode = `--[[
                           _   _     __    ___    _____ 
                          (_) | |   /_ |  / _ \\  | ____|
   ___   ___   _ __ ___    _  | |_   | | | (_) | | |__
  / __| / __| | '_ \` _ \\  | | | __|  | |  \\__, | |___ \\
 | (__  \\__ \\ | | | | | | | | | |_   | |    / /   ___) |
  \\___| |___/ |_| |_| |_| |_|  \\__|  |_|   /_/   |____/
   
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

local function LoadLuas()
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
end

local function LoadConfig()
    {{#if isEmbedded}}
    config.import([[{{config}}]])
    {{else}}
    config.load("{{config}}")
    {{/if}}
end

local function Initiate()
    LoadLuas()
    client.delay_call({{configDelay}}, LoadConfig)
    
    local ReloadExists, _ = pcall(ui.reference, "CONFIG", "Lua", "Reload Config")

    if not ReloadExists then
        ui.new_button("CONFIG", "Lua", "Reload Config", LoadConfig)
    else
        client.error_log("Another Loader is already loaded, please unload it before loading another one, otherwise you will have config issues.")
    end

    client.set_event_callback("shutdown", Cleanup)
end

Initiate()`;

const Template = Handlebars.compile(TemplateCode);

const Step1 = $('#steps > li:nth-child(1)');
const Step1_ListBox = Step1.find('.content > ul');
const Step1_Input = Step1.find('.content input');
const Step1_Button = Step1.find('.content button');

const Step2 = $('#steps > li:nth-child(2)');
const Step2_Input = Step2.find('.content input');
const Step2_TextArea = Step2.find('.content textarea');
const Step2_Button = Step2.find('.content button');
const Step2_Range =  Step2.find('#configdelay');

function Initiate() {
    // Notice Code
    // TODO: This will block future notices, fix this
    if (localStorage.getItem('Notice') != 'true') {
        jQuery('.notice').show();
    }

    jQuery('.notice button').click(function(){
        jQuery('.notice').hide();
        localStorage.setItem('Notice', 'true');
    }).css('cursor', 'pointer');

    // Step 1 Code
    Step1_Button.click(function() {
        let Value = Step1_Input.val();
        if (Value) {
            // Check if li.empty exists, if so hide it
            if (Step1_ListBox.find('li.empty').length > 0) {
                Step1_ListBox.find('li.empty').hide();
            }

            if (Value.toLowerCase().endsWith('.lua')) {
                Value = Value.substring(0, Value.length - 4);
            }
            
            Step1_ListBox.append(`<li><button onclick="Delete(this);">X</button><span>${Value}</span></li>`);
            Step1_Input.val('');
        }
    });

    Step1_Input.on('keyup', function(e) {
        if (e.keyCode == 13) {
            Step1_Button.click();
        }
    });

    const Dropper = $('ul.listbox.outline');

    Dropper.on('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const Files = e.originalEvent.dataTransfer.files;
        const Luas = [];

        for (let i = 0; i < Files.length; i++) {
            const File = Files[i];
            if (File.name.endsWith('.lua')) {
                Luas.push(File.name.replace('.lua', ''));
            }
        }

        if (Luas.length > 0) {
            Step1_ListBox.find('li.empty').hide();
            for (let i = 0; i < Luas.length; i++) {
                Step1_ListBox.append(`<li><button onclick="Delete(this);">X</button><span>${Luas[i]}</span></li>`);
            }
        }
    }).on('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }).on('dragend', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }).on('dragstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
    }).on('drag', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });

    // Step 2 Code
    Step2_Input.on('keyup', function(e) {
        if (Step2_TextArea.val()) {
            Step2_TextArea.val('');
        }
    });

    Step2_TextArea.on('keyup', function(e) {
        if (Step2_Input.val()) {
            Step2_Input.val('');
        }
    });

    Step2_Button.click(function() {
        const Luas = Step1_ListBox.find('li').not('.empty').map(function() {
            return $(this).find('span').text();
        }).get();

        const ConfigInput = Step2_Input.val();
        const ConfigEmbed = Step2_TextArea.val();
        const IsEmbed = Step2_TextArea.val();

        console.log(IsEmbed);

        const code = GenerateScript(Luas, IsEmbed ? ConfigEmbed : ConfigInput, IsEmbed);
        Download('load_NameMe.lua', code);
    });

    Step2_Range.on('input', function() {
        const Value = $(this).val();

        $(this).attr('data-value', Value);
    });

}

function Delete(elem){
    $(elem).parent().remove();

    // Check if list is empty, if so, show empty li
    if (Step1_ListBox.find('li').length == 1) {
        Step1_ListBox.find('li.empty').show();
    }
}

function Download(filename, data) {
    var blob = new Blob([data], {type: 'text/lua'});
    if ( window.navigator.msSaveOrOpenBlob ) {
      window.navigator.msSaveBlob(blob, filename);
    } else {
      var elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = filename;        
      document.body.appendChild(elem);
      elem.click();        
      document.body.removeChild(elem);
    }
}

function GenerateScript(Luas, Config, IsEmbed) {
    const Context = {
        isEmbedded: IsEmbed,
        luas: Luas,
        configDelay: Step2_Range.val() || 0,
        config: Config
    };

    return Template(Context);
}

Initiate();