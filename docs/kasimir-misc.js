/* KasimirJS MISC - documentation: https://kasimirjs.infracamp.org - Author: Matthias Leuffen <m@tth.es>*/

/* from core/init.js */
if (typeof KaToolsV1 === "undefined") {
    window.KaToolsV1 = class {
    }

    /**
     * The last element started by Autostarter
     * @type {HTMLElement|HTMLScriptElement}
     */
    window.KaSelf = null;
}

/* from date/openhours.js */
KaToolsV1.openhours = class {

    constructor() {
        this._vacations = [];
        this._openHours = [];
    }

    addVacation(from, till, opt) {
        [from, till] = KaToolsV1.date.mkdate(from, till);
        this._vacations.push({from, till, opt});
    }

    addOpenHours(dayOfWeek, from, till, opt) {
        from = KaToolsV1.date.mkTime(from)
        till = KaToolsV1.date.mkTime(till)
        this._openHours.push({day: dayOfWeek, from, till, opt});
    }

    _sort() {
        let sort = (a, b) => {
            if (a.from.toString() === b.from.toString())
                return 0;
            return a.from.toString() < b.from.toString() ? -1 : 1
        };
        this._openHours.sort(sort);
        this._vacations.sort(sort);
    }

    /**
     * Return the Vacation if the current date in parameter 1 is during vacation
     *
     * @param date
     * @returns {null|*}
     */
    getVacation(date) {
        this._sort();
        let d = KaToolsV1.date;
        date = d.midnight(0, d.mkdate(date));
        let vac = this._vacations.find((item) => {
            return item.from <= date && item.till >= date
        });
        return typeof vac === "undefined" ? null : vac;
    }

    getOpenHoursForDay(date) {
        this._sort();
        date = KaToolsV1.date.mkdate(date);

        return this._openHours.filter((item) => {
            if (item.day !== date.getDay())
                return false;
            return item.from.toString() >= KaToolsV1.date.mkTime(date).toString()
        })
    }

    isOpen(date = null) {
        if (this.getVacation(date) !== null)
            return false;
        let openHours = this._openHours.filter((item) => {
            let curTime = KaToolsV1.date.mkTime(date).toString();
            if (item.day !== date.getDay())
                return false;
            if (item.from.toString() <= curTime && item.till.toString() >= curTime)
                return true;
            return false;
        })
        return openHours.length > 0;
    }

    getOpenHoursStruct(date = null) {
        date = KaToolsV1.date.mkdate(date);
        let status = {
            status: null,
            open_till: null,
            opens: null
        }
    }

}

/* from date/date.js */

KaToolsV1.date = class {

    static MSEC_PER_SECOND = 1000;
    static MSEC_PER_DAY = 86400 * 1000;
    /**
     * Format unix like time
     *
     * Y-m-d H:i:s   => 2022-05-01 15:44:01
     *
     * @param format
     * @param date
     * @returns string
     */
    static date(format, date=null) {
        if (date === null)
            date = new Date();
        return format
            .replace("Y", date.getFullYear())
            .replace("m", (date.getMonth()+1).toString().padStart(2, '0'))
            .replace("d", date.getDate().toString().padStart(2, '0'))
            .replace("H", date.getHours().toString().padStart(2, '0'))
            .replace("i", date.getMinutes().toString().padStart(2, '0'))
            .replace("s", date.getSeconds().toString().padStart(2, '0'))
    }

    static strtodate(input) {
        let matches = input.match(/^([0-9]{4,4})-([0-9]{2,2})-([0-9]{2,2})$/);
        if (matches !== null) {
            return new Date(matches[1], matches[2], matches[3]);
        }
        throw `Cannot strtodate(${input})`;
    }


    /**
     *
     * @param date
     * @returns {Date}
     */
    static mkdate(date=null) {
        let ret = Array.from(arguments).map(date => {
            if (date === null)
                return new Date();
            return new Date(date);
        });
        if (arguments.length === 1)
            return ret[0];
        return ret;
    }

    /**
     * Return the Midnight start of the day. Optional dayOffset to select next, previous days
     *
     * @param date
     * @param dayOffset
     * @returns {Date}
     */
    static midnight(dayOffset=0, date = null) {
        if (typeof dayOffset !== "number")
            throw "Invalid dayOffset. Expected number found" + dayOffset;
        date = this.mkdate(date);
        let curDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        return new Date(+curDay + (this.MSEC_PER_DAY * dayOffset));
    }

    /**
     * Return midnight of the last day specified in parameter 1 (0: Sunday, 1: Monday)
     *
     * @param day
     * @param date
     * @returns {Date}
     */
    static dayOfWeek(day = 0, date = null) {
        date = this.mkdate(date);

        for(let offset = 0; offset > -8; offset--) {
            let cur = this.midnight(date, offset);
            if (cur.getDay() === dayOfWeek)
                return cur;
        }
    }

    /**
     * Return HHiiss String
     *
     * @param time
     * @returns {string|*}
     */
    static mkTime(time) {
        if (time instanceof Date)
            return new KaToolsV1.time(time.getHours(), time.getMinutes(), time.getSeconds());
        return KaToolsV1.time.create(time);
    }

    /**
     * Return true if the date in parameter 1 is a Time (Hour, Minute) between from and till
     *
     * @param date
     * @param from
     * @param till
     * @returns {boolean}
     */
    static isInTimeInterval(date=null, from=null, till=null) {
        let time = this.mkTime(this.mkdate(date));

        if (from !== null) {
            from = this.mkTime(from)
            if (cmp < from)
                return false; // Before from
        }
        if (till !== null) {
            till = this.mkTime(till)
            if (cmp > till)
                return false; // Before from
        }
        return true;
    }

}

/* from date/time.js */

KaToolsV1.time = class {

    constructor(hour, minute, seconds) {
        this.hour = parseInt(hour);
        this.minute = parseInt(typeof minute === "undefined" ? ß : minute)
        this.seconds = parseInt(typeof seconds === "undefined" ? 0 : seconds)
    }


    static create(timeString) {
        let hour, minute, seconds;
        [hour, minute, seconds] = timeString.split(":");
        return new this(hour, minute, seconds);
    }

    toString(format="H:i:s") {
        return format
            .replace("H", this.hour.toString().padStart(2,0))
            .replace("i", this.minute.toString().padStart(2,0))
            .replace("s", this.seconds.toString().padStart(2,0))

    }
}

/* from test/assert.js */

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
