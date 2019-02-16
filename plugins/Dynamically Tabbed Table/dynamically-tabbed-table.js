/**
 * Dynamically Tabbed Table
 *
 * Author: Jordan
 * Created: November 10, 2012
 * Last Modified: February 27, 2013
 */

var dtt = {

    /** If the browser supports the HTML5 localStorage feature */
    hasLocalStorage: window.localStorage ? true : false,

    /** The local storage key that we will store the data by */
    localStorageKey: 'dtt-plugin',

    /**
     * Data stored by the script in the following format.
     * {
     *   tab: 2, // The selected tab id starting from 0 (so this is the 3rd tab from the left)
     *   hide: 0 // Hide the table content (not the title bar) if 1
     * }
     */
    jsonData: null,

    /** Proboards plugin data */
    plugin: null,

    /** Settings set by the user */
    settings: {},

    /** The currently selected tab */
    selected_tab: '',

    /**
     * Previously selected list item within a given tab
     * {
     *   tab_id: item_id_number
     * }
     */
    last_item: {},

    init: function() {
        if($('table.dtt').size() > 0) {
            this.loadPluginData();
            this.loadJsonData();
            this.configureTable();

            // If the user wants to move the dtt
            if($('#move-dtt').size() > 0) {
                $('#move-dtt').append($('table.dtt'));
            }
        }
    },

    // Loads the Proboards plugin data
    loadPluginData: function() {
        this.plugin = proboards.plugin.get('dynamically_tabbed_table');
        this.settings = {

            /** Tab data */
            tabs: this.plugin.settings.tabs,
            default_tab: null,

        };

        // Find the default tab. Tab IDs start at 0.
        var counter = 0;
        for(var key in this.settings.tabs) {
            if(this.settings.tabs[key].default_tab == '1') {
                this.settings.default_tab = counter;
                break;
            }
            counter++;
        }
    },

    // Finds any stored data for this script
    loadJsonData: function() {
        if(this.hasLocalStorage) {
            var data = window.localStorage[this.localStorageKey];

            if(data) {
                this.jsonData = $.parseJSON(data);
            }
            else {
                this.jsonData = {
                    tab: this.settings.default_tab,
                    hide: 0
                };
            }
        }
    },

    // Returns the data stored by the given key
    get: function(_key) {
        var result = null;

        if(this.jsonData) {
            result = this.jsonData[_key];
        }

        return result;
    },

    // Called when a user clicks on a list item within a tab
    toggleItem: function(_this, _item_id) {
        var tab_container = $(_this).parents('div[class*="dtt_tab_content_"]');
        var tab_id = tab_container.attr('class');
        var item_content = tab_container.find('div.dtt-item-content div.item' + _item_id);
        var default_content = tab_container.find('div.dtt-item-content div.default');

        if(item_content.is(':hidden')) {

            // Hide the default item just in case it is in view
            default_content.hide();

            // Get the class name (which acts as an id) of the last selected item in this tab
            var previous_item_id = this.last_item[tab_id];
            if(previous_item_id !== undefined) {
              tab_container.find('div.dtt-item-content div.item' + previous_item_id).hide();
            }

            // Update the last selected item id and show the new item
            this.last_item[tab_id] = _item_id;
            item_content.show();
        }
        else {
            default_content.show();
            item_content.hide();
        }
    },

    toggleTab: function(_tab) {
        var table = $('table.dtt');
        var new_tab_id = _tab.attr('class').match(/dtt_tab_title_(\d+)/i)[0].replace(/dtt_tab_title_/i, '');
        var old_tab_id = this.selected_tab;

        // Hide the current tab
        if(old_tab_id != '') {
            table.find('th.dtt_tab_title_' + old_tab_id)
                .removeClass('state-selected');
            table.find('div.dtt_tab_content_' + old_tab_id).hide();
        }

        // Show the new tab
        table.find('th.dtt_tab_title_' + new_tab_id)
            .addClass('state-selected');
        table.find('div.dtt_tab_content_' + new_tab_id).show();

        // Update settings
        this.selected_tab = new_tab_id;

        // Save the changes to localStorage
        this.jsonData.tab = this.selected_tab;
        window.localStorage[this.localStorageKey] = JSON.stringify(this.jsonData);
    },

    // Configures the table based on the plugin settings
    configureTable: function() {
        var self = this;

        /* TODO: Add support for more than one table */
        var table = $('table.dtt');

        var dtt_tab_row = table.find('tr.dtt_tabs');
        var dtt_tab_titles = dtt_tab_row.find('> th');

        var dtt_tabs_content = table.find('td.dtt_tabs_content');
        var dtt_tab_divs = dtt_tabs_content.find('> div');

        var tab_width = (100 / this.settings.tabs.length) + '%';
        var counter = 0;

        var default_tab_id = this.settings.default_tab;
        var default_tab = null;

        if(default_tab_id == null || default_tab_id >= this.settings.tabs.length || default_tab_id < 0) {
            default_tab_id = this.settings.default_tab = 0;
        }

        // Check localStorage for the selected tab
        var selected_tab = this.get('tab');
        if(selected_tab != null && selected_tab < this.settings.tabs.length && selected_tab >= 0) {
            default_tab_id = selected_tab;
        }

        // Set the width and add listeners for each tab
        dtt_tab_titles.each(function() {

            // Give the tab a classname of dtt_tab_title_#
            $(this)
                .addClass('dtt_tab_title_' + counter)
                .css('width', tab_width)
                // This isn't working for some reason
                //.on('click', function() {
                //    self.toggleTab($(this));
                //});

            if(counter == default_tab_id) {
                default_tab = $(this);
            }

            counter++;
        });

        counter = 0;

        // Give each tab's corresponding content div a classname of dtt_tab_content_#
        dtt_tab_divs.each(function() {
            $(this).addClass('dtt_tab_content_' + counter);
            counter++;
        });

        // Remove the border off the last tab
        dtt_tab_titles.last().addClass('last');

        // Toggle the default tab
        this.toggleTab(default_tab);

        // Display the table
        table.show();
    }
};

$(document).ready(function() {
    dtt.init();
});