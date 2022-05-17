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

    getOpenHoursForDate(date) {
        if (this.getVacation(date) !== null)
            return [];
        return this.getOpenHoursForDay(date);
    }


    isOpen(date = null) {
        date = KaToolsV1.date.mkdate(date);
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

    getNextOpenDate (date = null) {
        date = KaToolsV1.date.mkdate(date);


        for(let dayOffset = 0; dayOffset < 60; dayOffset++) {
            let curDate = KaToolsV1.date.offset(dayOffset, date);
            if (dayOffset > 0)
                curDate = KaToolsV1.date.midnight(dayOffset, date);

            if (this.getVacation(curDate) !== null)
                continue;

            let openHours = this.getOpenHoursForDay(curDate);
            let foundOpenHours = openHours.filter((item) => {
                let curTime = KaToolsV1.date.mkTime(curDate);
                if (curTime.toString() < item.from.toString())
                    return true;
                return false;
            });
            if (foundOpenHours.length === 0)
                continue;
            return KaToolsV1.date.setTime(foundOpenHours[0].from, curDate);
        }
        return null;
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
