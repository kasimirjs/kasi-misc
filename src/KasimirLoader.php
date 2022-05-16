<?php

namespace KasimirJS;

class KasimirLoader
{


    const MAP = [
        "core/init.js",

        "date/openhours.js",
        "date/date.js",
        "date/time.js",

        "test/assert.js"
    ];


    public static function Load()
    {
        $output = "/* KasimirJS MISC - documentation: https://kasimirjs.infracamp.org - Author: Matthias Leuffen <m@tth.es>*/\n";
        foreach (self::MAP as $value) {
            $output .= "\n/* from $value */\n";
            $output .= file_get_contents(__DIR__ . "/" . $value);
        }
        return $output;
    }

}
