
KaToolsV1.assert = {
    fail: function (msg) {
        let args = Array.from(arguments);
        console.error("[test]", ...args);
        throw "[test] " + args.join(" ");
    },

    eq: function (expected, actual) {
        if (expected !== actual) {
            KaToolsV1.assert.fail("Expected equals: Expected", expected, "Found:", actual);
        }
    },
    isObject: function (actual) {
        if (typeof actual !== "object")
            KaToolsV1.assert.fail("Expected object: Found:", actual);
    }
}
