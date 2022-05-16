<?php

namespace KasimirJS;

require __DIR__ . "/../vendor/autoload.php";

header("Content-Type: text/javascript");

$data = KasimirLoader::Load();
if ($data !== file_get_contents(__DIR__ . "/kasimir-misc.js"))
    file_put_contents(__DIR__ . "/kasimir-misc.js", $data);

