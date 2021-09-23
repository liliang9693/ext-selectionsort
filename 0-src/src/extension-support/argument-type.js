/**
 * Block argument types
 * @enum {string}
 */
const ArgumentType = {
    ANGLE: 'angle',
    BOOLEAN: 'Boolean',
    COLORPICKER: 'colorpicker',
    COLORPALETTE: 'colorpalette',
    SHOWLIGHTS: 'showLights',
    RANGE: 'range',
    NUMBER: 'number',
    STRING: 'string',
    INFRAREDTEXT: 'infraredBtn',
    OBLOQPARAMETER: 'obloq_initial_parameter',
    MQTTPARAMETER: 'mqtt_setting_parameter',
    OBLOQHTTPPARAMETER: 'obloq_initial_http_parameter',
    SETTINGS: 'settings',
    TINYDBPARAMETER: 'tinydb_settings_parameter',
    ESP32IMGSETTING: 'esp32_img_settings',
    MPYSHOWIMG: 'mpy_show_img',
    OLED2864IMGSETTING: 'oled2864_img_settings',
    ESP32TEXTPREVIEW: 'esp32_text_preview',
    OLED2864TEXTPREVIEW: 'oled2864_text_preview',
    PIANO: 'piano',
    STMOTORAXIS: 'stepper_motor_axis_setting',
    PICTUREAIUSERCONFIG: 'pictureai_userserver',
    PICTUREAIIMAGESETTING: 'pictureai_img_setting',
    PICTUREAIDIRSETTING: 'pictureai_dir_setting',
    PICTUREAIWEBIMGSETTING: 'pictureai_webimg_setting',
    CAMERALIST: "cameralist_menu",
     /**
     * String value with matirx field
     */
    MATRIX: 'matrix',
    MATRIXICONS: 'matrix_icons',
    NOTE: 'note',
    CITYMENU: 'city_menu',
    CONTENTINPUT: 'content_input',
    NUMBERDROPDOWN: 'number_dropdown',
    TEXTDROPDOWN: 'text_dropdown'
};

module.exports = ArgumentType;
