
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


    static offset(dayOffset = 0, date=null) {
        if (typeof dayOffset !== "number") {
            console.error("Invalid dayOffset");
            throw new Error("Invalid dayOffset. Expected number found" + dayOffset);
        }
        date = this.mkdate(date);
        return new Date(+date + (this.MSEC_PER_DAY * dayOffset));
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
            let cur = this.midnight(offset, date);
            if (cur.getDay() === day)
                return cur;
        }
    }

    /**
     * Return HHiiss String
     *
     * @param time
     * @returns {KaToolsV1.time}
     */
    static mkTime(time) {
        if (time instanceof Date)
            return new KaToolsV1.time(time.getHours(), time.getMinutes(), time.getSeconds());
        return KaToolsV1.time.create(time);
    }

    /**
     *
     * @param time
     * @param date
     * @returns {Date}
     */
    static setTime(time, date=null) {
        time = this.mkTime(time);
        date = this.mkdate(date);
        date.setHours(time.hour);
        date.setMinutes(time.minute);
        date.setSeconds(time.seconds);
        return date;
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

    static getCalendar(startDate = null, weeks=8) {
        startDate = this.mkdate(startDate);

        // Start on last Monday

        startDate = this.dayOfWeek(0, startDate);

        let lastDate = startDate;
        let weekArray = [{type: "month", date: startDate}];
        for(let weekIdx = 0; weekIdx < weeks; weekIdx++) {
            let curWeekArr = {type: "week", days: []};
            for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
                let curDate = this.offset(1, lastDate);
                if (curDate.getMonth() !== lastDate.getMonth()) {
                    for(let shiftIdx=dayIdx; shiftIdx < 7; shiftIdx++)
                        curWeekArr.days.push(null);
                    weekArray.push(curWeekArr);
                    weekArray.push({type: "month", date: curDate});
                    curWeekArr = {type: "week", days: []};
                    for(let shiftIdx=0; shiftIdx < dayIdx; shiftIdx++)
                        curWeekArr.days.push(null);
                }
                curWeekArr.days.push(curDate);
                lastDate = curDate;
            }
            weekArray.push(curWeekArr);
        }
        return weekArray;
    }

}
